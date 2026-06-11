'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'phone_number', {
      type: Sequelize.STRING(20),
      allowNull: true,
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'phone_number', {
      type: Sequelize.STRING(14),
      allowNull: true,
      unique: true
    });
  }
};
