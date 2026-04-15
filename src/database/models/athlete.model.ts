import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model
} from 'sequelize';

import { sequelize } from '../../config/database';

export const ATHLETE_TIERS = ['bronze', 'silver', 'gold', 'epic', 'legend'] as const;
export const ATHLETE_TYPES = ['goalkeeper', 'defender', 'attacker'] as const;

export class Athlete extends Model<InferAttributes<Athlete>, InferCreationAttributes<Athlete>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare velocity: number;
  declare attack: number;
  declare defense: number;
  declare ability_id: number;
  declare tier: (typeof ATHLETE_TIERS)[number];
  declare type: (typeof ATHLETE_TYPES)[number];
}

Athlete.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    velocity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    attack: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    defense: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    ability_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'abilities',
        key: 'id'
      }
    },
    tier: {
      type: DataTypes.ENUM(...ATHLETE_TIERS),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(...ATHLETE_TYPES),
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'athletes',
    modelName: 'Athlete',
    timestamps: false
  }
);
