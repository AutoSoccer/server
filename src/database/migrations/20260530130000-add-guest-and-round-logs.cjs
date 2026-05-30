'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'is_guest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.createTable('round_logs', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      team_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      snapshot_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'team_snapshots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      opponent_snapshot_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'team_snapshots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      round: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1
      },
      winner: {
        type: Sequelize.ENUM('player', 'opponent', 'draw'),
        allowNull: false
      },
      player_score: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      opponent_score: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      match_status: {
        type: Sequelize.ENUM('in_progress', 'won', 'lost'),
        allowNull: false,
        defaultValue: 'in_progress'
      },
      trophies_delta: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('round_logs', ['user_id'], {
      name: 'round_logs_user_id'
    });
    await queryInterface.addIndex('round_logs', ['user_id', 'match_status'], {
      name: 'round_logs_user_id_match_status'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('round_logs', 'round_logs_user_id_match_status');
    await queryInterface.removeIndex('round_logs', 'round_logs_user_id');
    await queryInterface.dropTable('round_logs');
    await queryInterface.removeColumn('users', 'is_guest');
  }
};
