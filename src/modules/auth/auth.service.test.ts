import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildUser } from '../../__tests__/factories/user';

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  findByPk: vi.fn(),
  create: vi.fn(),
  hash: vi.fn(),
  compare: vi.fn(),
  sign: vi.fn()
}));

vi.mock('./user.model', () => ({
  User: {
    findOne: mocks.findOne,
    findByPk: mocks.findByPk,
    create: mocks.create
  }
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: mocks.hash,
    compare: mocks.compare
  }
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: mocks.sign
  }
}));

import {
  createGuest,
  getMe,
  GUEST_INITIAL_COINS,
  loginUser,
  registerUser,
  ServiceError
} from './auth.service';

describe('registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sign.mockReturnValue('signed.jwt.token');
    mocks.hash.mockResolvedValue('hashed-pwd');
  });

  it('cria usuario com senha hasheada via bcrypt e devolve token', async () => {
    mocks.findOne.mockResolvedValue(null);
    const createdUser = buildUser({
      id: 42,
      name: 'Lucas',
      nickname: 'lucas',
      email: 'lucas@example.com',
      hashed_password: 'hashed-pwd'
    });
    mocks.create.mockResolvedValue(createdUser);

    const result = await registerUser({
      name: 'Lucas',
      nickname: 'lucas',
      password: 'segredo123',
      email: 'Lucas@Example.com'
    });

    expect(mocks.hash).toHaveBeenCalledWith('segredo123', 12);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Lucas',
        nickname: 'lucas',
        email: 'lucas@example.com',
        hashed_password: 'hashed-pwd'
      })
    );
    expect(result.token).toBe('signed.jwt.token');
    expect(result.user.id).toBe(42);
    expect(result.user.email).toBe('lucas@example.com');
  });

  it('recusa quando o nickname ja existe', async () => {
    mocks.findOne.mockResolvedValue(
      buildUser({ nickname: 'lucas', email: 'outro@example.com' })
    );

    await expect(
      registerUser({
        name: 'Lucas',
        nickname: 'lucas',
        password: 'segredo123',
        email: 'novo@example.com'
      })
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: expect.stringContaining('nickname')
    });

    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('recusa quando o email ja existe', async () => {
    mocks.findOne.mockResolvedValue(
      buildUser({ nickname: 'outro', email: 'lucas@example.com' })
    );

    await expect(
      registerUser({
        name: 'Lucas',
        nickname: 'novo',
        password: 'segredo123',
        email: 'lucas@example.com'
      })
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: expect.stringContaining('email')
    });
  });

  it('recusa quando o telefone ja existe', async () => {
    mocks.findOne.mockResolvedValue(
      buildUser({
        nickname: 'outro',
        email: 'outro@example.com',
        phone_number: '+5511999990000'
      })
    );

    await expect(
      registerUser({
        name: 'Lucas',
        nickname: 'novo',
        password: 'segredo123',
        email: 'novo@example.com',
        phone_number: '+5511999990000'
      })
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: expect.stringContaining('phone_number')
    });
  });

  it('rejeita nome vazio', async () => {
    await expect(
      registerUser({
        name: '   ',
        nickname: 'novo',
        password: 'segredo123',
        email: 'novo@example.com'
      })
    ).rejects.toBeInstanceOf(ServiceError);
  });
});

describe('loginUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sign.mockReturnValue('jwt-token');
  });

  it('autentica usuario com credenciais validas', async () => {
    const user = buildUser({ id: 9, nickname: 'lucas' });
    mocks.findOne.mockResolvedValue(user);
    mocks.compare.mockResolvedValue(true);

    const result = await loginUser({ identifier: 'lucas', password: '123' });

    expect(mocks.compare).toHaveBeenCalledWith('123', user.hashed_password);
    expect(result.token).toBe('jwt-token');
    expect(result.user.nickname).toBe('lucas');
  });

  it('rejeita usuario inexistente com INVALID_CREDENTIALS', async () => {
    mocks.findOne.mockResolvedValue(null);

    await expect(
      loginUser({ identifier: 'fantasma', password: '123' })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(mocks.compare).not.toHaveBeenCalled();
  });

  it('rejeita senha invalida', async () => {
    mocks.findOne.mockResolvedValue(buildUser());
    mocks.compare.mockResolvedValue(false);

    await expect(
      loginUser({ identifier: 'lucas', password: 'errada' })
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });
});

describe('createGuest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sign.mockReturnValue('guest-token');
    mocks.hash.mockResolvedValue('hashed-guest');
  });

  it('cria convidado com is_guest=true e GUEST_INITIAL_COINS', async () => {
    const created = buildUser({
      id: 99,
      nickname: 'guest_abc',
      email: 'guest_abc@guest.local',
      coins: GUEST_INITIAL_COINS,
      is_guest: true
    });
    mocks.create.mockResolvedValue(created);

    const result = await createGuest();

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        is_guest: true,
        coins: GUEST_INITIAL_COINS
      })
    );
    expect(result.token).toBe('guest-token');
    expect(result.user.is_guest).toBe(true);
    expect(result.user.coins).toBe(GUEST_INITIAL_COINS);
  });

  it('propaga erro inesperado durante a criacao', async () => {
    mocks.create.mockRejectedValue(new Error('db down'));

    await expect(createGuest()).rejects.toThrow('db down');
  });
});

describe('getMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna o usuario pelo id', async () => {
    mocks.findByPk.mockResolvedValue(buildUser({ id: 5, nickname: 'lucas' }));

    const result = await getMe(5);

    expect(result.id).toBe(5);
    expect(result.nickname).toBe('lucas');
  });

  it('lanca NOT_FOUND quando o usuario nao existe', async () => {
    mocks.findByPk.mockResolvedValue(null);

    await expect(getMe(404)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
