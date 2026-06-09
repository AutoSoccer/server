import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verify: vi.fn()
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: mocks.verify
  }
}));

import { authenticate } from './auth.middleware';

type FakeReply = {
  code: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
};

const buildReply = (): FakeReply => {
  const reply = {
    code: vi.fn(),
    send: vi.fn()
  } as unknown as FakeReply;
  reply.code.mockReturnValue(reply);
  reply.send.mockReturnValue(reply);
  return reply;
};

const buildRequest = (authorization?: string) => ({
  headers: authorization ? { authorization } : {},
  user: undefined as { id: number; nickname: string } | undefined
});

describe('authenticate middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responde 401 quando o header authorization esta ausente', async () => {
    const reply = buildReply();
    const request = buildRequest();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await authenticate(request as any, reply as any);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ message: 'Token nao fornecido.' });
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it('responde 401 quando o header nao comeca com Bearer', async () => {
    const reply = buildReply();
    const request = buildRequest('Basic abc');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await authenticate(request as any, reply as any);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ message: 'Token nao fornecido.' });
  });

  it('responde 401 quando o token e invalido ou expirado', async () => {
    mocks.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const reply = buildReply();
    const request = buildRequest('Bearer expired.token');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await authenticate(request as any, reply as any);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      message: 'Token invalido ou expirado.'
    });
    expect(request.user).toBeUndefined();
  });

  it('decora request.user com os dados decodificados quando o token e valido', async () => {
    const decoded = { id: 7, nickname: 'lucas' };
    mocks.verify.mockReturnValue(decoded);
    const reply = buildReply();
    const request = buildRequest('Bearer valido.token');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await authenticate(request as any, reply as any);

    expect(mocks.verify).toHaveBeenCalledWith('valido.token', expect.any(String));
    expect(request.user).toEqual(decoded);
    expect(reply.code).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });
});
