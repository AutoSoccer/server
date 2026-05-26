import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import { PartidaServiceError, simulateMatch } from './partida.service';

export const partidaRoutes: FastifyPluginAsync = async (app) => {
  app.post('/simular', { preHandler: [authenticate] }, async (request, reply) => {
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
  });
};
