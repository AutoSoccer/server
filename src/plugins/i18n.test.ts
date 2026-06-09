import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';

import { registerI18n } from './i18n';

const buildApp = async () => {
  const app = Fastify({ logger: false });
  await registerI18n(app);
  app.get('/echo', async (request) => ({
    locale: request.locale,
    tokenMissing: request.t('auth.tokenMissing'),
    refreshBalance: request.t('mercado.refresh.insufficientBalance'),
    teamFull: request.t('equipe.buyAthlete.teamFull', { max: 6 })
  }));
  return app;
};

describe('plugin i18n', () => {
  it('usa pt-BR como default quando nenhum header e enviado', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/echo' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.locale).toBe('pt-BR');
    expect(body.tokenMissing).toBe('Token nao fornecido.');
    expect(body.refreshBalance).toBe('Saldo insuficiente para atualizar o mercado.');
    expect(body.teamFull).toBe('A equipe ja possui o limite de 6 atletas.');
    await app.close();
  });

  it('respeita Accept-Language: en e devolve mensagens em ingles', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/echo',
      headers: { 'accept-language': 'en' }
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.locale).toBe('en');
    expect(body.tokenMissing).toBe('Token not provided.');
    expect(body.refreshBalance).toBe('Insufficient balance to refresh the market.');
    expect(body.teamFull).toBe('The team already has the maximum of 6 athletes.');
    await app.close();
  });

  it('aceita query string ?lang=en quando o header nao especifica idioma', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/echo?lang=en'
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.locale).toBe('en');
    expect(body.tokenMissing).toBe('Token not provided.');
    await app.close();
  });

  it('cai no default quando o locale solicitado nao e suportado', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/echo',
      headers: { 'accept-language': 'fr-FR' }
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.locale).toBe('pt-BR');
    expect(body.tokenMissing).toBe('Token nao fornecido.');
    await app.close();
  });
});
