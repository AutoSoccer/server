import 'dotenv/config';

import { ConfigError } from '../modules/shared/configError';

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new ConfigError(
      'CONFIG_MISSING_ENV',
      `Missing required environment variable: ${key}`
    );
  }

  return value;
};

const parseNumber = (value: string, key: string): number => {
  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    throw new ConfigError(
      'CONFIG_INVALID_ENV',
      `Environment variable ${key} must be a valid number.`
    );
  }

  return parsedValue;
};

const databaseUrl = process.env.DATABASE_URL ?? '';
const hasDatabaseUrl = databaseUrl.length > 0;

const optionalDbValue = (key: string, fallback = ''): string => {
  const value = process.env[key];
  if (value && value.length > 0) {
    return value;
  }

  if (hasDatabaseUrl) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${key}`);
};

/**
 * Detecta se `CORS_ORIGIN` resolve para wildcard (qualquer origem permitida).
 * Cobre tanto `*` quanto string vazia, espelhando o comportamento de
 * `parseCorsOrigin` em `src/app.ts`, que converte ambos para `true` no plugin
 * `@fastify/cors`.
 */
const resolvesToCorsWildcard = (raw: string): boolean => {
  const trimmed = raw.trim();
  return trimmed === '' || trimmed === '*';
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseNumber(process.env.PORT ?? process.env.APP_PORT ?? '3333', 'PORT'),
  host: process.env.APP_HOST ?? '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  databaseUrl,
  dbHost: optionalDbValue('DB_HOST', 'localhost'),
  dbPort: parseNumber(process.env.DB_PORT ?? '3306', 'DB_PORT'),
  dbName: optionalDbValue('DB_NAME', ''),
  dbUser: optionalDbValue('DB_USER', ''),
  dbPassword: process.env.DB_PASSWORD ?? '',
  dbSsl: (process.env.DB_SSL ?? 'false').toLowerCase() === 'true',
  jwtSecret: requiredEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '5d'
};

// Guard de seguranca: em producao nao toleramos CORS wildcard (`*` ou string
// vazia, ambos viram `origin: true` no plugin do Fastify). Isso expoe a API
// para qualquer origem com credenciais, o que e um vetor de CSRF/abuso. O
// boot deve falhar cedo para que o operador defina explicitamente as origens
// permitidas via `CORS_ORIGIN`.
if (env.nodeEnv === 'production' && resolvesToCorsWildcard(env.corsOrigin)) {
  throw new ConfigError(
    'CONFIG_CORS_WILDCARD_IN_PRODUCTION',
    'CORS_ORIGIN nao pode ser wildcard ("*" ou vazio) quando NODE_ENV=production. Defina origens explicitas separadas por virgula.'
  );
}
