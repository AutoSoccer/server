import { type FastifyReply, type FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env';
import { ServiceError } from './auth.service';
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

/**
 * Guard de permissao (T5): exige que o JWT decodificado pelo `authenticate`
 * carregue a claim `role` esperada. Deve ser usado SEMPRE depois do
 * `authenticate` no mesmo preHandler:
 *
 *   preHandler: [authenticate, requireRole('admin')]
 *
 * Tokens antigos (sem a claim) sao tratados como 'user'. Quando a role nao
 * confere, lanca `ServiceError('FORBIDDEN')` — o errorHandler global traduz
 * para HTTP 403 com payload `{ code: 'FORBIDDEN', message }`.
 */
export const requireRole = (role: UserRole) => {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Defesa em profundidade: se a rota esquecer o `authenticate`, nao ha
    // payload decodificado — respondemos 401 igual ao middleware base.
    if (!request.user) {
      return reply.code(401).send({
        message: translate(request, 'auth.tokenMissing', 'Token nao fornecido.')
      });
    }

    const userRole: UserRole = request.user.role ?? 'user';

    if (userRole !== role) {
      throw new ServiceError('FORBIDDEN', {
        i18nKey: 'auth.forbidden',
        params: { role }
      });
    }
  };
};
