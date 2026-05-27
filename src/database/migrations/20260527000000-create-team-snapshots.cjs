'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('team_snapshots', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      team_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      round: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1
      },
      victory: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      lose: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      victory_ratio: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0,
        comment: 'victory / max(1, victory + lose) - usado pelo matchmaking RN006'
      },
      positions: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Snapshot do grid 3x3 (defesa/meio/ataque) com atletas no momento'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('team_snapshots', ['victory_ratio'], {
      name: 'team_snapshots_victory_ratio_idx'
    });

    await queryInterface.addIndex('team_snapshots', ['user_id'], {
      name: 'team_snapshots_user_id_idx'
    });

    await queryInterface.addIndex('team_snapshots', ['team_id', 'round'], {
      name: 'team_snapshots_team_round_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('team_snapshots', 'team_snapshots_team_round_idx');
    await queryInterface.removeIndex('team_snapshots', 'team_snapshots_user_id_idx');
    await queryInterface.removeIndex('team_snapshots', 'team_snapshots_victory_ratio_idx');
    await queryInterface.dropTable('team_snapshots');
  }
};
