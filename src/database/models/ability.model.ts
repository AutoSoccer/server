import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model
} from 'sequelize';

import { sequelize } from '../../config/database';

export class Ability extends Model<InferAttributes<Ability>, InferCreationAttributes<Ability>> {
  declare id: CreationOptional<number>;
  declare description: string;
  declare name: string;
  declare is_active: boolean;
}

Ability.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    description: {
      type: DataTypes.STRING(366),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'abilities',
    modelName: 'Ability',
    timestamps: false
  }
);
