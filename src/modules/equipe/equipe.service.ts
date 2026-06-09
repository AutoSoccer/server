import { type Transaction } from 'sequelize';

import { sequelize } from '../../config/database';
import { Athlete, MarketWindow, Team, TeamAthlete, User } from '../../database/models';

export const TEAM_MAX_ATHLETES = 6;
export const ATHLETE_SELL_REFUND = 2;

export type EquipeServiceErrorCode =
  | 'INSUFFICIENT_COINS'
  | 'TEAM_FULL'
  | 'ATHLETE_NOT_AVAILABLE'
  | 'ATHLETE_NOT_OWNED'
  | 'TEAM_NOT_FOUND'
  | 'USER_NOT_FOUND';

export type EquipeServiceErrorOptions = {
  /** Chave hierarquica i18n (ex.: `equipe.buyAthlete.insufficientBalance`). */
  i18nKey?: string;
  /** Parametros usados na interpolacao i18n. */
  params?: Record<string, unknown>;
};

export class EquipeServiceError extends Error {
  public readonly code: EquipeServiceErrorCode;
  public readonly i18nKey: string;
  public readonly params?: Record<string, unknown>;

  constructor(code: EquipeServiceErrorCode, options: EquipeServiceErrorOptions = {}) {
    const i18nKey = options.i18nKey ?? `equipe.errors.${code}`;
    super(i18nKey);
    this.name = 'EquipeServiceError';
    this.code = code;
    this.i18nKey = i18nKey;
    this.params = options.params;
  }
}

export type BuyAthleteResult = {
  user: {
    id: number;
    coins: number;
  };
  team: {
    id: number;
    athletes_count: number;
  };
  athlete: {
    id: number;
    name: string;
    cost: number;
    tier: string;
    type: string;
  };
};

export type SellAthleteResult = {
  user: {
    id: number;
    coins: number;
  };
  team: {
    id: number;
    athletes_count: number;
  };
  athlete: {
    id: number;
    name: string;
    refund: number;
    tier: string;
    type: string;
  };
};

export type TeamAthleteSummary = {
  id: number;
  name: string;
  velocity: number;
  attack: number;
  defense: number;
  ability_id: number;
  tier: string;
  type: string;
  cost: number;
  overall: number;
};

export type TeamSummary = {
  id: number;
  name: string;
  round: number;
  victory: number;
  lose: number;
  athletes_count: number;
  max_athletes: number;
  athletes: TeamAthleteSummary[];
} | null;

const calculateOverall = (athlete: Athlete): number =>
  Math.round((athlete.velocity + athlete.attack + athlete.defense) / 3);

export const getMyTeam = async (userId: number): Promise<TeamSummary> => {
  const team = await Team.findOne({
    where: { user_id: userId },
    order: [['id', 'ASC']],
    include: [
      {
        association: 'athletes',
        required: false
      }
    ]
  });

  if (!team) {
    return null;
  }

  const athletes = (team.get('athletes') as Athlete[] | undefined) ?? [];

  return {
    id: team.id,
    name: team.name,
    round: team.round,
    victory: team.victory,
    lose: team.lose,
    athletes_count: athletes.length,
    max_athletes: TEAM_MAX_ATHLETES,
    athletes: athletes.map((athlete) => ({
      id: athlete.id,
      name: athlete.name,
      velocity: athlete.velocity,
      attack: athlete.attack,
      defense: athlete.defense,
      ability_id: athlete.ability_id,
      tier: athlete.tier,
      type: athlete.type,
      cost: athlete.cost,
      overall: calculateOverall(athlete)
    }))
  };
};

