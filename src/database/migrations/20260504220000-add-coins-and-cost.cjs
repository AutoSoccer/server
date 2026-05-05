'use strict';

const TIER_COSTS = {
  bronze: 50,
  silver: 120,
  gold: 250,
  epic: 500,
  legend: 1000
};

const INITIAL_USER_COINS = 1000;

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
      defaultValue: 0
    });

    for (const [tier, cost] of Object.entries(TIER_COSTS)) {
      await queryInterface.bulkUpdate('athletes', { cost }, { tier });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('athletes', 'cost');
    await queryInterface.removeColumn('users', 'coins');
  }
};
