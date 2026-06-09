import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from './auth.middleware';
import { createGuest, getMe, loginUser, registerUser, ServiceError } from './auth.service';

type RegisterBody = {
  name: string;
  nickname: string;
  password: string;
  email: string;
  phone_number?: string;
};

type LoginBody = {
  identifier: string;
  password: string;
};

const userResponseRef = { $ref: 'UserResponse#' } as const;
const authResponseRef = { $ref: 'AuthResponse#' } as const;
const errorRef = { $ref: 'ErrorResponse#' } as const;

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: RegisterBody }>(
    '/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Cadastra um novo usuario',
        body: {
          type: 'object',
          required: ['name', 'nickname', 'password', 'email'],
          properties: {
            name: { type: 'string', example: 'Lucas Stopinski' },
            nickname: { type: 'string', example: 'lucas' },
            password: { type: 'string', minLength: 6, example: '123456' },
            email: {
              type: 'string',
              format: 'email',
              example: 'lucas@gmail.com'
            },
            phone_number: { type: 'string', example: '11900000001' }
          }
        },
        response: {
          201: authResponseRef,
          409: errorRef
        }
      }
    },
    async (request, reply) => {
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
    }
  );

  app.get(
    '/me',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Auth'],
        summary: 'Retorna o usuario autenticado',
        security: [{ BearerAuth: [] }],
        response: {
          200: userResponseRef,
          401: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      try {
        const user = await getMe(request.user!.id);
        return reply.code(200).send(user);
      } catch (error: unknown) {
        if (error instanceof ServiceError && error.code === 'NOT_FOUND') {
          return reply.code(404).send({ message: error.message });
        }

        throw error;
      }
    }
  );

  app.post(
    '/guest',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Cria uma conta de convidado e retorna um token JWT (RF005)',
        description:
          'Cria um usuario efemero com is_guest=true para jogar sem cadastro. Convidados nao acumulam trofeus nem entram no ranking geral.',
        response: {
          201: authResponseRef,
          500: errorRef
        }
      }
    },
    async (_request, reply) => {
      const result = await createGuest();
      return reply.code(201).send(result);
    }
  );

  app.post<{ Body: LoginBody }>(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Autentica um usuario e retorna um token JWT',
        body: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: {
              type: 'string',
              description: 'E-mail ou apelido',
              example: 'lucas@gmail.com'
            },
            password: { type: 'string', minLength: 6, example: '123456' }
          }
        },
        response: {
          200: authResponseRef,
          401: errorRef
        }
      }
    },
    async (request, reply) => {
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
    }
  );
};
