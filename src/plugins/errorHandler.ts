import { type FastifyError, type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';

import { CampaignServiceError } from '../modules/partida/campaign.service';
import { ServiceError as AuthServiceError } from '../modules/auth/auth.service';
import { EquipeServiceError } from '../modules/equipe/equipe.service';
import { ItemServiceError } from '../modules/itens/itens.service';
import { MatchmakingError } from '../modules/matchmaking/matchmaking.service';
import { MercadoServiceError } from '../modules/mercado/mercado.service';
import { RankingServiceError } from '../modules/ranking/ranking.service';
import { RodadaServiceError } from '../modules/partida/rodada.service';
import { SimuladorServiceError } from '../modules/simulador/simulador.errors';
import { TeamSnapshotError } from '../modules/equipe/team-snapshot.service';

type ServiceErrorLike = Error & {
  readonly code: string;
  /**
   * Chave hierarquica i18n quando o servico segue a convencao do WS-02
   * (ex.: `equipe.buyAthlete.insufficientBalance`). Quando ausente, o handler
   * cai no namespace de erro derivado do `code`.
   */
  readonly i18nKey?: string;
  /**
   * Parametros adicionais usados na interpolacao de mensagens i18n
   * (`req.t(key, params)`). Quando ausentes, o handler chama `req.t(key)`.
   */
  readonly params?: Record<string, unknown>;
};

/**
 * Convencao de fallback: cada subclasse de ServiceError reside em um namespace
 * i18n dedicado (`auth`, `equipe`, ...). Quando o servico nao define um
 * `i18nKey` proprio, traduzimos `<namespace>.errors.<CODE>`.
 */
const NAMESPACE_BY_ERROR_CLASS: Record<string, string> = {
  ServiceError: 'auth',
  MercadoServiceError: 'mercado',
  EquipeServiceError: 'equipe',
  TeamSnapshotError: 'equipe',
  ItemServiceError: 'itens',
  RodadaServiceError: 'partida',
  CampaignServiceError: 'partida',
  MatchmakingError: 'partida',
  RankingServiceError: 'ranking',
  SimuladorServiceError: 'simulador'
};

type ErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

/**
 * Mapeia o `code` de cada ServiceError para o status HTTP que as rotas
 * antigas retornavam manualmente nos try/catch. Mantemos o comportamento
 * existente para nao quebrar contratos com o front antes de WS-08.
 */
const STATUS_BY_KEY: Record<string, number> = {
  // Auth (ServiceError)
  'AuthServiceError:CONFLICT': 409,
  'AuthServiceError:INVALID_CREDENTIALS': 401,
  'AuthServiceError:NOT_FOUND': 404,
  'AuthServiceError:FORBIDDEN': 403,

  // Mercado
  'MercadoServiceError:USER_NOT_FOUND': 404,
  'MercadoServiceError:INSUFFICIENT_COINS': 400,

  // Equipe
  'EquipeServiceError:USER_NOT_FOUND': 404,
  'EquipeServiceError:TEAM_NOT_FOUND': 404,
  'EquipeServiceError:ATHLETE_NOT_AVAILABLE': 404,
  'EquipeServiceError:ATHLETE_NOT_OWNED': 404,
  'EquipeServiceError:INSUFFICIENT_COINS': 400,
  'EquipeServiceError:TEAM_FULL': 400,

  // Team Snapshot
  'TeamSnapshotError:TEAM_NOT_FOUND': 404,
  'TeamSnapshotError:INVALID_BODY': 400,
  'TeamSnapshotError:WRONG_ATHLETE_COUNT': 400,
  'TeamSnapshotError:DUPLICATE_ATHLETE': 400,
  'TeamSnapshotError:DUPLICATE_POSITION': 400,
  'TeamSnapshotError:OUT_OF_BOUNDS': 400,
  'TeamSnapshotError:ATHLETE_NOT_IN_TEAM': 400,
  'TeamSnapshotError:ITEM_NOT_IN_INVENTORY': 400,

  // Itens
  'ItemServiceError:USER_NOT_FOUND': 404,
  'ItemServiceError:ITEM_NOT_FOUND': 404,
  'ItemServiceError:ITEM_INACTIVE': 400,
  'ItemServiceError:INSUFFICIENT_COINS': 400,
  'ItemServiceError:NO_INVENTORY_ITEM': 400,
  'ItemServiceError:NO_SNAPSHOT': 400,
  'ItemServiceError:ATHLETE_NOT_IN_SNAPSHOT': 400,
  'ItemServiceError:STACK_NOT_ALLOWED': 400,

  // Partida / Rodada
  'RodadaServiceError:TEAM_NOT_FOUND': 404,
  'RodadaServiceError:SNAPSHOT_NOT_FOUND': 404,
  'RodadaServiceError:USER_NOT_FOUND': 404,
  'RodadaServiceError:SNAPSHOT_FORBIDDEN': 403,
  'RodadaServiceError:TEAM_EMPTY': 400,
  'RodadaServiceError:NO_OPPONENT_FOUND': 400,

  // Partida / Campaign
  'CampaignServiceError:USER_NOT_FOUND': 404,
  'CampaignServiceError:INVALID_TEAM_NAME': 400,

  // Ranking
  'RankingServiceError:USER_NOT_FOUND': 404,

  // Matchmaking
  'MatchmakingError:NO_OPPONENT_FOUND': 400,

  // Simulador (defaults internos; sao bugs ou bad request)
  'SimuladorServiceError:INVALID_TOTAL_TURNS': 400,
  'SimuladorServiceError:NO_RECEIVER_AVAILABLE': 500,
  'SimuladorServiceError:BALL_HOLDER_NOT_FOUND': 500
};

const isServiceErrorLike = (error: unknown): error is ServiceErrorLike => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error instanceof AuthServiceError ||
    error instanceof MercadoServiceError ||
    error instanceof EquipeServiceError ||
    error instanceof TeamSnapshotError ||
    error instanceof ItemServiceError ||
    error instanceof RodadaServiceError ||
    error instanceof CampaignServiceError ||
    error instanceof RankingServiceError ||
    error instanceof MatchmakingError ||
    error instanceof SimuladorServiceError
  );
};

