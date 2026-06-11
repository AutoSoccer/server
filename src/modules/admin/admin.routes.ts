import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { tSwagger } from '../../i18n/swagger';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { listUsers } from './admin.service';

type AdminUsersQuery = {
  page?: number;
  limit?: number;
};

const adminUsersResponseRef = { $ref: 'AdminUsersResponse#' } as const;
const errorRef = { $ref: 'ErrorResponse#' } as const;

/**
 * Rotas administrativas (T5 — JWT com 2 permissoes). Todas exigem token com
 * role 'admin': o `authenticate` decodifica o JWT e o `requireRole('admin')`
 * bloqueia usuarios comuns/convidados com 403 FORBIDDEN.
 */
export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: AdminUsersQuery }>(
    '/users',
    {
      preHandler: [authenticate, requireRole('admin')],
      schema: {
        tags: ['Admin'],
        summary: tSwagger('admin.listUsers.summary'),
        description: tSwagger('admin.listUsers.description'),
        security: [{ BearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              description: 'Pagina solicitada (padrao 1).'
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Itens por pagina (padrao 20, maximo 100).'
            }
          }
        },
        response: {
          200: adminUsersResponseRef,
          401: errorRef,
          403: errorRef
        }
      }
    },
    async (request, reply) => {
      const result = await listUsers({
        page: request.query?.page,
        limit: request.query?.limit
      });

      return reply.code(200).send(result);
    }
  );
};
