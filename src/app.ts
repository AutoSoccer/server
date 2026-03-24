import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true
  });

  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  });

  await app.register(authRoutes, {
    prefix: '/auth'
  });

  return app;
};
