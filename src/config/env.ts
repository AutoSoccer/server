import 'dotenv/config';

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const parseNumber = (value: string, key: string): number => {
  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    throw new Error(`Environment variable ${key} must be a valid number.`);
  }

  return parsedValue;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseNumber(process.env.PORT ?? '3000', 'PORT'),
  dbHost: requiredEnv('DB_HOST'),
  dbPort: parseNumber(process.env.DB_PORT ?? '3306', 'DB_PORT'),
  dbName: requiredEnv('DB_NAME'),
  dbUser: requiredEnv('DB_USER'),
  dbPassword: process.env.DB_PASSWORD ?? '',
  dbSsl: (process.env.DB_SSL ?? 'false').toLowerCase() === 'true',
  jwtSecret: requiredEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '5d'
};
