import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model
} from 'sequelize';

import { sequelize } from '../../config/database';

export class Item extends Model<InferAttributes<Item>, InferCreationAttributes<Item>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string>;
  declare modifier_attack: CreationOptional<number>;
  declare modifier_defense: CreationOptional<number>;
  declare modifier_velocity: CreationOptional<number>;
  declare cost: CreationOptional<number>;
  /** Define se o mesmo item pode ser aplicado mais de uma vez no mesmo atleta na rodada. */
  declare stackable: CreationOptional<boolean>;
  declare is_active: CreationOptional<boolean>;
}

Item.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    },
    modifier_attack: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    modifier_defense: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    modifier_velocity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    cost: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    stackable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'items',
    modelName: 'Item',
    timestamps: false
  }
);
