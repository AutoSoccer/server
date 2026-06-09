import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { equipeRoutes } from './modules/equipe/equipe.routes';
import { itensRoutes } from './modules/itens/itens.routes';
import { mercadoRoutes } from './modules/mercado/mercado.routes';
import { partidaRoutes } from './modules/partida/partida.routes';
import { rankingRoutes } from './modules/ranking/ranking.routes';
import { registerErrorHandler } from './plugins/errorHandler';
import { registerSwagger } from './plugins/swagger';

const parseCorsOrigin = (raw: string): boolean | string | string[] => {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '*') {
    return true;
  }

  const origins = trimmed
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (origins.length === 1) {
    return origins[0];
  }

  return origins;
};

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
    origin: parseCorsOrigin(env.corsOrigin)
  });

  await registerSwagger(app);

  registerErrorHandler(app);

  const healthHandler = async (): Promise<{ status: string; timestamp: string }> => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  };

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
    healthHandler
  );

  app.get(
    '/healthz',
    {
      schema: {
        tags: ['Sistema'],
        summary: 'Health check (alias para infra de deploy)',
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
    healthHandler
  );

  await app.register(authRoutes, {
    prefix: '/auth'
  });

  await app.register(mercadoRoutes, {
    prefix: '/mercado'
  });

  await app.register(equipeRoutes, {
    prefix: '/equipe'
  });

  await app.register(itensRoutes, {
    prefix: '/itens'
  });

  await app.register(partidaRoutes, {
    prefix: '/partida'
  });

  await app.register(rankingRoutes, {
    prefix: '/ranking'
  });

  return app;
};
