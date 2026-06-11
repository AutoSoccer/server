import '@fastify/swagger';
import { type FastifyPluginAsync } from 'fastify';

import { tSwagger } from '../../i18n/swagger';
import { authenticate } from '../auth/auth.middleware';
import {
  MAX_POSITIONED_ATHLETES,
  MIN_POSITIONED_ATHLETES,
  type SalvarEstadoInput
} from '../equipe/team-snapshot.service';
import { jogarRodada, jogarRodadaComFormacao } from './rodada.service';
import { abandonCampaign, startCampaign } from './campaign.service';
import { createMatchEntry } from './match-stream.store';

type JogarRodadaBody = {
  user_id?: number;
  snapshot_id?: number;
};

type JogarPartidaBody = {
  user_id?: number;
  positions: SalvarEstadoInput['positions'];
  items?: number[];
};

type StartCampaignBody = {
  name: string;
};

const athleteSimSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    velocity: { type: 'integer' },
    attack: { type: 'integer' },
    defense: { type: 'integer' },
    type: { type: 'string', enum: ['defender', 'midfielder', 'attacker'] }
  }
} as const;

const snapshotAthleteSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    velocity: { type: 'integer' },
    attack: { type: 'integer' },
    defense: { type: 'integer' },
    type: { type: 'string', enum: ['defender', 'midfielder', 'attacker'] }
  }
} as const;

const snapshotGridSchema = {
  type: 'array',
  description: 'Grid 3x3 inicial salvo no snapshot antes da simulacao.',
  items: {
    type: 'array',
    items: {
      oneOf: [snapshotAthleteSchema, { type: 'null' }]
    }
  }
} as const;

const lineupSchema = {
  type: 'object',
  properties: {
    snapshotId: { type: 'integer' },
    teamId: { type: 'integer' },
    name: { type: 'string' },
    positions: snapshotGridSchema
  }
} as const;

const positionSchema = {
  type: 'object',
  required: ['athleteId', 'posX', 'posY'],
  properties: {
    athleteId: { type: 'integer', example: 21 },
    posX: { type: 'integer', minimum: 0, maximum: 2, example: 0 },
    posY: { type: 'integer', minimum: 0, maximum: 2, example: 0 }
  }
} as const;

const teamDtoSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    athlethes: { type: 'array', items: athleteSimSchema },
    turn: { type: 'integer' },
    victorys: { type: 'integer' },
    loses: { type: 'integer' },
    athletesPositions: {
      type: 'array',
      description: 'Grid 3x3 com atletas posicionados (defesa/meio/ataque).',
      items: {
        type: 'array',
        items: {
          oneOf: [athleteSimSchema, { type: 'null' }]
        }
      }
    }
  }
} as const;

const turnEventSchema = {
  type: 'object',
  properties: {
    turn: { type: 'integer', example: 1 },
    possession: { type: 'string', enum: ['player', 'opponent'] },
    ballRow: { type: 'integer', enum: [0, 1, 2, 3, 4, 5] },
    kind: {
      type: 'string',
      enum: ['move', 'pass', 'tackle', 'shot', 'turnover']
    },
    attackerTeamId: { type: 'integer' },
    defenderTeamId: { type: 'integer' },
    attackerId: { type: ['integer', 'null'] },
    attackerName: { type: ['string', 'null'] },
    defenderId: { type: ['integer', 'null'] },
    defenderName: { type: ['string', 'null'] },
    attackerRoll: { type: 'number' },
    defenderRoll: { type: 'number' },
    successChance: { type: 'number' },
    randomRoll: { type: 'number' },
    success: { type: 'boolean' },
    goal: { type: 'boolean' },
    movements: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          team: { type: 'string', enum: ['player', 'opponent'] },
          athleteId: { type: 'integer' },
          from: {
            type: 'object',
            properties: {
              x: { type: 'integer', enum: [0, 1, 2] },
              y: { type: 'integer', enum: [0, 1, 2, 3, 4, 5] }
            }
          },
          to: {
            type: 'object',
            properties: {
              x: { type: 'integer', enum: [0, 1, 2] },
              y: { type: 'integer', enum: [0, 1, 2, 3, 4, 5] }
            }
          }
        }
      }
    },
    ball: {
      type: 'object',
      properties: {
        team: { type: 'string', enum: ['player', 'opponent'] },
        athleteId: { type: 'integer' },
        athleteName: { type: 'string' },
        position: {
          type: 'object',
          properties: {
            x: { type: 'integer', enum: [0, 1, 2] },
            y: { type: 'integer', enum: [0, 1, 2, 3, 4, 5] }
          }
        }
      }
    },
    description: { type: 'string' }
  }
} as const;

