import { Sequelize, type Options } from 'sequelize';

import { env } from './env';

const sequelizeLogging = env.nodeEnv === 'development' ? console.log : false;

const dialectOptions = env.dbSsl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  : undefined;

const buildSequelize = (): Sequelize => {
  if (env.databaseUrl) {
    const options: Options = {
      dialect: 'mysql',
      logging: sequelizeLogging,
      dialectOptions
    };

    return new Sequelize(env.databaseUrl, options);
  }

  return new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
    host: env.dbHost,
    port: env.dbPort,
    dialect: 'mysql',
    logging: sequelizeLogging,
    dialectOptions
  });
};

export const sequelize = buildSequelize();

export const connectDatabase = async (): Promise<void> => {
  await sequelize.authenticate();
};

export const disconnectDatabase = async (): Promise<void> => {
  await sequelize.close();
};
