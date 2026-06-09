import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { type FastifyInstance } from 'fastify';

import { tSwagger } from '../i18n/swagger';

/**
 * Registra Swagger/OpenAPI usando textos do namespace `swagger` no locale
 * default (WS-03). A spec e construida uma unica vez no boot do Fastify;
 * para alternar idioma dinamicamente em `/docs/json?lang=en` (OPCAO B),
 * sera necessario regerar a spec a cada requisicao — registrado como
 * follow-up no WS-03.
 */
export const registerSwagger = async (app: FastifyInstance): Promise<void> => {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: tSwagger('info.title'),
        description: tSwagger('info.description'),
        version: '0.1.0'
      },
      servers: [
        {
          url: 'http://localhost:3333',
          description: tSwagger('servers.local')
        }
      ],
      tags: [
        { name: 'Auth', description: tSwagger('tags.auth') },
        { name: 'Mercado', description: tSwagger('tags.mercado') },
        { name: 'Equipe', description: tSwagger('tags.equipe') },
        { name: 'Itens', description: tSwagger('tags.itens') },
        { name: 'Partida', description: tSwagger('tags.partida') },
        { name: 'Ranking', description: tSwagger('tags.ranking') },
        { name: 'Sistema', description: tSwagger('tags.sistema') }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: tSwagger('security.bearerDescription')
          }
        }
      }
    }
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true
    },
    staticCSP: true
  });
};
