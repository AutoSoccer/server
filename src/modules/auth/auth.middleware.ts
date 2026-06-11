import { type FastifyReply, type FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env';
import { type UserRole } from './user.model';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * Payload decodificado do JWT. `role` e opcional para manter
     * compatibilidade com tokens emitidos antes do T5 (sem a claim);
     * nesses casos o usuario e tratado como 'user'.
     */
    user?: { id: number; nickname: string; role?: UserRole };
  }
}

/**
 * Traduz uma chave i18n usando `req.t` quando disponivel, com fallback para o
 * texto padrao em pt-BR. Mantemos o fallback explicito para suportar contextos
 * sem o plugin de i18n carregado (ex.: testes unitarios do middleware).
 */
const translate = (
  request: FastifyRequest,
  key: string,
  fallback: string
): string => {
  const translator = request.t;
  if (typeof translator !== 'function') {
    return fallback;
  }
  const translated = translator(key);
  if (typeof translated !== 'string' || translated.length === 0 || translated === key) {
    return fallback;
  }
  return translated;
};

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const header = request.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return reply.code(401).send({
      message: translate(request, 'auth.tokenMissing', 'Token nao fornecido.')
    });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as {
      id: number;
      nickname: string;
      role?: UserRole;
    };

    request.user = decoded;
  } catch {
    return reply.code(401).send({
      message: translate(request, 'auth.tokenInvalid', 'Token invalido ou expirado.')
    });
  }
};
