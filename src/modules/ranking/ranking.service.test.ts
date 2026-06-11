import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findAll: vi.fn(),
  findByPk: vi.fn(),
  count: vi.fn()
}));

vi.mock('../../database/models', () => ({
  User: {
    findAll: mocks.findAll,
    findByPk: mocks.findByPk,
    count: mocks.count
  }
}));

import { calculateRankingMetrics, getRanking, RankingServiceError } from './ranking.service';

const user = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  nickname: 'chuteira',
  trophies: 30,
  victory: 1,
  defeat: 0,
  is_guest: false,
  ...overrides
});

describe('calculateRankingMetrics', () => {
  it('calcula percentuais que totalizam 100', () => {
    expect(calculateRankingMetrics(75, 1, 2)).toEqual({
      trophies: 75,
      victory: 1,
      defeat: 2,
      completedCampaigns: 3,
      winRate: 33.3,
      lossRate: 66.7
    });
  });

  it('mantem os percentuais zerados sem campanhas concluidas', () => {
    expect(calculateRankingMetrics(0, 0, 0)).toEqual({
      trophies: 0,
      victory: 0,
      defeat: 0,
      completedCampaigns: 0,
      winRate: 0,
      lossRate: 0
    });
  });
});

describe('getRanking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findAll.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
  });

  it('ordena o top e inclui as metricas do usuario atual', async () => {
    mocks.findAll.mockResolvedValue([
      user({ id: 2, nickname: 'camisa10', trophies: 90, victory: 5, defeat: 1 }),
      user({ id: 3, nickname: 'canela', trophies: 60, victory: 3, defeat: 2 })
    ]);
    mocks.findByPk.mockResolvedValue(
      user({ id: 7, nickname: 'foraDoTop', trophies: 15, victory: 2, defeat: 3 })
    );
    mocks.count.mockResolvedValue(50);

    const result = await getRanking(7, 50);

    expect(result.ranking).toEqual([
      {
        position: 1,
        userId: 2,
        nickname: 'camisa10',
        trophies: 90,
        victory: 5,
        defeat: 1,
        completedCampaigns: 6,
        winRate: 83.3,
        lossRate: 16.7
      },
      {
        position: 2,
        userId: 3,
        nickname: 'canela',
        trophies: 60,
        victory: 3,
        defeat: 2,
        completedCampaigns: 5,
        winRate: 60,
        lossRate: 40
      }
    ]);
    expect(result.currentUser).toEqual({
      userId: 7,
      nickname: 'foraDoTop',
      isGuest: false,
      position: 51,
      appearsInRanking: false,
      trophies: 15,
      victory: 2,
      defeat: 3,
      completedCampaigns: 5,
      winRate: 40,
      lossRate: 60
    });
    expect(mocks.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [
          ['trophies', 'DESC'],
          ['victory', 'DESC'],
          ['defeat', 'ASC'],
          ['id', 'ASC']
        ],
        limit: 50
      })
    );
  });

  it('nao calcula posicao para convidado', async () => {
    mocks.findByPk.mockResolvedValue(
      user({
        id: 8,
        nickname: 'convidado',
        is_guest: true,
        trophies: 0,
        victory: 0,
        defeat: 0
      })
    );

    const result = await getRanking(8);

    expect(result.currentUser.position).toBeNull();
    expect(result.currentUser.isGuest).toBe(true);
    expect(mocks.count).not.toHaveBeenCalled();
  });

  it('nao classifica conta real sem campanha concluida', async () => {
    mocks.findByPk.mockResolvedValue(user({ id: 9, trophies: 0, victory: 0, defeat: 0 }));

    const result = await getRanking(9);

    expect(result.currentUser.position).toBeNull();
    expect(result.currentUser.appearsInRanking).toBe(false);
    expect(mocks.count).not.toHaveBeenCalled();
  });

  it('limita a consulta a no maximo 100 posicoes', async () => {
    mocks.findByPk.mockResolvedValue(user());

    await getRanking(1, 999);

    expect(mocks.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });

  it('recusa token de usuario removido do banco', async () => {
    mocks.findByPk.mockResolvedValue(null);

    await expect(getRanking(999)).rejects.toBeInstanceOf(RankingServiceError);
  });
});
