import { Sequelize } from 'sequelize';

import { env } from './env';

const sequelizeLogging = env.nodeEnv === 'development' ? console.log : false;

export const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
  host: env.dbHost,
  port: env.dbPort,
  dialect: 'mysql',
  logging: sequelizeLogging,
  dialectOptions: env.dbSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : undefined
});

export const connectDatabase = async (): Promise<void> => {
  await sequelize.authenticate();
};

export const disconnectDatabase = async (): Promise<void> => {
  await sequelize.close();
};
