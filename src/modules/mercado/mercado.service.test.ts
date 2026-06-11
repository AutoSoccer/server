import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAthlete } from '../../__tests__/factories/athlete';
import { buildUser } from '../../__tests__/factories/user';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  random: vi.fn().mockReturnValue('RAND'),
  findUser: vi.fn(),
  findMarketWindowAll: vi.fn(),
  bulkCreateMarketWindow: vi.fn(),
  destroyMarketWindow: vi.fn(),
  findTeamAthletes: vi.fn(),
  findAthletes: vi.fn()
}));

vi.mock('../../config/database', () => ({
  sequelize: {
    transaction: mocks.transaction,
    random: mocks.random
  }
}));

vi.mock('../../database/models', () => ({
  Athlete: {
    findAll: mocks.findAthletes
  },
  MarketWindow: {
    findAll: mocks.findMarketWindowAll,
    bulkCreate: mocks.bulkCreateMarketWindow,
    destroy: mocks.destroyMarketWindow
  },
  TeamAthlete: {
    findAll: mocks.findTeamAthletes
  },
  User: {
    findByPk: mocks.findUser
  }
}));

import { getMarket, MercadoServiceError, REFRESH_COST, refreshMarket } from './mercado.service';

const setupTransaction = () => {
  mocks.transaction.mockImplementation(async (callback) =>
    callback({ LOCK: { UPDATE: 'UPDATE' } })
  );
};

const buildMarketEntry = (
  athleteId: number,
  slot: number,
  athlete = buildAthlete({ id: athleteId })
) => ({
  athlete_id: athleteId,
  slot,
  refreshed_at: new Date('2026-06-09T12:00:00.000Z'),
  get: vi.fn().mockReturnValue(athlete)
});

describe('getMarket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTransaction();
    mocks.findTeamAthletes.mockResolvedValue([]);
  });

  it('gera janela inicial quando o usuario nao tem mercado salvo', async () => {
    mocks.findMarketWindowAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        buildMarketEntry(1, 0),
        buildMarketEntry(2, 1),
        buildMarketEntry(3, 2)
      ]);
    mocks.findUser.mockResolvedValue(buildUser({ id: 1, coins: 5 }));
    mocks.findAthletes.mockResolvedValue([
      buildAthlete({ id: 1 }),
      buildAthlete({ id: 2 }),
      buildAthlete({ id: 3 })
    ]);

    const result = await getMarket(1);

    expect(mocks.bulkCreateMarketWindow).toHaveBeenCalled();
    expect(result.refresh_cost).toBe(REFRESH_COST);
    expect(result.coins).toBe(5);
    expect(result.athletes).toHaveLength(3);
  });

  it('rejeita usuario inexistente', async () => {
    mocks.findMarketWindowAll.mockResolvedValueOnce([]);
    mocks.findUser.mockResolvedValue(null);

    await expect(getMarket(404)).rejects.toBeInstanceOf(MercadoServiceError);
  });

  it('reaproveita janela existente e trunca slots excedentes', async () => {
    const entries = [
      buildMarketEntry(1, 0),
      buildMarketEntry(2, 1),
      buildMarketEntry(3, 2),
      buildMarketEntry(4, 3)
    ];
    mocks.findMarketWindowAll.mockResolvedValueOnce(entries);
    mocks.findUser.mockResolvedValue(buildUser({ id: 1, coins: 7 }));

    const result = await getMarket(1);

    expect(mocks.destroyMarketWindow).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ user_id: 1 }) })
    );
    expect(mocks.bulkCreateMarketWindow).not.toHaveBeenCalled();
    expect(result.athletes).toHaveLength(3);
    expect(result.coins).toBe(7);
  });
});

describe('refreshMarket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTransaction();
    mocks.findTeamAthletes.mockResolvedValue([]);
  });

  it('debita REFRESH_COST e gera nova janela com saldo suficiente', async () => {
    const user = buildUser({ id: 1, coins: 5 });
    mocks.findUser.mockResolvedValue(user);
    mocks.destroyMarketWindow.mockResolvedValue(undefined);
    mocks.findAthletes.mockResolvedValue([
      buildAthlete({ id: 10 }),
      buildAthlete({ id: 11 }),
      buildAthlete({ id: 12 })
    ]);
    mocks.findMarketWindowAll.mockResolvedValueOnce([
      buildMarketEntry(10, 0),
      buildMarketEntry(11, 1),
      buildMarketEntry(12, 2)
    ]);

    const result = await refreshMarket(1);

    expect(user.coins).toBe(5 - REFRESH_COST);
    expect(user.save).toHaveBeenCalled();
    expect(mocks.destroyMarketWindow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 1 } })
    );
    expect(mocks.bulkCreateMarketWindow).toHaveBeenCalled();
    expect(result.coins).toBe(5 - REFRESH_COST);
    expect(result.athletes).toHaveLength(3);
  });

  it('rejeita saldo insuficiente sem debitar coins', async () => {
    const user = buildUser({ id: 1, coins: 0 });
    mocks.findUser.mockResolvedValue(user);

    await expect(refreshMarket(1)).rejects.toMatchObject({
      code: 'INSUFFICIENT_COINS'
    });
    expect(user.save).not.toHaveBeenCalled();
    expect(mocks.destroyMarketWindow).not.toHaveBeenCalled();
  });

  it('rejeita usuario inexistente', async () => {
    mocks.findUser.mockResolvedValue(null);

    await expect(refreshMarket(999)).rejects.toMatchObject({
      code: 'USER_NOT_FOUND'
    });
  });
});
