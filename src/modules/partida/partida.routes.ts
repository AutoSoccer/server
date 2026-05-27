import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import { PartidaServiceError, simulateMatch } from './partida.service';

const athleteSimSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    velocity: { type: 'integer' },
    attack: { type: 'integer' },
    defense: { type: 'integer' }
  }
} as const;

const teamDtoSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    athlethes: { type: 'array', items: athleteSimSchema },
    turn: { type: 'integer' },
    victorys: { type: 'integer' },
    loses: { type: 'integer' },
    athletesPositions: {
      type: 'array',
      description: 'Grid 3x3 com atletas posicionados (defesa/meio/ataque).',
      items: {
        type: 'array',
        items: {
          oneOf: [athleteSimSchema, { type: 'null' }]
        }
      }
    }
  }
} as const;

const turnEventSchema = {
  type: 'object',
  properties: {
    turn: { type: 'integer', example: 1 },
    possession: { type: 'string', enum: ['player', 'opponent'] },
    ballRow: { type: 'integer', enum: [0, 1, 2] },
    kind: {
      type: 'string',
      enum: ['pass', 'tackle', 'shot', 'turnover']
    },
    attackerTeamId: { type: 'integer' },
    defenderTeamId: { type: 'integer' },
    attackerId: { type: ['integer', 'null'] },
    attackerName: { type: ['string', 'null'] },
    defenderId: { type: ['integer', 'null'] },
    defenderName: { type: ['string', 'null'] },
    attackerRoll: { type: 'number' },
    defenderRoll: { type: 'number' },
    success: { type: 'boolean' },
    goal: { type: 'boolean' },
    description: { type: 'string' }
  }
} as const;

const matchResultSchema = {
  type: 'object',
  properties: {
    player: teamDtoSchema,
    opponent: teamDtoSchema,
    score: {
      type: 'object',
      properties: {
        player: { type: 'integer', example: 1 },
        opponent: { type: 'integer', example: 0 }
      }
    },
    winner: { type: 'string', enum: ['player', 'opponent', 'draw'] },
    totalTurns: { type: 'integer', example: 12 },
    events: { type: 'array', items: turnEventSchema },
    persisted: {
      type: 'object',
      properties: {
        teamId: { type: 'integer' },
        victory: { type: 'integer' },
        lose: { type: 'integer' }
      }
    }
  }
} as const;

const errorSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: 'string' }
  }
} as const;

export const partidaRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/simular',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Partida'],
        summary:
          'Simula uma partida de 12 turnos contra um adversario gerado automaticamente',
        description:
          'Carrega o time autenticado, gera um adversario sintetico com atletas aleatorios, executa o motor de simulacao (Task 4.2) e persiste victory/lose no time.',
        security: [{ BearerAuth: [] }],
        response: {
          200: matchResultSchema,
          400: errorSchema,
          404: errorSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const result = await simulateMatch(request.user!.id);
        return reply.code(200).send(result);
      } catch (error: unknown) {
        if (error instanceof PartidaServiceError) {
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
