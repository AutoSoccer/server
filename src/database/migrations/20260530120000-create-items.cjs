'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('items', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: ''
      },
      modifier_attack: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      modifier_defense: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      modifier_velocity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cost: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      stackable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    await queryInterface.createTable('user_items', {
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
      item_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      consumed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      athlete_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'athletes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      snapshot_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'team_snapshots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      consumed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('user_items', ['user_id', 'consumed'], {
      name: 'user_items_user_id_consumed'
    });
    await queryInterface.addIndex('user_items', ['user_id', 'item_id'], {
      name: 'user_items_user_id_item_id'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('user_items', 'user_items_user_id_item_id');
    await queryInterface.removeIndex('user_items', 'user_items_user_id_consumed');
    await queryInterface.dropTable('user_items');
    await queryInterface.dropTable('items');
  }
};
