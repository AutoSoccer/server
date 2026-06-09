import { sequelize } from '../../config/database';
import {
  MarketWindow,
  Team,
  TeamAthlete,
  User
} from '../../database/models';
import { COINS_PER_ROUND } from './rodada.logic';

export type CampaignServiceErrorCode =
  | 'USER_NOT_FOUND'
  | 'INVALID_TEAM_NAME';

export class CampaignServiceError extends Error {
  public readonly code: CampaignServiceErrorCode;

  constructor(code: CampaignServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type CampaignUserResult = {
  id: number;
  coins: number;
  trophies: number;
};

type CampaignTeamResult = {
  id: number;
  name: string;
  round: number;
  victory: number;
  lose: number;
  draw: number;
  athletesCount: number;
};

export type AbandonCampaignResult = {
  user: CampaignUserResult;
  team: CampaignTeamResult | null;
};

export type StartCampaignResult = {
  user: CampaignUserResult;
  team: CampaignTeamResult;
};

/**
 * Abandona somente a campanha em andamento. Snapshots e logs permanecem como
 * historico, enquanto equipe, progresso e saldo voltam ao estado inicial.
 */
export const abandonCampaign = async (
  userId: number
): Promise<AbandonCampaignResult> => {
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!user) {
      throw new CampaignServiceError(
        'USER_NOT_FOUND',
        'Usuario nao encontrado.'
      );
    }

    const team = await Team.findOne({
      where: { user_id: userId },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (team) {
      await TeamAthlete.destroy({
        where: { team_id: team.id },
        transaction
      });

      team.round = 1;
      team.victory = 0;
      team.lose = 0;
      team.draw = 0;
      await team.save({ transaction });
    }

    user.coins = COINS_PER_ROUND;
    await user.save({ transaction });

    return {
      user: {
        id: user.id,
        coins: user.coins,
        trophies: user.trophies
      },
      team: team
        ? {
            id: team.id,
            name: team.name,
            round: team.round,
            victory: team.victory,
            lose: team.lose,
            draw: team.draw,
            athletesCount: 0
          }
        : null
    };
  });
};

/**
 * Sempre inicia uma campanha limpa com o nome escolhido. A equipe existente e
 * reutilizada para preservar suas referencias historicas.
 */
export const startCampaign = async (
  userId: number,
  rawTeamName: string
): Promise<StartCampaignResult> => {
  const teamName = rawTeamName.trim();

  if (teamName.length === 0 || teamName.length > 40) {
    throw new CampaignServiceError(
      'INVALID_TEAM_NAME',
      'O nome do time deve ter entre 1 e 40 caracteres.'
    );
  }

  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!user) {
      throw new CampaignServiceError(
        'USER_NOT_FOUND',
        'Usuario nao encontrado.'
      );
    }

    let team = await Team.findOne({
      where: { user_id: userId },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (team) {
      await TeamAthlete.destroy({
        where: { team_id: team.id },
        transaction
      });

      team.name = teamName;
      team.round = 1;
      team.victory = 0;
      team.lose = 0;
      team.draw = 0;
      await team.save({ transaction });
    } else {
      team = await Team.create(
        {
          user_id: userId,
          name: teamName,
          round: 1,
          victory: 0,
          lose: 0,
          draw: 0
        },
        { transaction }
      );
    }

    await MarketWindow.destroy({
      where: { user_id: userId },
      transaction
    });

    user.coins = COINS_PER_ROUND;
    await user.save({ transaction });

    return {
      user: {
        id: user.id,
        coins: user.coins,
        trophies: user.trophies
      },
      team: {
        id: team.id,
        name: team.name,
        round: team.round,
        victory: team.victory,
        lose: team.lose,
        draw: team.draw,
        athletesCount: 0
      }
    };
  });
};
