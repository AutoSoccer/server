/**
 * Stub minimo de Sequelize para os testes de integracao: registra um sequelize
 * sem conexao real, suficiente para que Model.init seja chamado no carregamento
 * dos models. Os testes mockam findOne/findByPk/create por cima.
 */
import { Sequelize } from 'sequelize';

let cached: Sequelize | null = null;

export const getSequelizeStub = (): Sequelize => {
  if (cached) {
    return cached;
  }
  cached = new Sequelize('test', 'test', 'test', {
    dialect: 'mysql',
    logging: false
  });
  return cached;
};
