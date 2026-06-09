import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { authenticate } from '../auth/auth.middleware';
import { aplicarItem, comprarItem, listarItens } from './itens.service';

type ComprarBody = {
  item_id: number;
  user_id?: number;
};

type AplicarBody = {
  item_id: number;
  atleta_id: number;
  user_id?: number;
};

const errorRef = { $ref: 'ErrorResponse#' } as const;

const modifiersSchema = {
  type: 'object',
  properties: {
    attack: { type: 'integer' },
    defense: { type: 'integer' },
    velocity: { type: 'integer' }
  }
} as const;

export const itensRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Itens'],
        summary: 'Lista o catalogo de itens ativos da loja (Task 4.1)',
        security: [{ BearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            additionalProperties: true,
            properties: {
              items: {
                type: 'array',
                items: { $ref: 'Item#' }
              }
            }
          },
          401: { $ref: 'ErrorResponse#' }
        }
      }
    },
    async (_request, reply) => {
      const items = await listarItens();
      return reply.code(200).send({ items });
    }
  );

  app.post<{ Body: ComprarBody }>(
    '/comprar',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Itens'],
        summary: 'Compra um item na loja (RF014, Task 4.1)',
        description:
          'Debita os coins do usuario e adiciona uma instancia do item ao inventario (consumed=false), tudo em uma transacao.',
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          required: ['item_id'],
          additionalProperties: false,
          properties: {
            item_id: { type: 'integer', example: 1 },
            user_id: {
              type: 'integer',
              description: 'Opcional. Quando informado deve coincidir com o usuario autenticado.'
            }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: { id: { type: 'integer' }, coins: { type: 'integer' } }
              },
              item: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  cost: { type: 'integer' },
                  stackable: { type: 'boolean' },
                  modifiers: modifiersSchema
                }
              },
              inventoryItemId: { type: 'integer' }
            }
          },
          400: errorRef,
          403: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const authenticatedUserId = request.user!.id;
      const body = request.body ?? ({} as ComprarBody);

      if (body.user_id !== undefined && Number(body.user_id) !== authenticatedUserId) {
        return reply
          .code(403)
          .send({ message: 'user_id nao corresponde ao usuario autenticado.', code: 'USER_MISMATCH' });
      }

      const itemId = Number(body.item_id);
      if (!Number.isInteger(itemId) || itemId <= 0) {
        return reply.code(400).send({ message: 'Campo item_id invalido.', code: 'INVALID_BODY' });
      }

      const result = await comprarItem(authenticatedUserId, itemId);
      return reply.code(201).send(result);
    }
  );

  app.post<{ Body: AplicarBody }>(
    '/aplicar',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Itens'],
        summary: 'Aplica o bonus de um item a um atleta do snapshot da rodada (RF014, Task 4.1)',
        description:
          'Valida posse/uso e empilhamento (stacking), atrela o buff ao atleta no Snapshot atual e consome o item — tudo numa unica transacao.',
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          required: ['item_id', 'atleta_id'],
          additionalProperties: false,
          properties: {
            item_id: { type: 'integer', example: 1 },
            atleta_id: { type: 'integer', example: 21 },
            user_id: {
              type: 'integer',
              description: 'Opcional. Quando informado deve coincidir com o usuario autenticado.'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              snapshotId: { type: 'integer' },
              athlete: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  bonus: modifiersSchema,
                  appliedItemIds: { type: 'array', items: { type: 'integer' } }
                }
              },
              item: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  modifiers: modifiersSchema
                }
              },
              consumedInventoryItemId: { type: 'integer' }
            }
          },
          400: errorRef,
          403: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const authenticatedUserId = request.user!.id;
      const body = request.body ?? ({} as AplicarBody);

      if (body.user_id !== undefined && Number(body.user_id) !== authenticatedUserId) {
        return reply
          .code(403)
          .send({ message: 'user_id nao corresponde ao usuario autenticado.', code: 'USER_MISMATCH' });
      }

      const itemId = Number(body.item_id);
      const athleteId = Number(body.atleta_id);
      if (!Number.isInteger(itemId) || itemId <= 0 || !Number.isInteger(athleteId) || athleteId <= 0) {
        return reply
          .code(400)
          .send({ message: 'Campos item_id e atleta_id precisam ser inteiros validos.', code: 'INVALID_BODY' });
      }

      const result = await aplicarItem(authenticatedUserId, itemId, athleteId);
      return reply.code(200).send(result);
    }
  );
};
