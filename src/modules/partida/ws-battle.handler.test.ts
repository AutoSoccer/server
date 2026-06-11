import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  consumeMatchEntry: vi.fn()
}));

vi.mock('./match-stream.store', () => ({
  consumeMatchEntry: mocks.consumeMatchEntry
}));

vi.mock('../../config/database', async () => {
  const { Sequelize } = await import('sequelize');
  const sequelize = new Sequelize('test', 'test', 'test', {
    dialect: 'mysql',
    logging: false
  });
  return { sequelize, connectDatabase: vi.fn().mockResolvedValue(undefined) };
});

import type { WebSocket } from 'ws';
import websocket from '@fastify/websocket';
import Fastify, { type FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { registerI18n } from '../../plugins/i18n';
import { env } from '../../config/env';
import { wsBattleRoutes } from './ws-battle.handler';
import { type JogarRodadaResult } from './rodada.service';

const signToken = (payload: { id: number; nickname: string }) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: '5d' });

const makeResult = (events: unknown[] = []): JogarRodadaResult =>
  ({
    events,
    score: { player: 1, opponent: 0 },
    winner: 'player',
    totalTurns: events.length,
    initialBall: {},
    player: {},
    opponent: {},
    lineups: {},
    matchmaking: {},
    initiative: {},
    persisted: { teamId: 1, victory: 1, lose: 0, round: 2 },
    resolution: {
      matchStatus: 'in_progress',
      matchEnded: false,
      trophiesDelta: 0,
      trophies: 10,
      coinsEarned: 10,
      coins: 10,
      userVictory: 0,
      userDefeat: 0,
      isGuest: false,
      roundLogId: 1
    }
  }) as unknown as JogarRodadaResult;

// Conecta via injectWS com listener registrado ANTES da conexao (onInit),
// garantindo que nenhuma mensagem seja perdida em handlers que enviam
// imediatamente apos o upgrade.
const injectAndCollect = async (
  app: FastifyInstance,
  path: string,
  opts?: { untilType?: 'result' | 'error' }
): Promise<{ ws: WebSocket; msgs: Promise<string[]> }> => {
  const msgs: string[] = [];
  let resolveAll: (m: string[]) => void;
  const promise = new Promise<string[]>((r) => { resolveAll = r; });

  const ws = await (app as any).injectWS(path, {}, {
    onInit: (socket: WebSocket) => {
      socket.on('message', (data: Buffer) => {
        const raw = data.toString();
        msgs.push(raw);
        const type = (JSON.parse(raw) as { type: string }).type;
        const done = opts?.untilType ? type === opts.untilType : type === 'result' || type === 'error';
        if (done) resolveAll(msgs);
      });
      // Resolve também ao fechar (cobre casos onde o handler fecha sem resultado)
      socket.on('close', () => resolveAll(msgs));
    }
  });

  return { ws, msgs: promise };
};

let app: FastifyInstance;

beforeEach(async () => {
  vi.clearAllMocks();
  app = Fastify({ logger: false });
  await registerI18n(app);
  await app.register(websocket);
  await app.register(wsBattleRoutes);
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

describe('wsBattleRoutes', () => {
  it('envia erro UNAUTHORIZED quando nao ha token', async () => {
    mocks.consumeMatchEntry.mockReturnValue(makeResult());

    const { ws, msgs } = await injectAndCollect(app, '/ws/battle/abc123');
    const received = await msgs;

    expect(JSON.parse(received[0])).toEqual({ type: 'error', data: { code: 'UNAUTHORIZED' } });
    expect(mocks.consumeMatchEntry).not.toHaveBeenCalled();
    ws.terminate();
  });

  it('envia erro UNAUTHORIZED quando token e invalido', async () => {
    mocks.consumeMatchEntry.mockReturnValue(makeResult());

    const { ws, msgs } = await injectAndCollect(app, '/ws/battle/abc123?token=token-invalido');
    const received = await msgs;

    expect(JSON.parse(received[0])).toEqual({ type: 'error', data: { code: 'UNAUTHORIZED' } });
    expect(mocks.consumeMatchEntry).not.toHaveBeenCalled();
    ws.terminate();
  });

  it('envia erro MATCH_NOT_FOUND quando matchId nao existe no store', async () => {
    mocks.consumeMatchEntry.mockReturnValue(null);
    const token = signToken({ id: 1, nickname: 'lucas' });

    const { ws, msgs } = await injectAndCollect(app, `/ws/battle/nao-existe?token=${token}`);
    const received = await msgs;

    expect(JSON.parse(received[0])).toEqual({ type: 'error', data: { code: 'MATCH_NOT_FOUND' } });
    expect(mocks.consumeMatchEntry).toHaveBeenCalledWith('nao-existe');
    ws.terminate();
  });

  it('consome o match entry correto e envia resultado quando nao ha eventos', async () => {
    mocks.consumeMatchEntry.mockReturnValue(makeResult([]));
    const token = signToken({ id: 1, nickname: 'lucas' });

    const { ws, msgs } = await injectAndCollect(app, `/ws/battle/meu-match?token=${token}`);
    const received = await msgs;

    expect(mocks.consumeMatchEntry).toHaveBeenCalledWith('meu-match');
    expect(received.length).toBe(1);
    expect(JSON.parse(received[0]).type).toBe('result');
    ws.terminate();
  });

  it('emite eventos de turno antes do resultado', async () => {
    vi.useFakeTimers();

    const events = [
      { turn: 1, goal: false, description: 'passe' },
      { turn: 2, goal: true, description: 'gol' }
    ];
    mocks.consumeMatchEntry.mockReturnValue(makeResult(events));
    const token = signToken({ id: 1, nickname: 'lucas' });

    const { ws, msgs } = await injectAndCollect(app, `/ws/battle/match-com-eventos?token=${token}`);

    await vi.runAllTimersAsync();
    vi.useRealTimers();

    const received = await msgs;

    expect(received.length).toBe(3);
    expect(JSON.parse(received[0]).type).toBe('turn');
    expect(JSON.parse(received[1]).type).toBe('turn');
    expect(JSON.parse(received[2]).type).toBe('result');
    ws.terminate();
  });
});
