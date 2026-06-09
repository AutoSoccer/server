/**
 * Schemas reutilizaveis publicados em `components.schemas` da especificacao
 * OpenAPI. Use `{ $ref: '#/components/schemas/<Nome>' }` nas rotas para evitar
 * duplicacao e manter um unico ponto de verdade para cada contrato.
 *
 * As definicoes seguem o flavor JSON Schema aceito pelo `@fastify/swagger`
 * (que e validado pelo Ajv configurado no `buildApp`).
 */

const ErrorResponse = {
  type: 'object',
  required: ['message'],
  properties: {
    code: { type: 'string', example: 'NOT_FOUND' },
    message: { type: 'string', example: 'Recurso nao encontrado.' },
    details: {
      type: 'object',
      additionalProperties: true,
      description:
        'Campo opcional com metadados estruturados sobre o erro (ex.: campos invalidos).'
    }
  }
} as const;

const UserResponse = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Lucas Stopinski' },
    nickname: { type: 'string', example: 'lucas' },
    email: { type: 'string', example: 'lucas@gmail.com' },
    phone_number: { type: ['string', 'null'], example: '11900000001' },
    victory: { type: 'integer', example: 0 },
    defeat: { type: 'integer', example: 0 },
    trophies: { type: 'integer', example: 0 },
    coins: { type: 'integer', example: 1000 },
    is_guest: { type: 'boolean', example: false }
  }
} as const;

const AuthResponse = {
  type: 'object',
  required: ['token', 'user'],
  properties: {
    token: { type: 'string', description: 'Token JWT (Bearer).' },
    user: { $ref: '#/components/schemas/UserResponse' }
  }
} as const;

const Ability = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Disparo certeiro' },
    description: {
      type: 'string',
      example: 'Aumenta a chance de gol em finalizacoes a longa distancia.'
    }
  }
} as const;

const Athlete = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 21 },
    name: { type: 'string', example: 'Lucas Forward' },
    position: {
      type: 'string',
      enum: ['defender', 'midfielder', 'attacker'],
      description: 'Posicao tatica do atleta (compativel com o campo "type" do modelo).'
    },
    attack: { type: 'integer', example: 60 },
    defense: { type: 'integer', example: 40 },
    speed: { type: 'integer', example: 55 },
    cost: { type: 'integer', example: 4 },
    ability_id: {
      type: ['integer', 'null'],
      example: 1,
      description: 'ID da habilidade associada ao atleta (opcional).'
    }
  }
} as const;

const Item = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Chuteira veloz' },
    description: {
      type: 'string',
      example: 'Aumenta a velocidade do atleta na proxima rodada.'
    },
    cost: { type: 'integer', example: 5 },
    stackable: { type: 'boolean', example: false },
    ability_id: {
      type: ['integer', 'null'],
      example: null,
      description: 'ID da habilidade vinculada ao item, quando aplicavel.'
    }
  }
} as const;

const MarketResponse = {
  type: 'object',
  properties: {
    athletes: {
      type: 'array',
      items: { $ref: '#/components/schemas/Athlete' }
    },
    items: {
      type: 'array',
      items: { $ref: '#/components/schemas/Item' }
    }
  }
} as const;

const TeamResponse = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Equipe Lucas' },
    victory: { type: 'integer', example: 3 },
    defeat: { type: 'integer', example: 1 },
    draw: { type: 'integer', example: 0 },
    athletes: {
      type: 'array',
      items: { $ref: '#/components/schemas/Athlete' }
    }
  }
} as const;

const SnapshotPosition = {
  type: 'object',
  required: ['athleteId', 'posX', 'posY'],
  properties: {
    athleteId: { type: 'integer', example: 21 },
    posX: { type: 'integer', minimum: 0, maximum: 2, example: 0 },
    posY: { type: 'integer', minimum: 0, maximum: 2, example: 0 }
  }
} as const;

const RodadaResult = {
  type: 'object',
  description:
    'Resultado da rodada simulada (motor de 12 turnos), com placar, status, trofeus e moedas.',
  properties: {
    score: {
      type: 'object',
      properties: {
        player: { type: 'integer', example: 2 },
        opponent: { type: 'integer', example: 1 }
      }
    },
    winner: { type: 'string', enum: ['player', 'opponent', 'draw'] },
    status: {
      type: 'string',
      enum: ['in_progress', 'won', 'lost'],
      description: 'Status agregado da campanha apos a rodada (RN001/RN002).'
    },
    trophies: { type: 'integer', example: 30 },
    trophiesDelta: { type: 'integer', example: 5 },
    coins: { type: 'integer', example: 12 },
    coinsEarned: { type: 'integer', example: 2 }
  }
} as const;

const RankingEntry = {
  type: 'object',
  required: ['position', 'nickname', 'trophies', 'victory', 'defeat'],
  properties: {
    position: { type: 'integer', example: 1 },
    nickname: { type: 'string', example: 'lucas' },
    trophies: { type: 'integer', example: 120 },
    victory: { type: 'integer', example: 9 },
    defeat: { type: 'integer', example: 3 }
  }
} as const;

export const swaggerSchemas = {
  ErrorResponse,
  AuthResponse,
  UserResponse,
  Athlete,
  MarketResponse,
  TeamResponse,
  SnapshotPosition,
  RodadaResult,
  RankingEntry,
  Item,
  Ability
} as const;

export type SwaggerSchemaName = keyof typeof swaggerSchemas;
