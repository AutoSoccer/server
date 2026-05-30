'use strict';

/**
 * RN006 — para o matchmaking refletir "rodadas vencidas E rodadas ja jogadas",
 * passamos a contabilizar tambem os empates. Adiciona a coluna draw em teams e
 * team_snapshots (rodadas jogadas = victory + lose + draw).
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teams', 'draw', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('team_snapshots', 'draw', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('team_snapshots', 'draw');
    await queryInterface.removeColumn('teams', 'draw');
  }
};