const rodadaResultSchema = {
  type: 'object',
  properties: {
    lineups: {
      type: 'object',
      description:
        'Formacoes iniciais salvas nos snapshots antes do motor movimentar atletas.',
      properties: {
        player: lineupSchema,
        opponent: lineupSchema
      }
    },
    player: teamDtoSchema,
    opponent: teamDtoSchema,
    score: {
      type: 'object',
      properties: {
        player: { type: 'integer', example: 2 },
        opponent: { type: 'integer', example: 1 }
      }
    },
    winner: { type: 'string', enum: ['player', 'opponent', 'draw'] },
    totalTurns: { type: 'integer', example: 12 },
    initialBall: {
      type: 'object',
      properties: {
        team: { type: 'string', enum: ['player', 'opponent'] },
        athleteId: { type: 'integer' },
        athleteName: { type: 'string' },
        position: {
          type: 'object',
          properties: {
            x: { type: 'integer', enum: [0, 1, 2] },
            y: { type: 'integer', enum: [0, 1, 2, 3, 4, 5] }
          }
        }
      }
    },
    events: { type: 'array', items: turnEventSchema },
    matchmaking: {
      type: 'object',
      description: 'Detalhes do balanceamento RN006',
      properties: {
        snapshotId: { type: 'integer' },
        opponentSnapshotId: { type: 'integer' },
        opponentUserId: { type: 'integer' },
        victoryRatio: { type: 'number' },
        delta: { type: 'number', description: 'Diferenca |victoryRatio_player - victoryRatio_opp|' },
        windowUsed: { type: 'number', description: 'Tamanho da janela RN006 que retornou o adversario' }
      }
    },
    initiative: {
      type: 'object',
      description: 'Resultado da RN009 — quem comeca com a posse',
      properties: {
        playerLeadVelocity: {
          type: 'integer',
          description: 'Soma de velocidade da linha mais avancada do jogador.'
        },
        opponentLeadVelocity: {
          type: 'integer',
          description: 'Soma de velocidade da linha mais avancada do oponente.'
        },
        startsWith: { type: 'string', enum: ['player', 'opponent'] },
        carrier: {
          type: 'object',
          properties: {
            team: { type: 'string', enum: ['player', 'opponent'] },
            athleteId: { type: 'integer' },
            athleteName: { type: 'string' },
            position: {
              type: 'object',
              properties: {
                x: { type: 'integer', enum: [0, 1, 2] },
                y: { type: 'integer', enum: [0, 1, 2, 3, 4, 5] }
              }
            }
          }
        }
      }
    },
    persisted: {
      type: 'object',
      properties: {
        teamId: { type: 'integer' },
        victory: { type: 'integer' },
        lose: { type: 'integer' },
        round: { type: 'integer' }
      }
    },
    resolution: {
      type: 'object',
      description: 'Resolucao da partida (RN001/RN002) e trofeus (RF004/RF005)',
      properties: {
        matchStatus: { type: 'string', enum: ['in_progress', 'won', 'lost'] },
        matchEnded: { type: 'boolean' },
        trophiesDelta: { type: 'integer' },
        trophies: { type: 'integer' },
        coinsEarned: { type: 'integer', description: 'Moedas ganhas nesta rodada (RF010)' },
        coins: { type: 'integer', description: 'Saldo de moedas apos a rodada' },
        userVictory: { type: 'integer' },
        userDefeat: { type: 'integer' },
        isGuest: { type: 'boolean' },
        roundLogId: { type: 'integer' }
      }
    }
  }
} as const;

const errorRef = { $ref: 'ErrorResponse#' } as const;

