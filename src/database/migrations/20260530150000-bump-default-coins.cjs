'use strict';

/**
 * RF010 — eleva o saldo inicial padrao de coins de 1000 para 2500.
 * Com 1000 e atletas de ate 500 no mercado, um usuario novo nao consegue
 * montar os 6 atletas exigidos para a primeira partida. 2500 da folga para
 * ~6 atletas medianos e alguns itens. Afeta apenas cadastros futuros (default
 * da coluna); registros existentes mantem o saldo atual.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'coins', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 2500
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'coins', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1000
    });
  }
};
