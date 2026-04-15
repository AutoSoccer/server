import { type FastifyReply, type FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: number; nickname: string };
  }
}

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const header = request.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return reply.code(401).send({ message: 'Token nao fornecido.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as {
      id: number;
      nickname: string;
    };

    request.user = decoded;
  } catch {
    return reply.code(401).send({ message: 'Token invalido ou expirado.' });
  }
};
