import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import { buyAthlete, EquipeServiceError, getMyTeam } from './equipe.service';
import {
  salvarEstadoEquipe,
  TeamSnapshotError,
  type SalvarEstadoInput
} from './team-snapshot.service';

type BuyAthleteBody = {
  atleta_id: number;
  user_id?: number;
};

type SalvarEstadoBody = {
  user_id?: number;
  positions: SalvarEstadoInput['positions'];
  items?: number[];
};

const errorSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: 'string' }
  }
} as const;

const positionSchema = {
  type: 'object',
  required: ['athleteId', 'posX', 'posY'],
  properties: {
    athleteId: { type: 'integer', example: 21 },
    posX: { type: 'integer', minimum: 0, maximum: 2, example: 0 },
    posY: { type: 'integer', minimum: 0, maximum: 2, example: 0 }
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
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const team = await getMyTeam(request.user!.id);
    return reply.code(200).send(team);
  });

  app.post<{ Body: BuyAthleteBody }>(
    '/comprar-atleta',
    { preHandler: [authenticate] },
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

      try {
        const result = await buyAthlete(authenticatedUserId, athleteId);
        return reply.code(201).send(result);
      } catch (error: unknown) {
        if (error instanceof EquipeServiceError) {
          if (error.code === 'USER_NOT_FOUND') {
            return reply.code(404).send({ message: error.message, code: error.code });
          }

          if (error.code === 'ATHLETE_NOT_AVAILABLE') {
            return reply.code(404).send({ message: error.message, code: error.code });
          }

          return reply.code(400).send({ message: error.message, code: error.code });
        }

        throw error;
      }
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
          'Persiste imutavelmente a formacao da equipe (exatamente 6 atletas em um grid 3x3) em team_snapshots. Bloqueia atletas que nao pertencem ao inventario do usuario e impede salvamento incompleto. Itens estao reservados para a Sprint 5.',
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
              minItems: 6,
              maxItems: 6,
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
          400: errorSchema,
          403: errorSchema,
          404: errorSchema
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

      try {
        const result = await salvarEstadoEquipe({
          userId: authenticatedUserId,
          positions: body.positions ?? [],
          items: body.items
        });
        return reply.code(200).send(result);
      } catch (error: unknown) {
        if (error instanceof TeamSnapshotError) {
          const status = error.code === 'TEAM_NOT_FOUND' ? 404 : 400;
          return reply
            .code(status)
            .send({ message: error.message, code: error.code });
        }
        throw error;
      }
    }
  );
};