const statusForServiceError = (error: ServiceErrorLike): number => {
  const key = `${error.constructor.name}:${error.code}`;
  const mapped = STATUS_BY_KEY[key];
  if (mapped !== undefined) {
    return mapped;
  }

  // Fallback: a classe pode expor `statusCode` (caso do SimuladorServiceError).
  const fallback = (error as { statusCode?: unknown }).statusCode;
  if (typeof fallback === 'number') {
    return fallback;
  }

  return 500;
};

const isFastifyValidationError = (error: FastifyError): boolean =>
  Array.isArray(error.validation) && error.validation.length > 0;

const isFastifyError = (error: unknown): error is FastifyError => {
  if (!(error instanceof Error)) {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && code.startsWith('FST_');
};

/**
 * Resolve a mensagem traduzida para um `code` de servico via `req.t`.
 *
 * Estrategia:
 * 1. Chama `req.t(code, params)` com a chave hierarquica do erro
 *    (ex.: `equipe.buyAthlete.insufficientBalance`).
 * 2. Quando o i18next nao encontra a chave (por defeito ele retorna a propria
 *    chave), caimos no `error.message` original — preservando assim qualquer
 *    fallback definido no servico.
 */
const translateServiceError = (
  request: FastifyRequest,
  error: ServiceErrorLike
): string => {
  const translator = request.t;
  if (typeof translator !== 'function') {
    return error.message;
  }
  const params = (error.params ?? {}) as Record<string, unknown>;
  const namespace = NAMESPACE_BY_ERROR_CLASS[error.constructor.name];
  const candidates = [
    error.i18nKey,
    namespace ? `${namespace}.errors.${error.code}` : undefined,
    error.code
  ].filter((key): key is string => typeof key === 'string' && key.length > 0);

  for (const key of candidates) {
    const translated = translator(key, params);
    if (typeof translated === 'string' && translated.length > 0 && translated !== key) {
      return translated;
    }
  }
  return error.message || error.code;
};

const translateGeneric = (
  request: FastifyRequest,
  key: string,
  fallback: string,
  params?: Record<string, unknown>
): string => {
  const translator = request.t;
  if (typeof translator !== 'function') {
    return fallback;
  }
  const translated = translator(key, params ?? {});
  if (typeof translated !== 'string' || translated.length === 0 || translated === key) {
    return fallback;
  }
  return translated;
};

/**
 * Error handler global do Fastify.
 *
 * Estrategia:
 * - Subclasses de ServiceError viram payload `{ code, message, details? }`
 *   com o status mapeado pela tabela acima. A mensagem e resolvida via
 *   `req.t(error.code, error.params)`, com fallback no `error.message`.
 * - Erros de validacao do schema (validation) e demais erros internos do
 *   Fastify (FST_*) preservam o statusCode original e usam `common.*`.
 * - Qualquer outro erro nao tratado vira 500 INTERNAL_ERROR e e logado
 *   com `request.log.error` para investigacao posterior.
 */
export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error, request: FastifyRequest, reply: FastifyReply) => {
    if (isServiceErrorLike(error)) {
      const status = statusForServiceError(error);
      const message = translateServiceError(request, error);
      const payload: ErrorPayload = {
        code: error.code,
        message
      };

      if (status >= 500) {
        request.log.error(
          { err: error, code: error.code },
          'Service error 5xx ao atender requisicao'
        );
      } else {
        request.log.warn(
          { code: error.code, statusCode: status },
          'Service error tratado'
        );
      }

      return reply.code(status).send(payload);
    }

    if (isFastifyError(error)) {
      const status = error.statusCode ?? 500;

      if (isFastifyValidationError(error)) {
        request.log.warn(
          { validation: error.validation, code: error.code },
          'Erro de validacao do schema'
        );

        return reply.code(status).send({
          code: 'VALIDATION_ERROR',
          message: translateGeneric(
            request,
            'common.validationError',
            error.message
          ),
          details: error.validation
        });
      }

      request.log.warn(
        { err: error, code: error.code, statusCode: status },
        'Erro interno do Fastify'
      );

      return reply.code(status).send({
        code: error.code,
        message: error.message
      });
    }

    request.log.error({ err: error }, 'Erro nao tratado');

    return reply.code(500).send({
      code: 'INTERNAL_ERROR',
      message: translateGeneric(
        request,
        'common.internalError',
        'Erro interno do servidor.'
      )
    });
  });
};
