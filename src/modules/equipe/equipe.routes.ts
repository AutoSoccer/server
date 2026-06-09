import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import { buyAthlete, getMyTeam, sellAthlete } from './equipe.service';
import {
  MAX_POSITIONED_ATHLETES,
  MIN_POSITIONED_ATHLETES,
  salvarEstadoEquipe,
  type SalvarEstadoInput
} from './team-snapshot.service';

type BuyAthleteBody = {
  atleta_id: number;
  user_id?: number;
};

type SellAthleteBody = {
  atleta_id: number;
  user_id?: number;
};

type SalvarEstadoBody = {
  user_id?: number;
  positions: SalvarEstadoInput['positions'];
  items?: number[];
};

const errorRef = { $ref: '#/components/schemas/ErrorResponse' } as const;
const positionSchema = { $ref: '#/components/schemas/SnapshotPosition' } as const;

const compraVendaResponseSchema = {
  type: 'object',
  additionalProperties: true,
  properties: {
    user: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'integer' },
        coins: { type: 'integer' }
      }
    },
    team: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'integer' },
        athletes_count: { type: 'integer' }
      }
    },
    athlete: {
      type: 'object',
      additionalProperties: true,
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        cost: { type: 'integer' },
        refund: { type: 'integer' },
        tier: { type: 'string' },
        type: { type: 'string', enum: ['defender', 'midfielder', 'attacker'] }
      }
    }
  }
} as const;

const salvarEstadoResponseSchema = {
  type: 'object',
  properties: {
    snapshotId: { type: 'integer' },
    teamId: { type: 'integer' },
    round: { type: 'integer' },
    victory: { type: 'integer' },
    lose: { type: 'integer' },
    victoryRatio: { type: 'number' },
    positions: {
      type: 'array',
      description: 'Grid 3x3 de posicoes (defesa/meio/ataque)',
      items: {
        type: 'array',
        items: {
          oneOf: [
            {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                velocity: { type: 'integer' },
                attack: { type: 'integer' },
                defense: { type: 'integer' }
              }
            },
            { type: 'null' }
          ]
        }
      }
    }
  }
} as const;

export const equipeRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Equipe'],
        summary: 'Retorna a equipe do treinador autenticado',
        description:
          'Lista os atletas do time do usuario (campanha atual) com vitorias, derrotas e estatisticas agregadas. Retorna `null` quando ainda nao existe time.',
        security: [{ BearerAuth: [] }],
        response: {
          200: { $ref: '#/components/schemas/TeamResponse' },
          401: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const team = await getMyTeam(request.user!.id);
      return reply.code(200).send(team);
    }
  );

  app.post<{ Body: BuyAthleteBody }>(
    '/comprar-atleta',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Equipe'],
        summary: 'Compra um atleta do mercado e adiciona ao time (RF013)',
        description:
          'Debita o custo do atleta dos coins do usuario, anexa o atleta ao time e remove-o da janela de mercado, tudo em uma unica transacao.',
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          required: ['atleta_id'],
          additionalProperties: true,
          properties: {
            atleta_id: { type: 'integer', example: 21 },
            user_id: {
              type: 'integer',
              description:
                'Opcional. Quando informado deve coincidir com o usuario autenticado.'
            }
          }
        },
        response: {
          201: compraVendaResponseSchema,
          400: errorRef,
          401: errorRef,
          403: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const body = request.body;
      const athleteId = Number(body?.atleta_id);

      if (!Number.isInteger(athleteId) || athleteId <= 0) {
        return reply.code(400).send({ message: 'Campo atleta_id invalido.' });
      }

      const authenticatedUserId = request.user!.id;

      if (
        body?.user_id !== undefined &&
        Number(body.user_id) !== authenticatedUserId
      ) {
        return reply
          .code(403)
          .send({ message: 'user_id nao corresponde ao usuario autenticado.' });
      }

      const result = await buyAthlete(authenticatedUserId, athleteId);
      return reply.code(201).send(result);
    }
  );

  app.post<{ Body: SellAthleteBody }>(
    '/vender-atleta',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Equipe'],
        summary: 'Vende um atleta do time e devolve coins ao treinador',
        description:
          'Remove o atleta do time e credita o valor de reembolso (ATHLETE_SELL_REFUND) ao saldo do usuario em uma unica transacao.',
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          required: ['atleta_id'],
          additionalProperties: true,
          properties: {
            atleta_id: { type: 'integer', example: 21 },
            user_id: {
              type: 'integer',
              description:
                'Opcional. Quando informado deve coincidir com o usuario autenticado.'
            }
          }
        },
        response: {
          200: compraVendaResponseSchema,
          400: errorRef,
          401: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const body = request.body;
      const athleteId = Number(body?.atleta_id);

      if (!Number.isInteger(athleteId) || athleteId <= 0) {
        return reply.code(400).send({ message: 'Campo atleta_id invalido.' });
      }

      const authenticatedUserId = request.user!.id;

      if (
        body?.user_id !== undefined &&
        Number(body.user_id) !== authenticatedUserId
      ) {
        return reply
          .code(403)
          .send({ message: 'user_id nao corresponde ao usuario autenticado.' });
      }

      const result = await sellAthlete(authenticatedUserId, athleteId);
      return reply.code(200).send(result);
    }
  );

  app.post<{ Body: SalvarEstadoBody }>(
    '/salvar-estado',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Equipe'],
        summary: 'Salva o snapshot da equipe para a rodada atual (Task 3.2)',
        description:
          'Persiste imutavelmente a formacao da equipe (1 a 6 atletas em um grid 3x3) em team_snapshots. Bloqueia atletas que nao pertencem ao inventario do usuario e impede salvamento vazio. Itens estao reservados para a Sprint 5.',
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          required: ['positions'],
          additionalProperties: false,
          properties: {
            user_id: {
              type: 'integer',
              description:
                'Opcional. Quando informado deve coincidir com o usuario autenticado.'
            },
            positions: {
              type: 'array',
              minItems: MIN_POSITIONED_ATHLETES,
              maxItems: MAX_POSITIONED_ATHLETES,
              items: positionSchema
            },
            items: {
              type: 'array',
              items: { type: 'integer' },
              description: 'IDs de itens aplicados (Sprint 5 — atualmente recusado se enviado).'
            }
          }
        },
        response: {
          200: salvarEstadoResponseSchema,
          400: errorRef,
          403: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const authenticatedUserId = request.user!.id;
      const body = request.body ?? ({} as SalvarEstadoBody);

      if (
        body.user_id !== undefined &&
        Number(body.user_id) !== authenticatedUserId
      ) {
        return reply
          .code(403)
          .send({ message: 'user_id nao corresponde ao usuario autenticado.', code: 'USER_MISMATCH' });
      }

      const result = await salvarEstadoEquipe({
        userId: authenticatedUserId,
        positions: body.positions ?? [],
        items: body.items
      });
      return reply.code(200).send(result);
    }
  );
};
