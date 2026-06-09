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
 * Error handler global do Fastify.
 *
 * Estrategia:
 * - Subclasses de ServiceError (detectadas por instanceof + nominalmente
 *   pela propriedade `code`) viram payload `{ code, message, details? }`
 *   com o status mapeado pela tabela acima.
 * - Erros de validacao do schema (validation) e demais erros internos do
 *   Fastify (FST_*) preservam o statusCode original.
 * - Qualquer outro erro nao tratado vira 500 INTERNAL_ERROR e e logado
 *   com `request.log.error` para investigacao posterior.
 *
 * A mensagem segue vindo de `error.message`. WS-02 vai substituir esse
 * texto por uma traducao via `req.t(code)`.
 */
export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error, request: FastifyRequest, reply: FastifyReply) => {
    if (isServiceErrorLike(error)) {
      const status = statusForServiceError(error);
      const payload: ErrorPayload = {
        code: error.code,
        message: error.message
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
          message: error.message,
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
      message: 'Erro interno do servidor.'
    });
  });
};
