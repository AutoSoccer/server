'use strict';

const ACTIVE_TYPES = ['defender', 'midfielder', 'attacker'];
const LEGACY_TYPES = ['goalkeeper', 'defender', 'attacker'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'athletes',
      { type: 'defender' },
      { type: 'goalkeeper' }
    );

    await queryInterface.changeColumn('athletes', 'type', {
      type: Sequelize.ENUM(...ACTIVE_TYPES),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('athletes', 'type', {
      type: Sequelize.ENUM(...LEGACY_TYPES),
      allowNull: false
    });
  }
};
