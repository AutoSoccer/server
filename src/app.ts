import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { env } from './config/env';
import { tSwagger } from './i18n/swagger';
import { adminRoutes } from './modules/admin/admin.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { equipeRoutes } from './modules/equipe/equipe.routes';
import { itensRoutes } from './modules/itens/itens.routes';
import { mercadoRoutes } from './modules/mercado/mercado.routes';
import { partidaRoutes } from './modules/partida/partida.routes';
import { rankingRoutes } from './modules/ranking/ranking.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { registerErrorHandler } from './plugins/errorHandler';
import { registerI18n } from './plugins/i18n';
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

  // i18n precisa estar inicializado antes de qualquer registro que use
  // `i18next.t(...)` (Swagger e error handler dependem disso).
  await registerI18n(app);

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
        tags: ['System'],
        summary: tSwagger('system.health.summary'),
        description: tSwagger('system.health.description'),
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
        tags: ['System'],
        summary: tSwagger('system.healthz.summary'),
        description: tSwagger('system.healthz.description'),
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
    prefix: '/market'
  });

  await app.register(equipeRoutes, {
    prefix: '/team'
  });

  await app.register(itensRoutes, {
    prefix: '/items'
  });

  await app.register(partidaRoutes, {
    prefix: '/match'
  });

  await app.register(rankingRoutes, {
    prefix: '/ranking'
  });

  await app.register(reportsRoutes, {
    prefix: '/reports'
  });

  await app.register(adminRoutes, {
    prefix: '/admin'
  });

  return app;
};
