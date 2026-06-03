'use strict';

/**
 * Economia original: custo fixo de atleta (3) e saldo inicial (10).
 * Mantem o saldo de usuarios existentes intacto; apenas novos usuarios
 * passam a nascer com 10 coins. Atletas existentes sao normalizados para 3.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'coins', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 10
    });

    await queryInterface.bulkUpdate('athletes', { cost: 3 }, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'coins', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 10
    });
  }
};
