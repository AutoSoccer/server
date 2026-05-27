import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

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
      enum: ['goalkeeper', 'defender', 'attacker']
    },
    overall: { type: 'integer' },
    status: { type: 'string', enum: ['MARKET', 'OWNED'] }
  }
} as const;

const marketResponseSchema = {
  type: 'object',
  properties: {
    refresh_cost: { type: 'integer' },
    refreshed_at: { type: ['string', 'null'], format: 'date-time' },
    athletes: { type: 'array', items: marketAthleteSchema }
  }
} as const;

export const mercadoRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Mercado'],
        summary: 'Retorna a janela de mercado do usuario',
        security: [{ BearerAuth: [] }],
        response: { 200: marketResponseSchema }
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
        summary: 'Sorteia uma nova janela de atletas no mercado',
        security: [{ BearerAuth: [] }],
        response: { 200: marketResponseSchema }
      }
    },
    async (request, reply) => {
      const market = await refreshMarket(request.user!.id, {
        cost: 0
      });

      return reply.code(200).send(market);
    }
  );
};
