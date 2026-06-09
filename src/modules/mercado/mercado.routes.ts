import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { tSwagger } from '../../i18n/swagger';
import { authenticate } from '../auth/auth.middleware';
import { getMarket, refreshMarket } from './mercado.service';

const marketAthleteSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    velocity: { type: 'integer' },
    attack: { type: 'integer' },
    defense: { type: 'integer' },
    ability_id: { type: 'integer' },
    tier: {
      type: 'string',
      enum: ['bronze', 'silver', 'gold', 'epic', 'legend']
    },
    type: {
      type: 'string',
      enum: ['defender', 'midfielder', 'attacker']
    },
    overall: { type: 'integer' },
    cost: { type: 'integer' },
    status: { type: 'string', enum: ['MARKET', 'OWNED'] }
  }
} as const;

const marketResponseSchema = {
  type: 'object',
  properties: {
    refresh_cost: { type: 'integer' },
    refreshed_at: { type: ['string', 'null'], format: 'date-time' },
    coins: { type: 'integer' },
    athletes: { type: 'array', items: marketAthleteSchema }
  }
} as const;

const errorSchema = {
  type: 'object',
  properties: {
    code: { type: 'string' },
    message: { type: 'string' }
  }
} as const;

export const mercadoRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Mercado'],
        summary: tSwagger('mercado.list.summary'),
        description: tSwagger('mercado.list.description'),
        security: [{ BearerAuth: [] }],
        response: {
          200: marketResponseSchema,
          404: errorSchema
        }
      }
    },
    async (request, reply) => {
      const market = await getMarket(request.user!.id);
      return reply.code(200).send(market);
    }
  );

  app.post(
    '/refresh',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Mercado'],
        summary: tSwagger('mercado.refresh.summary'),
        description: tSwagger('mercado.refresh.description'),
        security: [{ BearerAuth: [] }],
        response: {
          200: marketResponseSchema,
          400: errorSchema,
          404: errorSchema
        }
      }
    },
    async (request, reply) => {
      const market = await refreshMarket(request.user!.id);
      return reply.code(200).send(market);
    }
  );
};
