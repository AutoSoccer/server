import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model
} from 'sequelize';

import { sequelize } from '../../config/database';

export class MarketWindow extends Model<
  InferAttributes<MarketWindow>,
  InferCreationAttributes<MarketWindow>
> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare athlete_id: number;
  declare slot: number;
  declare refreshed_at: CreationOptional<Date>;
}

MarketWindow.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    athlete_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'athletes',
        key: 'id'
      }
    },
    slot: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    refreshed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'market_windows',
    modelName: 'MarketWindow',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'slot']
      }
    ]
  }
);
