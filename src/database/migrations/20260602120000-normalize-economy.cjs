'use strict';

/**
 * Economia original: custo fixo de atleta (3) e saldo inicial (10).
 * Atualiza dados existentes para ambiente dev/teste.
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'coins', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 10
    });

    await queryInterface.bulkUpdate('users', { coins: 10 }, {});
    await queryInterface.bulkUpdate('athletes', { cost: 3 }, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'coins', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1000
    });
  }
};
