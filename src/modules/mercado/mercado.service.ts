import { Op, type Transaction, type WhereOptions } from 'sequelize';

import { sequelize } from '../../config/database';
import { Athlete, MarketWindow, TeamAthlete } from '../../database/models';

const DEFAULT_MARKET_SIZE = 5;
const REFRESH_COST = 0;

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
  options?: { cost?: number; refreshedAt?: Date; transaction?: Transaction }
): Promise<MarketResponse> => {
  const ownedAthleteIds = await loadOwnedAthleteIds(options?.transaction);

  return {
    refresh_cost: options?.cost ?? REFRESH_COST,
    refreshed_at:
      options?.refreshedAt?.toISOString() ?? entries[0]?.refreshed_at?.toISOString() ?? null,
    athletes: entries
      .sort((left, right) => left.slot - right.slot)
      .map((entry) => sanitizeAthlete(entry.get('athlete') as Athlete, ownedAthleteIds))
  };
};

const loadCurrentWindow = async (userId: number, transaction?: Transaction): Promise<MarketWindow[]> => {
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

export const refreshMarket = async (
  userId: number,
  options?: { cost?: number; size?: number }
): Promise<MarketResponse> => {
  const size = options?.size ?? DEFAULT_MARKET_SIZE;
  const cost = options?.cost ?? REFRESH_COST;

  return sequelize.transaction(async (transaction) => {
    await MarketWindow.destroy({
      where: {
        user_id: userId
      },
      transaction
    });

    const athletes = await drawAvailableAthletes(size, transaction);
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
    return mapWindowResponse(entries, { cost, refreshedAt, transaction });
  });
};

export const getMarket = async (userId: number): Promise<MarketResponse> => {
  const existingEntries = await loadCurrentWindow(userId);

  if (existingEntries.length > 0) {
    return mapWindowResponse(existingEntries);
  }

  return refreshMarket(userId);
};
