import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { type FastifyInstance } from 'fastify';
import type { OpenAPIV3 } from 'openapi-types';

import { swaggerSchemas } from './swagger.schemas';

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
        },
        schemas: swaggerSchemas as unknown as Record<
          string,
          OpenAPIV3.SchemaObject
        >
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
