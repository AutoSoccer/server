import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model
} from 'sequelize';

import { sequelize } from '../../config/database';

export type SnapshotAthlete = {
  id: number;
  name: string;
  velocity: number;
  attack: number;
  defense: number;
};

export type SnapshotPositions = (SnapshotAthlete | null)[][];

export class TeamSnapshot extends Model<
  InferAttributes<TeamSnapshot>,
  InferCreationAttributes<TeamSnapshot>
> {
  declare id: CreationOptional<number>;
  declare team_id: number;
  declare user_id: number;
  declare round: CreationOptional<number>;
  declare victory: CreationOptional<number>;
  declare lose: CreationOptional<number>;
  declare victory_ratio: CreationOptional<number>;
  declare positions: SnapshotPositions;
  declare created_at: CreationOptional<Date>;
}

TeamSnapshot.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    team_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'teams', key: 'id' }
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    },
    round: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1
    },
    victory: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    lose: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    victory_ratio: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      get() {
        const raw = this.getDataValue('victory_ratio');
        if (raw === null || raw === undefined) {
          return 0;
        }
        return typeof raw === 'string' ? Number(raw) : Number(raw);
      }
    },
    positions: {
      type: DataTypes.JSON,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'team_snapshots',
    modelName: 'TeamSnapshot',
    timestamps: false
  }
);
