import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import { PartidaServiceError, simulateMatch } from './partida.service';
import { jogarRodada, RodadaServiceError } from './rodada.service';

type JogarRodadaBody = {
  user_id?: number;
  snapshot_id?: number;
};

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

const rodadaResultSchema = {
  type: 'object',
  properties: {
    player: teamDtoSchema,
    opponent: teamDtoSchema,
    score: {
      type: 'object',
      properties: {
        player: { type: 'integer', example: 2 },
        opponent: { type: 'integer', example: 1 }
      }
    },
    winner: { type: 'string', enum: ['player', 'opponent', 'draw'] },
    totalTurns: { type: 'integer', example: 12 },
    events: { type: 'array', items: turnEventSchema },
    matchmaking: {
      type: 'object',
      description: 'Detalhes do balanceamento RN006',
      properties: {
        snapshotId: { type: 'integer' },
        opponentSnapshotId: { type: 'integer' },
        opponentUserId: { type: 'integer' },
        victoryRatio: { type: 'number' },
        delta: { type: 'number', description: 'Diferenca |victoryRatio_player - victoryRatio_opp|' },
        windowUsed: { type: 'number', description: 'Tamanho da janela RN006 que retornou o adversario' }
      }
    },
    initiative: {
      type: 'object',
      description: 'Resultado da RN009 — quem comeca com a posse',
      properties: {
        playerLeadVelocity: { type: 'integer' },
        opponentLeadVelocity: { type: 'integer' },
        startsWith: { type: 'string', enum: ['player', 'opponent'] }
      }
    },
    persisted: {
      type: 'object',
      properties: {
        teamId: { type: 'integer' },
        victory: { type: 'integer' },
        lose: { type: 'integer' },
        round: { type: 'integer' }
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

  app.post<{ Body: JogarRodadaBody }>(
    '/jogar-rodada',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Partida'],
        summary:
          'Joga uma rodada com matchmaking baseado em vitorias (Task 4.3)',
        description:
          'Cria um snapshot da equipe do jogador (ou usa o snapshot_id informado), busca um adversario fantasma com victory_ratio proximo (RN006), calcula iniciativa pela velocidade do atacante mais a frente (RN009) e executa o motor de 12 turnos. Persiste victory/lose/round no time do jogador.',
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            user_id: {
              type: 'integer',
              description:
                'Opcional. Quando informado deve coincidir com o usuario autenticado; o backend usa sempre o id do token.'
            },
            snapshot_id: {
              type: 'integer',
              description:
                'Opcional. Se nao informado, o servico cria um novo snapshot do estado atual do time.'
            }
          }
        },
        response: {
          200: rodadaResultSchema,
          400: errorSchema,
          403: errorSchema,
          404: errorSchema
        }
      }
    },
    async (request, reply) => {
      const authenticatedUserId = request.user!.id;
      const body = request.body ?? {};

      if (
        body.user_id !== undefined &&
        Number(body.user_id) !== authenticatedUserId
      ) {
        return reply.code(403).send({
          message: 'user_id nao corresponde ao usuario autenticado.',
          code: 'USER_MISMATCH'
        });
      }

      try {
        const result = await jogarRodada({
          userId: authenticatedUserId,
          snapshotId: body.snapshot_id
        });
        return reply.code(200).send(result);
      } catch (error: unknown) {
        if (error instanceof RodadaServiceError) {
          let status = 400;
          if (
            error.code === 'TEAM_NOT_FOUND' ||
            error.code === 'SNAPSHOT_NOT_FOUND'
          ) {
            status = 404;
          } else if (error.code === 'SNAPSHOT_FORBIDDEN') {
            status = 403;
          }
          return reply
            .code(status)
            .send({ message: error.message, code: error.code });
        }
        throw error;
      }
    }
  );
};
