import { Op, type Transaction, type WhereOptions } from 'sequelize';

import { sequelize } from '../../config/database';
import { Athlete, MarketWindow, TeamAthlete, User } from '../../database/models';

export const MARKET_SIZE = 3;
export const REFRESH_COST = 1;

export type MercadoServiceErrorCode = 'INSUFFICIENT_COINS' | 'USER_NOT_FOUND';

export type MercadoServiceErrorOptions = {
  i18nKey?: string;
  params?: Record<string, unknown>;
};

export class MercadoServiceError extends Error {
  public readonly code: MercadoServiceErrorCode;
  public readonly i18nKey: string;
  public readonly params?: Record<string, unknown>;

  constructor(code: MercadoServiceErrorCode, options: MercadoServiceErrorOptions = {}) {
    const i18nKey = options.i18nKey ?? `mercado.errors.${code}`;
    super(i18nKey);
    this.name = 'MercadoServiceError';
    this.code = code;
    this.i18nKey = i18nKey;
    this.params = options.params;
  }
}

export type MarketAthleteStatus = 'MARKET' | 'OWNED';

export type MarketAthlete = {
  id: number;
  name: string;
  velocity: number;
  attack: number;
  defense: number;
  ability_id: number;
  tier: string;
  type: string;
  overall: number;
  cost: number;
  status: MarketAthleteStatus;
};

export type MarketResponse = {
  refresh_cost: number;
  refreshed_at: string | null;
  coins: number;
  athletes: MarketAthlete[];
};

const calculateOverall = (athlete: Athlete): number => {
  return Math.round((athlete.velocity + athlete.attack + athlete.defense) / 3);
};

const sanitizeAthlete = (athlete: Athlete, ownedAthleteIds: Set<number>): MarketAthlete => ({
  id: athlete.id,
  name: athlete.name,
  velocity: athlete.velocity,
  attack: athlete.attack,
  defense: athlete.defense,
  ability_id: athlete.ability_id,
  tier: athlete.tier,
  type: athlete.type,
  overall: calculateOverall(athlete),
  cost: athlete.cost,
  status: ownedAthleteIds.has(athlete.id) ? 'OWNED' : 'MARKET'
});

const loadOwnedAthleteIds = async (transaction?: Transaction): Promise<Set<number>> => {
  const ownedAthletes = await TeamAthlete.findAll({
    attributes: ['athlete_id'],
    transaction
  });

  return new Set(ownedAthletes.map((entry) => entry.athlete_id));
};

const mapWindowResponse = async (
  entries: MarketWindow[],
  coins: number,
  options?: { refreshedAt?: Date; transaction?: Transaction }
): Promise<MarketResponse> => {
  const ownedAthleteIds = await loadOwnedAthleteIds(options?.transaction);

  return {
    refresh_cost: REFRESH_COST,
    refreshed_at:
      options?.refreshedAt?.toISOString() ?? entries[0]?.refreshed_at?.toISOString() ?? null,
    coins,
    athletes: entries
      .sort((left, right) => left.slot - right.slot)
      .slice(0, MARKET_SIZE)
      .map((entry) => sanitizeAthlete(entry.get('athlete') as Athlete, ownedAthleteIds))
  };
};

const loadCurrentWindow = async (
  userId: number,
  transaction?: Transaction
): Promise<MarketWindow[]> => {
  return MarketWindow.findAll({
    where: {
      user_id: userId
    },
    include: [
      {
        association: 'athlete',
        required: true
      }
    ],
    order: [['slot', 'ASC']],
    transaction
  });
};

const drawAvailableAthletes = async (
  limit: number,
  transaction: Transaction
): Promise<Athlete[]> => {
  const ownedAthleteIds = await loadOwnedAthleteIds(transaction);
  const where: WhereOptions<Athlete> =
    ownedAthleteIds.size > 0
      ? {
          id: {
            [Op.notIn]: [...ownedAthleteIds]
          }
        }
      : {};

  return Athlete.findAll({
    where,
    order: sequelize.random(),
    limit,
    transaction
  });
};

export const refreshMarket = async (userId: number): Promise<MarketResponse> => {
  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!user) {
      throw new MercadoServiceError('USER_NOT_FOUND', {
        i18nKey: 'mercado.refresh.userNotFound'
      });
    }

    if (user.coins < REFRESH_COST) {
      throw new MercadoServiceError('INSUFFICIENT_COINS', {
        i18nKey: 'mercado.refresh.insufficientBalance'
      });
    }

    user.coins -= REFRESH_COST;
    await user.save({ transaction });

    await MarketWindow.destroy({
      where: {
        user_id: userId
      },
      transaction
    });

    const athletes = await drawAvailableAthletes(MARKET_SIZE, transaction);
    const refreshedAt = new Date();

    if (athletes.length > 0) {
      await MarketWindow.bulkCreate(
        athletes.map((athlete, index) => ({
          user_id: userId,
          athlete_id: athlete.id,
          slot: index,
          refreshed_at: refreshedAt
        })),
        { transaction }
      );
    }

    const entries = await loadCurrentWindow(userId, transaction);
    return mapWindowResponse(entries, user.coins, { refreshedAt, transaction });
  });
};

export const getMarket = async (userId: number): Promise<MarketResponse> => {
  const existingEntries = await loadCurrentWindow(userId);
  const user = await User.findByPk(userId);

  if (!user) {
    throw new MercadoServiceError('USER_NOT_FOUND', {
      i18nKey: 'mercado.get.userNotFound'
    });
  }

  if (existingEntries.length > 0) {
    if (existingEntries.length > MARKET_SIZE) {
      await MarketWindow.destroy({
        where: {
          user_id: userId,
          slot: { [Op.gte]: MARKET_SIZE }
        }
      });
    }

    return mapWindowResponse(existingEntries, user.coins);
  }

  return sequelize.transaction(async (transaction) => {
    const athletes = await drawAvailableAthletes(MARKET_SIZE, transaction);
    const refreshedAt = new Date();

    if (athletes.length > 0) {
      await MarketWindow.bulkCreate(
        athletes.map((athlete, index) => ({
          user_id: userId,
          athlete_id: athlete.id,
          slot: index,
          refreshed_at: refreshedAt
        })),
        { transaction }
      );
    }

    const entries = await loadCurrentWindow(userId, transaction);
    return mapWindowResponse(entries, user.coins, {
      refreshedAt,
      transaction
    });
  });
};