const ensureTeam = async (userId: number, transaction: Transaction): Promise<Team> => {
  const existingTeam = await Team.findOne({
    where: { user_id: userId },
    order: [['id', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  if (existingTeam) {
    return existingTeam;
  }

  return Team.create(
    {
      user_id: userId,
      name: `Equipe ${userId}`,
      round: 1,
      victory: 0,
      lose: 0
    },
    { transaction }
  );
};

export const buyAthlete = async (
  userId: number,
  athleteId: number
): Promise<BuyAthleteResult> => {
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!user) {
      throw new EquipeServiceError('USER_NOT_FOUND', {
        i18nKey: 'equipe.buyAthlete.userNotFound'
      });
    }

    const marketEntry = await MarketWindow.findOne({
      where: {
        user_id: userId,
        athlete_id: athleteId
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!marketEntry) {
      throw new EquipeServiceError('ATHLETE_NOT_AVAILABLE', {
        i18nKey: 'equipe.buyAthlete.athleteNotAvailable'
      });
    }

    const athlete = await Athlete.findByPk(athleteId, { transaction });

    if (!athlete) {
      throw new EquipeServiceError('ATHLETE_NOT_AVAILABLE', {
        i18nKey: 'equipe.buyAthlete.athleteNotFound'
      });
    }

    const team = await ensureTeam(userId, transaction);

    const athleteCount = await TeamAthlete.count({
      where: { team_id: team.id },
      transaction
    });

    if (athleteCount >= TEAM_MAX_ATHLETES) {
      throw new EquipeServiceError('TEAM_FULL', {
        i18nKey: 'equipe.buyAthlete.teamFull',
        params: { max: TEAM_MAX_ATHLETES }
      });
    }

    const cost = athlete.cost;

    if (user.coins < cost) {
      throw new EquipeServiceError('INSUFFICIENT_COINS', {
        i18nKey: 'equipe.buyAthlete.insufficientBalance'
      });
    }

    user.coins -= cost;
    await user.save({ transaction });

    await TeamAthlete.create(
      {
        team_id: team.id,
        athlete_id: athlete.id
      },
      { transaction }
    );

    await marketEntry.destroy({ transaction });

    return {
      user: {
        id: user.id,
        coins: user.coins
      },
      team: {
        id: team.id,
        athletes_count: athleteCount + 1
      },
      athlete: {
        id: athlete.id,
        name: athlete.name,
        cost,
        tier: athlete.tier,
        type: athlete.type
      }
    };
  });
};

export const sellAthlete = async (
  userId: number,
  athleteId: number
): Promise<SellAthleteResult> => {
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!user) {
      throw new EquipeServiceError('USER_NOT_FOUND', {
        i18nKey: 'equipe.sellAthlete.userNotFound'
      });
    }

    const team = await Team.findOne({
      where: { user_id: userId },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!team) {
      throw new EquipeServiceError('TEAM_NOT_FOUND', {
        i18nKey: 'equipe.sellAthlete.teamNotFound'
      });
    }

    const teamAthlete = await TeamAthlete.findOne({
      where: {
        team_id: team.id,
        athlete_id: athleteId
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!teamAthlete) {
      throw new EquipeServiceError('ATHLETE_NOT_OWNED', {
        i18nKey: 'equipe.sellAthlete.athleteNotOwned'
      });
    }

    const athlete = await Athlete.findByPk(athleteId, { transaction });
    if (!athlete) {
      throw new EquipeServiceError('ATHLETE_NOT_AVAILABLE', {
        i18nKey: 'equipe.sellAthlete.athleteNotFound'
      });
    }

    await teamAthlete.destroy({ transaction });

    user.coins += ATHLETE_SELL_REFUND;
    await user.save({ transaction });

    const athleteCount = await TeamAthlete.count({
      where: { team_id: team.id },
      transaction
    });

    return {
      user: {
        id: user.id,
        coins: user.coins
      },
      team: {
        id: team.id,
        athletes_count: athleteCount
      },
      athlete: {
        id: athlete.id,
        name: athlete.name,
        refund: ATHLETE_SELL_REFUND,
        tier: athlete.tier,
        type: athlete.type
      }
    };
  });
};
