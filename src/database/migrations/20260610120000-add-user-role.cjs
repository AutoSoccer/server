'use strict';

/**
 * T5 (JWT com 2 permissoes): adiciona a coluna `role` em `users` para
 * distinguir usuarios comuns ('user') de administradores ('admin').
 *
 * Tambem adiciona `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP), usado
 * pela listagem administrativa GET /admin/users — a tabela original nao
 * possuia timestamps. Registros pre-existentes recebem o timestamp da
 * execucao desta migration.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    });

    await queryInterface.addColumn('users', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'created_at');
    await queryInterface.removeColumn('users', 'role');
  }
};
