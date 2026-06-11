import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model
} from 'sequelize';

import { sequelize } from '../../config/database';

/**
 * Instancia de um item no inventario de um usuario (Task 4.1).
 * Cada linha e uma unidade comprada; ao ser aplicada, vira consumed=true e
 * registra em qual atleta/snapshot o bonus foi atrelado (log da rodada).
 */
export class UserItem extends Model<InferAttributes<UserItem>, InferCreationAttributes<UserItem>> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare item_id: number;
  declare consumed: CreationOptional<boolean>;
  declare athlete_id: CreationOptional<number | null>;
  declare snapshot_id: CreationOptional<number | null>;
  declare consumed_at: CreationOptional<Date | null>;
  declare created_at: CreationOptional<Date>;
}

UserItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    item_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'items', key: 'id' }
    },
    consumed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    athlete_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'athletes', key: 'id' }
    },
    snapshot_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'team_snapshots', key: 'id' }
    },
    consumed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'user_items',
    modelName: 'UserItem',
    timestamps: false
  }
);
