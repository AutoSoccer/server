import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import { getRanking } from './ranking.service';

type RankingQuery = {
  limit?: number;
};

const rankingEntrySchema = {
  type: 'object',
  properties: {
    position: { type: 'integer', example: 1 },
    userId: { type: 'integer' },
    nickname: { type: 'string' },
    name: { type: 'string' },
    trophies: { type: 'integer' },
    victory: { type: 'integer' },
    defeat: { type: 'integer' }
  }
} as const;

export const rankingRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: RankingQuery }>(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Ranking'],
        summary: 'Ranking geral de usuarios por trofeus (RF004)',
        description:
          'Lista os usuarios ordenados por trofeus (decrescente). Convidados nao aparecem (RF005).',
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
            properties: {
              ranking: { type: 'array', items: rankingEntrySchema }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const result = await getRanking(request.query?.limit);
      return reply.code(200).send(result);
    }
  );
};
