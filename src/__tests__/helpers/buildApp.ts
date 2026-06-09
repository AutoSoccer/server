/**
 * Helper para os testes de integracao: monta uma instancia Fastify isolada
 * sem swagger, sem conexao real com o banco e com errorHandler global.
 *
 * Como usar:
 *   1. No topo do teste, faca os vi.mock necessarios (config/database, models,
 *      services) ANTES de importar este helper.
 *   2. Chame `buildTestApp(routes, opts)` para registrar as rotas que voce
 *      quer exercitar via app.inject().
 *   3. Use `signTestToken({ id, nickname })` para gerar um bearer JWT valido
 *      com o segredo de teste.
 */
import Fastify, { type FastifyInstance, type FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';

import { registerErrorHandler } from '../../plugins/errorHandler';
import { env } from '../../config/env';

export type TestRouteRegistration = {
  plugin: FastifyPluginAsync;
  prefix: string;
};

export type BuildTestAppOptions = {
  /**
   * Caso o teste precise registrar plugins adicionais (ex.: cors customizado),
   * pode passar via beforeRegister antes das rotas.
   */
  beforeRegister?: (app: FastifyInstance) => Promise<void> | void;
};

export const buildTestApp = async (
  routes: TestRouteRegistration[],
  options: BuildTestAppOptions = {}
): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: false,
    ajv: {
      customOptions: {
        strict: false,
        keywords: ['example']
      }
    }
  });

  registerErrorHandler(app);

  if (options.beforeRegister) {
    await options.beforeRegister(app);
  }

  for (const { plugin, prefix } of routes) {
    await app.register(plugin, { prefix });
  }

  await app.ready();
  return app;
};

/**
 * Gera um JWT valido para o segredo do env de teste — uso em integration tests
 * para o middleware `authenticate`.
 */
export const signTestToken = (payload: { id: number; nickname: string }): string =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: '5d' });

export const bearer = (token: string): { authorization: string } => ({
  authorization: `Bearer ${token}`
});
