'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true
      },
      name: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      nickname: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      hashed_password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(60),
        allowNull: false,
        unique: true
      },
      phone_number: {
        type: Sequelize.STRING(14),
        allowNull: true,
        unique: true
      },
      victory: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      defeat: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      },
      trophies: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0
      }
    });

    await queryInterface.createTable('abilities', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true
      },
      description: {
        type: Sequelize.STRING(366),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(40),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    await queryInterface.createTable('athletes', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      velocity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      attack: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      defense: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false
      },
      ability_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'abilities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      tier: {
        type: Sequelize.ENUM('bronze', 'silver', 'gold', 'epic', 'legend'),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('goalkeeper', 'defender', 'attacker'),
        allowNull: false
      }
    });

    await queryInterface.createTable('teams', {
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
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(40),
        allowNull: false
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
      }
    });

    await queryInterface.createTable('team_athletes', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        unique: true
      },
      team_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      athlete_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'athletes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });

    await queryInterface.addIndex('team_athletes', ['team_id', 'athlete_id'], {
      unique: true,
      name: 'team_athletes_team_id_athlete_id_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('team_athletes', 'team_athletes_team_id_athlete_id_unique');
    await queryInterface.dropTable('team_athletes');
    await queryInterface.dropTable('teams');
    await queryInterface.dropTable('athletes');
    await queryInterface.dropTable('abilities');
    await queryInterface.dropTable('users');
  }
};
