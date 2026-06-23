'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'city', {
      type: Sequelize.STRING(80),
      allowNull: true,
      defaultValue: null,
      after: 'phone_number'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'city');
  }
};
