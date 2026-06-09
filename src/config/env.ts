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
