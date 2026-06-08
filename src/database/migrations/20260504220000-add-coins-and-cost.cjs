'use strict';

const ATHLETE_COST = 3;
const INITIAL_USER_COINS = 10;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'coins', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: INITIAL_USER_COINS
    });

    await queryInterface.addColumn('athletes', 'cost', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: ATHLETE_COST
    });

    await queryInterface.bulkUpdate('athletes', { cost: ATHLETE_COST }, {});
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('athletes', 'cost');
    await queryInterface.removeColumn('users', 'coins');
  }
};
