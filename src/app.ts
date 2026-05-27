import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { authRoutes } from './modules/auth/auth.routes';
import { mercadoRoutes } from './modules/mercado/mercado.routes';
import { partidaRoutes } from './modules/partida/partida.routes';
import { registerSwagger } from './plugins/swagger';

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        strict: false,
        keywords: ['example']
      }
    }
  });

  await app.register(cors, {
    origin: true
  });

  await registerSwagger(app);

  app.get(
    '/health',
    {
      schema: {
        tags: ['Sistema'],
        summary: 'Health check',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString()
      };
    }
  );

  await app.register(authRoutes, {
    prefix: '/auth'
  });

  await app.register(mercadoRoutes, {
    prefix: '/mercado'
  });

  await app.register(partidaRoutes, {
    prefix: '/partida'
  });

  return app;
};
