require('dotenv').config();

const useUrl = (process.env.DATABASE_URL ?? '').trim().length > 0;

const baseConfig = (extra = {}) =>
  useUrl
    ? { use_env_variable: 'DATABASE_URL', dialect: 'mysql', ...extra }
    : {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 3306),
        dialect: 'mysql',
        ...extra
      };

const sslOptions =
  (process.env.DB_SSL ?? 'false').toLowerCase() === 'true'
    ? {
        dialectOptions: {
          ssl: { require: true, rejectUnauthorized: false }
        }
      }
    : {};

module.exports = {
  development: baseConfig(),
  test: baseConfig(),
  production: baseConfig(sslOptions)
};
