import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model
} from 'sequelize';

import { sequelize } from '../../config/database';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare nickname: string;
  declare hashed_password: string;
  declare email: string;
  declare phone_number: string | null;
  declare victory: CreationOptional<number>;
  declare defeat: CreationOptional<number>;
  declare trophies: CreationOptional<number>;
  declare coins: CreationOptional<number>;
  declare is_guest: CreationOptional<boolean>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    hashed_password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: true
    },
    phone_number: {
      type: DataTypes.STRING(14),
      allowNull: true,
      unique: true
    },
    victory: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    defeat: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    trophies: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    coins: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 2500
    },
    is_guest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: false
  }
);
