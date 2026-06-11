import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { type FastifyInstance } from 'fastify';

import { tSwagger } from '../i18n/swagger';
import { swaggerSchemas } from './swagger.schemas';

/**
 * Registra a configuracao do Swagger e os schemas compartilhados em
 * `components.schemas`. Tambem disponibiliza UI em `/docs`.
 *
 * Textos (info, tags, security) usam o namespace `swagger` no locale default
 * (WS-03). A spec e construida uma unica vez no boot do Fastify; para alternar
 * idioma dinamicamente em `/docs/json?lang=en` (OPCAO B), sera necessario
 * regerar a spec a cada requisicao — registrado como follow-up no WS-03.
 *
 * Os schemas sao adicionados via `app.addSchema()` para que tanto o serializer
 * (`fast-json-stringify`) quanto o validador (`Ajv`) consigam resolver as
 * referencias `$ref: '<Nome>#'` usadas pelas rotas. O `@fastify/swagger`
 * automaticamente importa esses schemas para `components.schemas` da spec
 * (usando o `$id` como nome), produzindo a documentacao final.
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
        { name: 'Market', description: tSwagger('tags.market') },
        { name: 'Team', description: tSwagger('tags.team') },
        { name: 'Items', description: tSwagger('tags.items') },
        { name: 'Match', description: tSwagger('tags.match') },
        { name: 'Ranking', description: tSwagger('tags.ranking') },
        { name: 'Admin', description: tSwagger('tags.admin') },
        { name: 'System', description: tSwagger('tags.system') }
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
    },
    refResolver: {
      buildLocalReference: (json, _baseUri, _fragment, index) => {
        const candidate = (json as { $id?: unknown }).$id;
        return typeof candidate === 'string' && candidate.length > 0
          ? candidate
          : `def-${index}`;
      }
    }
  });

  for (const [name, schema] of Object.entries(swaggerSchemas)) {
    app.addSchema({ $id: name, ...(schema as Record<string, unknown>) });
  }

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
