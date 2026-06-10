/**
 * Schemas reutilizaveis publicados em `components.schemas` da especificacao
 * OpenAPI. Sao registrados em `app.addSchema()` (em `swagger.ts`) usando o
 * proprio nome como `$id`, entao basta referencia-los nas rotas com
 * `{ $ref: '<Nome>#' }`. O `@fastify/swagger` mapeia automaticamente cada
 * `$id` para `#/components/schemas/<Nome>` na spec final.
 *
 * As definicoes seguem o flavor JSON Schema aceito pelo `@fastify/swagger`
 * (que e validado pelo Ajv configurado no `buildApp`).
 */

const ErrorResponse = {
  type: 'object',
  required: ['message'],
  additionalProperties: true,
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
  additionalProperties: true,
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
  additionalProperties: true,
  properties: {
    token: { type: 'string', description: 'Token JWT (Bearer).' },
    user: { $ref: 'UserResponse#' }
  }
} as const;

const Ability = {
  type: 'object',
  additionalProperties: true,
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
  additionalProperties: true,
  properties: {
    id: { type: 'integer', example: 21 },
    name: { type: 'string', example: 'Lucas Forward' },
    position: {
      type: 'string',
      enum: ['defender', 'midfielder', 'attacker'],
      description: 'Posicao tatica do atleta (campo "type" do modelo). Em respostas legadas pode aparecer apenas como "type".'
    },
    attack: { type: 'integer', example: 60 },
    defense: { type: 'integer', example: 40 },
    speed: { type: 'integer', example: 55, description: 'Velocidade do atleta (alias de "velocity" no modelo).' },
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
  additionalProperties: true,
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
  additionalProperties: true,
  properties: {
    athletes: {
      type: 'array',
      items: { $ref: 'Athlete#' }
    },
    items: {
      type: 'array',
      items: { $ref: 'Item#' }
    }
  }
} as const;

const TeamResponse = {
  type: 'object',
  additionalProperties: true,
  description:
    'Resumo da equipe do treinador. Pode incluir campos extras (round, max_athletes, athletes_count etc.) preservados em runtime.',
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Equipe Lucas' },
    victory: { type: 'integer', example: 3 },
    defeat: { type: 'integer', example: 1 },
    draw: { type: 'integer', example: 0 },
    athletes: {
      type: 'array',
      items: { $ref: 'Athlete#' }
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
  additionalProperties: true,
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
  additionalProperties: true,
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
