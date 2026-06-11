import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  createGuest: vi.fn(),
  getMe: vi.fn()
}));

vi.mock('../../config/database', async () => {
  const { Sequelize } = await import('sequelize');
  // Sequelize stub sem conexao real — usa mysql como dialect porque eh o ja
  // resolvido, mas nao chama .authenticate() em lugar nenhum.
  const sequelize = new Sequelize('test', 'test', 'test', {
    dialect: 'mysql',
    logging: false
  });
  return {
    sequelize,
    connectDatabase: vi.fn().mockResolvedValue(undefined)
  };
});

vi.mock('../../database/models', () => ({
  Athlete: {},
  RoundLog: {},
  Team: {},
  TeamAthlete: {},
  TeamSnapshot: {},
  User: {},
  Item: {},
  UserItem: {},
  Ability: {},
  MarketWindow: {}
}));

vi.mock('../../modules/auth/auth.service', async () => {
  const actual = await vi.importActual<typeof import('../../modules/auth/auth.service')>(
    '../../modules/auth/auth.service'
  );
  return {
    ...actual,
    registerUser: mocks.registerUser,
    loginUser: mocks.loginUser,
    createGuest: mocks.createGuest,
    getMe: mocks.getMe
  };
});

import { authRoutes } from '../../modules/auth/auth.routes';
import { ServiceError } from '../../modules/auth/auth.service';
import { bearer, buildTestApp, signTestToken } from '../helpers/buildApp';

const buildAuthResponse = () => ({
  token: 'jwt.test.token',
  user: {
    id: 1,
    name: 'Lucas',
    nickname: 'lucas',
    email: 'lucas@example.com',
    phone_number: null,
    victory: 0,
    defeat: 0,
    trophies: 0,
    coins: 10,
    is_guest: false
  }
});

const buildApp = () => buildTestApp([{ plugin: authRoutes, prefix: '/auth' }]);

describe('integration: /auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /auth/register devolve 201 e o payload do usuario criado', async () => {
    const app = await buildApp();
    mocks.registerUser.mockResolvedValue(buildAuthResponse());

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Lucas',
        nickname: 'lucas',
        password: '123456',
        email: 'lucas@example.com'
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      token: 'jwt.test.token',
      user: { id: 1, nickname: 'lucas' }
    });
    expect(mocks.registerUser).toHaveBeenCalledOnce();

    await app.close();
  });

  it('POST /auth/register devolve 409 quando ja existe (ServiceError CONFLICT)', async () => {
    const app = await buildApp();
    mocks.registerUser.mockRejectedValue(
      new ServiceError('CONFLICT', { params: { nickname: 'lucas' } })
    );

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        name: 'Lucas',
        nickname: 'lucas',
        password: '123456',
        email: 'lucas@example.com'
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().message).toContain('nickname');

    await app.close();
  });

  it('POST /auth/login devolve 200 quando as credenciais sao validas', async () => {
    const app = await buildApp();
    mocks.loginUser.mockResolvedValue(buildAuthResponse());

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { identifier: 'lucas', password: '123456' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ token: 'jwt.test.token' });

    await app.close();
  });

  it('POST /auth/login devolve 401 com credencial errada', async () => {
    const app = await buildApp();
    mocks.loginUser.mockRejectedValue(new ServiceError('INVALID_CREDENTIALS'));

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { identifier: 'lucas', password: 'errado' }
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('POST /auth/guest devolve 201 e um usuario convidado', async () => {
    const app = await buildApp();
    mocks.createGuest.mockResolvedValue({
      token: 'guest.jwt',
      user: { ...buildAuthResponse().user, nickname: 'guest_abc', is_guest: true }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/guest'
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().user.is_guest).toBe(true);

    await app.close();
  });

  it('GET /auth/me devolve 200 quando o bearer eh valido', async () => {
    const app = await buildApp();
    mocks.getMe.mockResolvedValue(buildAuthResponse().user);
    const token = signTestToken({ id: 1, nickname: 'lucas' });

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: bearer(token)
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: 1, nickname: 'lucas' });
    expect(mocks.getMe).toHaveBeenCalledWith(1);

    await app.close();
  });

  it('GET /auth/me devolve 401 quando nao ha bearer', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me'
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().message).toMatch(/token/i);
    expect(mocks.getMe).not.toHaveBeenCalled();

    await app.close();
  });
});
