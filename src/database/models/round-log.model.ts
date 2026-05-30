import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model
} from 'sequelize';

import { sequelize } from '../../config/database';

export type RoundWinner = 'player' | 'opponent' | 'draw';
export type MatchStatus = 'in_progress' | 'won' | 'lost';

/**
 * Log imutavel de uma rodada jogada (Task 4.6). Guarda o placar, o vencedor,
 * o status da partida apos a rodada e a variacao de trofeus aplicada.
 */
export class RoundLog extends Model<
  InferAttributes<RoundLog>,
  InferCreationAttributes<RoundLog>
> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare team_id: number;
  declare snapshot_id: CreationOptional<number | null>;
  declare opponent_snapshot_id: CreationOptional<number | null>;
  declare round: number;
  declare winner: RoundWinner;
  declare player_score: CreationOptional<number>;
  declare opponent_score: CreationOptional<number>;
  declare match_status: CreationOptional<MatchStatus>;
  declare trophies_delta: CreationOptional<number>;
  declare created_at: CreationOptional<Date>;
}

RoundLog.init(
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
    team_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'teams', key: 'id' }
    },
    snapshot_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'team_snapshots', key: 'id' }
    },
    opponent_snapshot_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'team_snapshots', key: 'id' }
    },
    round: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1
    },
    winner: {
      type: DataTypes.ENUM('player', 'opponent', 'draw'),
      allowNull: false
    },
    player_score: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    opponent_score: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    match_status: {
      type: DataTypes.ENUM('in_progress', 'won', 'lost'),
      allowNull: false,
      defaultValue: 'in_progress'
    },
    trophies_delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'round_logs',
    modelName: 'RoundLog',
    timestamps: false
  }
);
