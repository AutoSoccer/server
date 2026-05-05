import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import { getMarket, refreshMarket } from './mercado.service';

export const mercadoRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const market = await getMarket(request.user!.id);
    return reply.code(200).send(market);
  });

  app.post('/refresh', { preHandler: [authenticate] }, async (request, reply) => {
    const market = await refreshMarket(request.user!.id, {
      cost: 0
    });

    return reply.code(200).send(market);
  });
};
