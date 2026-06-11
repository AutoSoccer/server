import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findUser: vi.fn(),
  findTeam: vi.fn(),
  createTeam: vi.fn(),
  destroyTeamAthletes: vi.fn(),
  destroyMarketWindow: vi.fn()
}));

vi.mock('../../config/database', () => ({
  sequelize: {
    transaction: mocks.transaction
  }
}));

vi.mock('../../database/models', () => ({
  MarketWindow: {
    destroy: mocks.destroyMarketWindow
  },
  Team: {
    findOne: mocks.findTeam,
    create: mocks.createTeam
  },
  TeamAthlete: {
    destroy: mocks.destroyTeamAthletes
  },
  User: {
    findByPk: mocks.findUser
  }
}));

import { abandonCampaign, CampaignServiceError, startCampaign } from './campaign.service';

describe('abandonCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ LOCK: { UPDATE: 'UPDATE' } })
    );
  });

  it('restaura moedas, progresso e remove os atletas sem alterar trofeus', async () => {
    const user = {
      id: 7,
      coins: 2,
      trophies: 45,
      save: vi.fn()
    };
    const team = {
      id: 12,
      round: 6,
      victory: 4,
      lose: 1,
      draw: 1,
      save: vi.fn()
    };

    mocks.findUser.mockResolvedValue(user);
    mocks.findTeam.mockResolvedValue(team);
    mocks.destroyTeamAthletes.mockResolvedValue(4);

    await expect(abandonCampaign(user.id)).resolves.toEqual({
      user: {
        id: 7,
        coins: 10,
        trophies: 45
      },
      team: {
        id: 12,
        round: 1,
        victory: 0,
        lose: 0,
        draw: 0,
        athletesCount: 0
      }
    });

    expect(mocks.destroyTeamAthletes).toHaveBeenCalledWith({
      where: { team_id: 12 },
      transaction: expect.any(Object)
    });
    expect(user.save).toHaveBeenCalledOnce();
    expect(team.save).toHaveBeenCalledOnce();
  });

  it('tambem permite desistir antes de uma equipe ser criada', async () => {
    const user = {
      id: 8,
      coins: 7,
      trophies: 3,
      save: vi.fn()
    };

    mocks.findUser.mockResolvedValue(user);
    mocks.findTeam.mockResolvedValue(null);

    const result = await abandonCampaign(user.id);

    expect(result.team).toBeNull();
    expect(result.user.coins).toBe(10);
    expect(mocks.destroyTeamAthletes).not.toHaveBeenCalled();
  });

  it('recusa usuario inexistente', async () => {
    mocks.findUser.mockResolvedValue(null);

    await expect(abandonCampaign(999)).rejects.toBeInstanceOf(CampaignServiceError);
  });
});

describe('startCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ LOCK: { UPDATE: 'UPDATE' } })
    );
  });

  it('limpa e renomeia a equipe existente', async () => {
    const user = {
      id: 7,
      coins: 1,
      trophies: 45,
      save: vi.fn()
    };
    const team = {
      id: 12,
      name: 'Nome antigo',
      round: 8,
      victory: 5,
      lose: 2,
      draw: 1,
      save: vi.fn()
    };

    mocks.findUser.mockResolvedValue(user);
    mocks.findTeam.mockResolvedValue(team);

    const result = await startCampaign(user.id, '  Chuteira Furada FC  ');

    expect(result.team).toEqual({
      id: 12,
      name: 'Chuteira Furada FC',
      round: 1,
      victory: 0,
      lose: 0,
      draw: 0,
      athletesCount: 0
    });
    expect(result.user.coins).toBe(10);
    expect(mocks.destroyTeamAthletes).toHaveBeenCalledOnce();
    expect(mocks.destroyMarketWindow).toHaveBeenCalledWith({
      where: { user_id: 7 },
      transaction: expect.any(Object)
    });
    expect(team.save).toHaveBeenCalledOnce();
  });

  it('cria a primeira equipe do usuario com o nome escolhido', async () => {
    const user = {
      id: 8,
      coins: 10,
      trophies: 0,
      save: vi.fn()
    };
    const team = {
      id: 20,
      user_id: 8,
      name: 'Canela de Vidro',
      round: 1,
      victory: 0,
      lose: 0,
      draw: 0
    };

    mocks.findUser.mockResolvedValue(user);
    mocks.findTeam.mockResolvedValue(null);
    mocks.createTeam.mockResolvedValue(team);

    const result = await startCampaign(user.id, team.name);

    expect(mocks.createTeam).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 8,
        name: 'Canela de Vidro',
        round: 1
      }),
      { transaction: expect.any(Object) }
    );
    expect(result.team.name).toBe('Canela de Vidro');
  });

  it('recusa nome vazio ou acima de 40 caracteres', async () => {
    await expect(startCampaign(1, '   ')).rejects.toMatchObject({
      code: 'INVALID_TEAM_NAME'
    });
    await expect(startCampaign(1, 'a'.repeat(41))).rejects.toMatchObject({
      code: 'INVALID_TEAM_NAME'
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
