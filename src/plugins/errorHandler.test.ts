import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, it } from 'vitest';

import { EquipeServiceError } from '../modules/equipe/equipe.service';
import { MercadoServiceError } from '../modules/mercado/mercado.service';
import { registerErrorHandler } from './errorHandler';
import { registerI18n } from './i18n';

const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({ logger: false });
  await registerI18n(app);
  registerErrorHandler(app);

  app.get('/mercado-error', async () => {
    throw new MercadoServiceError('INSUFFICIENT_COINS', {
      i18nKey: 'mercado.refresh.insufficientBalance'
    });
  });

  app.get('/equipe-error', async () => {
    throw new EquipeServiceError('TEAM_FULL', {
      i18nKey: 'equipe.buyAthlete.teamFull',
      params: { max: 6 }
    });
  });

  app.get('/missing-key', async () => {
    throw new EquipeServiceError('USER_NOT_FOUND', {
      i18nKey: 'equipe.errors.USER_NOT_FOUND'
    });
  });

  app.get('/unhandled', async () => {
    throw new Error('boom');
  });

  return app;
};

describe('errorHandler com i18n', () => {
  it('traduz mensagens de erros de servico em pt-BR por default', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/mercado-error' });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: 'INSUFFICIENT_COINS',
      message: 'Saldo insuficiente para atualizar o mercado.'
    });
    await app.close();
  });

  it('traduz mensagens em ingles quando Accept-Language: en e enviado', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/mercado-error',
      headers: { 'accept-language': 'en' }
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: 'INSUFFICIENT_COINS',
      message: 'Insufficient balance to refresh the market.'
    });
    await app.close();
  });

  it('interpola params na mensagem traduzida', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/equipe-error' });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      code: 'TEAM_FULL',
      message: 'A equipe ja possui o limite de 6 atletas.'
    });
    await app.close();
  });

  it('cai no namespace de erro derivado do code (equipe.errors.USER_NOT_FOUND)', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/missing-key' });
    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.code).toBe('USER_NOT_FOUND');
    expect(body.message).toBe('Usuario nao encontrado.');
    await app.close();
  });

  it('responde 500 com common.internalError para erros nao tratados', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/unhandled' });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.'
    });
    await app.close();
  });

  it('em ingles usa common.internalError', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/unhandled',
      headers: { 'accept-language': 'en' }
    });
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error.'
    });
    await app.close();
  });
});
