import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type CreationOptional
} from 'sequelize';

import { sequelize } from '../../config/database';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare name: string | null;
  declare nickname: string;
  declare hashed_password: string;
  declare email: string;
  declare phone_number: string | null;
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
      allowNull: true
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
    }
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: false
  }
);