const abandonCampaignResponseSchema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        coins: { type: 'integer' },
        trophies: { type: 'integer' }
      }
    },
    team: {
      anyOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            round: { type: 'integer' },
            victory: { type: 'integer' },
            lose: { type: 'integer' },
            draw: { type: 'integer' },
            athletesCount: { type: 'integer' }
          }
        },
        { type: 'null' }
      ]
    }
  }
} as const;

const playResultSchema = {
  type: 'object',
  properties: {
    matchId: {
      type: 'string',
      format: 'uuid',
      description: 'ID para conectar via WebSocket em /ws/battle/:matchId'
    },
    wsUrl: {
      type: 'string',
      description: 'Path do endpoint WebSocket para transmissao ao vivo'
    },
    ...rodadaResultSchema.properties
  }
} as const;

export const partidaRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: StartCampaignBody }>(
    '/start',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Match'],
        summary: tSwagger('match.start.summary'),
        description: tSwagger('match.start.description'),
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name'],
          additionalProperties: false,
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 40
            }
          }
        },
        response: {
          200: abandonCampaignResponseSchema,
          400: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const result = await startCampaign(
        request.user!.id,
        request.body.name
      );
      return reply.code(200).send(result);
    }
  );

  app.post(
    '/abandon',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Match'],
        summary: tSwagger('match.abandon.summary'),
        description: tSwagger('match.abandon.description'),
        security: [{ BearerAuth: [] }],
        response: {
          200: abandonCampaignResponseSchema,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const result = await abandonCampaign(request.user!.id);
      return reply.code(200).send(result);
    }
  );

  app.post<{ Body: JogarPartidaBody }>(
    '/play',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Match'],
        summary: tSwagger('match.play.summary'),
        description: tSwagger('match.play.description'),
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          required: ['positions'],
          additionalProperties: false,
          properties: {
            user_id: {
              type: 'integer',
              description:
                'Opcional. Quando informado deve coincidir com o usuario autenticado; o backend usa sempre o id do token.'
            },
            positions: {
              type: 'array',
              minItems: MIN_POSITIONED_ATHLETES,
              maxItems: MAX_POSITIONED_ATHLETES,
              items: positionSchema
            },
            items: {
              type: 'array',
              items: { type: 'integer' },
              description: 'IDs de itens aplicados (reservado para integracao futura).'
            }
          }
        },
        response: {
          200: playResultSchema,
          400: errorRef,
          403: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const authenticatedUserId = request.user!.id;
      const body = request.body;

      if (
        body.user_id !== undefined &&
        Number(body.user_id) !== authenticatedUserId
      ) {
        return reply.code(403).send({
          message: 'user_id nao corresponde ao usuario autenticado.',
          code: 'USER_MISMATCH'
        });
      }

      const result = await jogarRodadaComFormacao({
        userId: authenticatedUserId,
        positions: body.positions,
        items: body.items
      });

      const matchId = createMatchEntry(result);

      return reply.code(200).send({
        matchId,
        wsUrl: `/ws/battle/${matchId}`,
        ...result
      });
    }
  );

  app.post<{ Body: JogarRodadaBody }>(
    '/play-round',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Match'],
        summary: tSwagger('match.playRound.summary'),
        description: tSwagger('match.playRound.description'),
        security: [{ BearerAuth: [] }],
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            user_id: {
              type: 'integer',
              description:
                'Opcional. Quando informado deve coincidir com o usuario autenticado; o backend usa sempre o id do token.'
            },
            snapshot_id: {
              type: 'integer',
              description:
                'Opcional. Se nao informado, o servico cria um novo snapshot do estado atual do time.'
            }
          }
        },
        response: {
          200: rodadaResultSchema,
          400: errorRef,
          403: errorRef,
          404: errorRef
        }
      }
    },
    async (request, reply) => {
      const authenticatedUserId = request.user!.id;
      const body = request.body ?? {};

      if (
        body.user_id !== undefined &&
        Number(body.user_id) !== authenticatedUserId
      ) {
        return reply.code(403).send({
          message: 'user_id nao corresponde ao usuario autenticado.',
          code: 'USER_MISMATCH'
        });
      }

      const result = await jogarRodada({
        userId: authenticatedUserId,
        snapshotId: body.snapshot_id
      });
      return reply.code(200).send(result);
    }
  );
};
