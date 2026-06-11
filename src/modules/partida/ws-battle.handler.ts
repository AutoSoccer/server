import { type FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { type UserRole } from '../auth/user.model';
import { consumeMatchEntry } from './match-stream.store';

import { type WebSocket } from 'ws';

type WsMessage =
  | { type: 'turn'; data: unknown }
  | { type: 'result'; data: unknown }
  | { type: 'error'; data: { code: string } };

const send = (socket: WebSocket, msg: WsMessage): void => {
  socket.send(JSON.stringify(msg));
};

const sendAndClose = (socket: WebSocket, msg: WsMessage): Promise<void> =>
  new Promise((resolve) => {
    socket.send(JSON.stringify(msg), () => {
      socket.close();
      resolve();
    });
  });

const verifyToken = (
  token: string | undefined
): { id: number; nickname: string; role?: UserRole } | null => {
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtSecret) as { id: number; nickname: string; role?: UserRole };
  } catch {
    return null;
  }
};

const TURN_DELAY_MS = 800;

export const wsBattleRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/ws/battle/:matchId', { websocket: true }, async (socket, request) => {
    const token = (request.query as Record<string, string>).token;
    const payload = verifyToken(token);

    if (!payload) {
      await sendAndClose(socket, { type: 'error', data: { code: 'UNAUTHORIZED' } });
      return;
    }

    const { matchId } = request.params as Record<string, string>;
    const entry = consumeMatchEntry(matchId);

    if (!entry) {
      await sendAndClose(socket, { type: 'error', data: { code: 'MATCH_NOT_FOUND' } });
      return;
    }

    const { events, ...resultWithoutEvents } = entry;

    for (const event of events) {
      send(socket, { type: 'turn', data: event });
      await new Promise<void>((resolve) => setTimeout(resolve, TURN_DELAY_MS));
    }

    await sendAndClose(socket, { type: 'result', data: { ...resultWithoutEvents, events } });
  });
};
