import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import {
  getRanking,
  RankingServiceError
} from './ranking.service';

type RankingQuery = {
  limit?: number;
};

const rankingMetricsSchema = {
  trophies: { type: 'integer' },
  victory: { type: 'integer' },
  defeat: { type: 'integer' },
  completedCampaigns: { type: 'integer' },
  winRate: { type: 'number' },
  lossRate: { type: 'number' }
} as const;

const rankingEntrySchema = {
  type: 'object',
  required: [
    'position',
    'userId',
    'nickname',
    'trophies',
    'victory',
    'defeat',
    'completedCampaigns',
    'winRate',
    'lossRate'
  ],
  properties: {
    position: { type: 'integer', example: 1 },
    userId: { type: 'integer' },
    nickname: { type: 'string' },
    ...rankingMetricsSchema
  }
} as const;

const currentUserSchema = {
  type: 'object',
  required: [
    'userId',
    'nickname',
    'isGuest',
    'position',
    'appearsInRanking',
    'trophies',
    'victory',
    'defeat',
    'completedCampaigns',
    'winRate',
    'lossRate'
  ],
  properties: {
    userId: { type: 'integer' },
    nickname: { type: 'string' },
    isGuest: { type: 'boolean' },
    position: {
      oneOf: [{ type: 'integer' }, { type: 'null' }]
    },
    appearsInRanking: { type: 'boolean' },
    ...rankingMetricsSchema
  }
} as const;

const errorSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    code: { type: 'string' }
  }
} as const;

export const rankingRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: RankingQuery }>(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Ranking'],
        summary: 'Ranking geral de usuarios por trofeus',
        description:
          'Lista contas reais com campanhas concluidas. Ordena por trofeus, vitorias, menos derrotas e cadastro mais antigo. Convidados podem consultar, mas nao aparecem.',
        security: [{ BearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Quantidade maxima de posicoes (padrao 50).'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            required: ['ranking', 'currentUser'],
            properties: {
              ranking: { type: 'array', items: rankingEntrySchema },
              currentUser: currentUserSchema
            }
          },
          404: errorSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const result = await getRanking(
          request.user!.id,
          request.query?.limit
        );
        return reply.code(200).send(result);
      } catch (error: unknown) {
        if (error instanceof RankingServiceError) {
          return reply
            .code(404)
            .send({ message: error.message, code: error.code });
        }

        throw error;
      }
    }
  );
};
