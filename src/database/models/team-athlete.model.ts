import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model
} from 'sequelize';

import { sequelize } from '../../config/database';

export class TeamAthlete extends Model<
  InferAttributes<TeamAthlete>,
  InferCreationAttributes<TeamAthlete>
> {
  declare id: CreationOptional<number>;
  declare team_id: number;
  declare athlete_id: number;
}

TeamAthlete.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    team_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'teams',
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
    }
  },
  {
    sequelize,
    tableName: 'team_athletes',
    modelName: 'TeamAthlete',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['team_id', 'athlete_id']
      }
    ]
  }
);
