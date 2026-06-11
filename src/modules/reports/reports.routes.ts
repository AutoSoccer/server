import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { tSwagger } from '../../i18n/swagger';
import { authenticate } from '../auth/auth.middleware';
import {
  getMarketOverview,
  getTeamPowerRanking,
  getTopAthletesByRole,
  REPORT_ROLES
} from './reports.service';

type TopAthletesQuery = {
  role?: string;
  limit?: number;
};

type TeamPowerQuery = {
  limit?: number;
};

const errorRef = { $ref: 'ErrorResponse#' } as const;

const topAthleteSchema = {
  type: 'object',
  required: ['id', 'name', 'role', 'tier', 'velocity', 'attack', 'defense', 'cost', 'power'],
  properties: {
    id: { type: 'integer', example: 21 },
    name: { type: 'string', example: 'Lucas Forward' },
    role: { type: 'string', example: 'attacker' },
    tier: { type: 'string', example: 'gold' },
    velocity: { type: 'integer', example: 80 },
    attack: { type: 'integer', example: 92 },
    defense: { type: 'integer', example: 50 },
    cost: { type: 'integer', example: 3 },
    power: { type: 'integer', example: 222 }
  }
} as const;

const teamPowerEntrySchema = {
  type: 'object',
  required: [
    'teamId',
    'teamName',
    'userId',
    'userNickname',
    'athleteCount',
    'totalPower',
    'avgPower',
    'trophies',
    'victory',
    'defeat'
  ],
  properties: {
    teamId: { type: 'integer', example: 12 },
    teamName: { type: 'string', example: 'Os Lendarios' },
    userId: { type: 'integer', example: 4 },
    userNickname: { type: 'string', example: 'lstopinski' },
    athleteCount: { type: 'integer', example: 6 },
    totalPower: { type: 'integer', example: 1432 },
    avgPower: { type: 'number', example: 238.67 },
    trophies: { type: 'integer', example: 12 },
    victory: { type: 'integer', example: 7 },
    defeat: { type: 'integer', example: 2 }
  }
} as const;

const marketBucketSchema = {
  type: 'object',
  required: ['athleteCount', 'avgCost', 'avgPower'],
  properties: {
    athleteCount: { type: 'integer', example: 8 },
    avgCost: { type: 'number', example: 2.5 },
    avgPower: { type: 'number', example: 198.4 }
  }
} as const;

const marketTierSchema = {
  type: 'object',
  required: ['tier', 'athleteCount', 'avgCost', 'avgPower'],
  properties: {
    tier: { type: 'string', example: 'gold' },
    ...marketBucketSchema.properties
  }
} as const;

const marketRoleSchema = {
  type: 'object',
  required: ['role', 'athleteCount', 'avgCost', 'avgPower'],
  properties: {
    role: { type: 'string', example: 'attacker' },
    ...marketBucketSchema.properties
  }
} as const;

export const reportsRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: TopAthletesQuery }>(
    '/top-athletes',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Reports'],
        summary: tSwagger('reports.topAthletes.summary'),
        description: tSwagger('reports.topAthletes.description'),
        security: [{ BearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              enum: [...REPORT_ROLES],
              description: 'Filtra a posicao tatica do atleta (opcional).'
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              description: 'Quantidade maxima de atletas retornados (padrao 10).'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            required: ['role', 'limit', 'athletes'],
            properties: {
              role: {
                oneOf: [{ type: 'string' }, { type: 'null' }]
              },
              limit: { type: 'integer' },
              athletes: { type: 'array', items: topAthleteSchema }
            }
          },
          400: errorRef,
          401: errorRef
        }
      }
    },
    async (request) => {
      return getTopAthletesByRole(request.query?.role, request.query?.limit);
    }
  );

  app.get<{ Querystring: TeamPowerQuery }>(
    '/team-power-ranking',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Reports'],
        summary: tSwagger('reports.teamPowerRanking.summary'),
        description: tSwagger('reports.teamPowerRanking.description'),
        security: [{ BearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 200,
              description: 'Quantidade maxima de equipes retornadas (padrao 20).'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            required: ['limit', 'teams'],
            properties: {
              limit: { type: 'integer' },
              teams: { type: 'array', items: teamPowerEntrySchema }
            }
          },
          400: errorRef,
          401: errorRef
        }
      }
    },
    async (request) => {
      return getTeamPowerRanking(request.query?.limit);
    }
  );

  app.get(
    '/market-overview',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Reports'],
        summary: tSwagger('reports.marketOverview.summary'),
        description: tSwagger('reports.marketOverview.description'),
        security: [{ BearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            required: ['totals', 'byTier', 'byRole'],
            properties: {
              totals: {
                type: 'object',
                required: ['athletes', 'avgCost', 'avgPower', 'activeMarketSlots'],
                properties: {
                  athletes: { type: 'integer', example: 47 },
                  avgCost: { type: 'number', example: 2.34 },
                  avgPower: { type: 'number', example: 198.7 },
                  activeMarketSlots: { type: 'integer', example: 12 }
                }
              },
              byTier: { type: 'array', items: marketTierSchema },
              byRole: { type: 'array', items: marketRoleSchema }
            }
          },
          401: errorRef
        }
      }
    },
    async () => {
      return getMarketOverview();
    }
  );
};
