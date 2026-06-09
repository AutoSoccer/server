import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { type FastifyInstance } from 'fastify';

import { swaggerSchemas } from './swagger.schemas';

/**
 * Registra a configuracao do Swagger e os schemas compartilhados em
 * `components.schemas`. Tambem disponibiliza UI em `/docs`.
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
        title: 'AutoSoccer API',
        description:
          'API do AutoSoccer: autenticacao, mercado de atletas e simulacao de partidas (motor de 12 turnos).',
        version: '0.1.0'
      },
      servers: [
        {
          url: 'http://localhost:3333',
          description: 'Servidor local de desenvolvimento'
        }
      ],
      tags: [
        { name: 'Auth', description: 'Registro, login e perfil do usuario' },
        { name: 'Mercado', description: 'Janela de mercado de atletas' },
        { name: 'Equipe', description: 'Gerenciamento da equipe do treinador' },
        { name: 'Itens', description: 'Loja e aplicacao de itens (RF014)' },
        { name: 'Partida', description: 'Simulacao de partidas (Task 4.1/4.2)' },
        { name: 'Ranking', description: 'Ranking global por trofeus' },
        { name: 'Sistema', description: 'Endpoints utilitarios' }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Token JWT obtido em POST /auth/login.'
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
