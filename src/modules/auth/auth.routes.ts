import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from './auth.middleware';
import { getMe, loginUser, registerUser, ServiceError } from './auth.service';

type RegisterBody = {
  name?: string;
  nickname: string;
  password: string;
  email: string;
  phone_number?: string;
};

type LoginBody = {
  identifier: string;
  password: string;
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    try {
      const body = request.body;
      const result = await registerUser({
        name: body.name,
        nickname: body.nickname,
        password: body.password,
        email: body.email,
        phone_number: body.phone_number
      });

      return reply.code(201).send(result);
    } catch (error: unknown) {
      if (error instanceof ServiceError && error.code === 'CONFLICT') {
        return reply.code(409).send({ message: error.message });
      }

      throw error;
    }
  });

  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const user = await getMe(request.user!.id);
      return reply.code(200).send(user);
    } catch (error: unknown) {
      if (error instanceof ServiceError && error.code === 'NOT_FOUND') {
        return reply.code(404).send({ message: error.message });
      }

      throw error;
    }
  });

  app.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    try {
      const body = request.body;
      const result = await loginUser({
        identifier: body.identifier,
        password: body.password
      });

      return reply.code(200).send(result);
    } catch (error: unknown) {
      if (error instanceof ServiceError && error.code === 'INVALID_CREDENTIALS') {
        return reply.code(401).send({ message: error.message });
      }

      throw error;
    }
  });
};
