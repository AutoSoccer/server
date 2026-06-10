import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAthlete } from '../../__tests__/factories/athlete';
import { buildTeam } from '../../__tests__/factories/team';
import { buildUser } from '../../__tests__/factories/user';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findUser: vi.fn(),
  findTeam: vi.fn(),
  createTeam: vi.fn(),
  findAthlete: vi.fn(),
  findMarketEntry: vi.fn(),
  countTeamAthletes: vi.fn(),
  createTeamAthlete: vi.fn(),
  findTeamAthlete: vi.fn()
}));

vi.mock('../../config/database', () => ({
  sequelize: {
    transaction: mocks.transaction
  }
}));

vi.mock('../../database/models', () => ({
  Athlete: {
    findByPk: mocks.findAthlete
  },
  MarketWindow: {
    findOne: mocks.findMarketEntry
  },
  Team: {
    findOne: mocks.findTeam,
    create: mocks.createTeam
  },
  TeamAthlete: {
    count: mocks.countTeamAthletes,
    create: mocks.createTeamAthlete,
    findOne: mocks.findTeamAthlete
  },
  User: {
    findByPk: mocks.findUser
  }
}));

import {
  ATHLETE_SELL_REFUND,
  buyAthlete,
  EquipeServiceError,
  getMyTeam,
  sellAthlete,
  TEAM_MAX_ATHLETES
} from './equipe.service';

const setupTransaction = () => {
  mocks.transaction.mockImplementation(async (callback) =>
    callback({ LOCK: { UPDATE: 'UPDATE' } })
  );
};

describe('getMyTeam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna null quando nao existe time para o usuario', async () => {
    mocks.findTeam.mockResolvedValue(null);

    await expect(getMyTeam(1)).resolves.toBeNull();
  });

  it('retorna o time com os atletas mapeados e overall', async () => {
    const athletes = [
      buildAthlete({ id: 100, velocity: 60, attack: 60, defense: 60 }),
      buildAthlete({ id: 101, name: 'Atleta 2' })
    ];
    const team = {
      id: 10,
      name: 'Time Lucas',
      round: 2,
      victory: 1,
      lose: 0,
      get: vi.fn().mockReturnValue(athletes)
    };
    mocks.findTeam.mockResolvedValue(team);

    const result = await getMyTeam(1);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(10);
    expect(result!.athletes).toHaveLength(2);
    expect(result!.athletes[0].overall).toBe(60);
    expect(result!.max_athletes).toBe(TEAM_MAX_ATHLETES);
    expect(result!.athletes_count).toBe(2);
  });

  it('retorna time sem atletas quando o array vem vazio', async () => {
    const team = {
      id: 11,
      name: 'Time Vazio',
      round: 1,
      victory: 0,
      lose: 0,
      get: vi.fn().mockReturnValue(undefined)
    };
    mocks.findTeam.mockResolvedValue(team);

    const result = await getMyTeam(1);

    expect(result!.athletes).toHaveLength(0);
    expect(result!.athletes_count).toBe(0);
  });
});

describe('buyAthlete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTransaction();
  });

  it('rejeita usuario inexistente', async () => {
    mocks.findUser.mockResolvedValue(null);

    await expect(buyAthlete(1, 100)).rejects.toMatchObject({
      code: 'USER_NOT_FOUND'
    });
    expect(buyAthlete).toBeDefined();
  });

  it('rejeita quando o atleta nao esta disponivel no mercado', async () => {
    mocks.findUser.mockResolvedValue(buildUser({ id: 1, coins: 100 }));
    mocks.findMarketEntry.mockResolvedValue(null);

    await expect(buyAthlete(1, 100)).rejects.toMatchObject({
      code: 'ATHLETE_NOT_AVAILABLE'
    });
  });

  it('rejeita quando o time ja esta cheio', async () => {
    const user = buildUser({ id: 1, coins: 100 });
    mocks.findUser.mockResolvedValue(user);
    mocks.findMarketEntry.mockResolvedValue({
      destroy: vi.fn().mockResolvedValue(undefined)
    });
    mocks.findAthlete.mockResolvedValue(buildAthlete({ cost: 2 }));
    mocks.findTeam.mockResolvedValue(buildTeam({ id: 10 }));
    mocks.countTeamAthletes.mockResolvedValue(TEAM_MAX_ATHLETES);

    await expect(buyAthlete(1, 100)).rejects.toMatchObject({
      code: 'TEAM_FULL'
    });
  });

  it('rejeita saldo insuficiente', async () => {
    const user = buildUser({ id: 1, coins: 1 });
    mocks.findUser.mockResolvedValue(user);
    mocks.findMarketEntry.mockResolvedValue({
      destroy: vi.fn().mockResolvedValue(undefined)
    });
    mocks.findAthlete.mockResolvedValue(buildAthlete({ cost: 5 }));
    mocks.findTeam.mockResolvedValue(buildTeam({ id: 10 }));
    mocks.countTeamAthletes.mockResolvedValue(0);

    await expect(buyAthlete(1, 100)).rejects.toMatchObject({
      code: 'INSUFFICIENT_COINS'
    });
    expect(user.save).not.toHaveBeenCalled();
  });

  it('compra atleta com sucesso, debita coins e remove do mercado', async () => {
    const user = buildUser({ id: 1, coins: 10 });
    const destroyMarket = vi.fn().mockResolvedValue(undefined);
    mocks.findUser.mockResolvedValue(user);
    mocks.findMarketEntry.mockResolvedValue({ destroy: destroyMarket });
    mocks.findAthlete.mockResolvedValue(
      buildAthlete({ id: 100, cost: 3, name: 'Atleta Bronze' })
    );
    mocks.findTeam.mockResolvedValue(buildTeam({ id: 10 }));
    mocks.countTeamAthletes.mockResolvedValue(2);
    mocks.createTeamAthlete.mockResolvedValue({ id: 200 });

    const result = await buyAthlete(1, 100);

    expect(user.coins).toBe(7);
    expect(user.save).toHaveBeenCalled();
    expect(destroyMarket).toHaveBeenCalled();
    expect(mocks.createTeamAthlete).toHaveBeenCalledWith(
      expect.objectContaining({ team_id: 10, athlete_id: 100 }),
      expect.any(Object)
    );
    expect(result.user.coins).toBe(7);
    expect(result.team.athletes_count).toBe(3);
    expect(result.athlete.id).toBe(100);
  });

  it('cria time automaticamente quando o usuario ainda nao tem', async () => {
    const user = buildUser({ id: 5, coins: 10 });
    mocks.findUser.mockResolvedValue(user);
    mocks.findMarketEntry.mockResolvedValue({
      destroy: vi.fn().mockResolvedValue(undefined)
    });
    mocks.findAthlete.mockResolvedValue(buildAthlete({ id: 100, cost: 3 }));
    mocks.findTeam.mockResolvedValue(null);
    mocks.createTeam.mockResolvedValue(buildTeam({ id: 50, user_id: 5 }));
    mocks.countTeamAthletes.mockResolvedValue(0);

    const result = await buyAthlete(5, 100);

    expect(mocks.createTeam).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 5, name: 'Equipe 5' }),
      expect.any(Object)
    );
    expect(result.team.id).toBe(50);
  });
});

describe('sellAthlete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTransaction();
  });

  it('rejeita usuario inexistente', async () => {
    mocks.findUser.mockResolvedValue(null);

    await expect(sellAthlete(1, 100)).rejects.toBeInstanceOf(EquipeServiceError);
  });

  it('rejeita quando o usuario nao tem time', async () => {
    mocks.findUser.mockResolvedValue(buildUser({ id: 1 }));
    mocks.findTeam.mockResolvedValue(null);

    await expect(sellAthlete(1, 100)).rejects.toMatchObject({
      code: 'TEAM_NOT_FOUND'
    });
  });

  it('rejeita quando o atleta nao pertence ao time', async () => {
    mocks.findUser.mockResolvedValue(buildUser({ id: 1 }));
    mocks.findTeam.mockResolvedValue(buildTeam({ id: 10 }));
    mocks.findTeamAthlete.mockResolvedValue(null);

    await expect(sellAthlete(1, 100)).rejects.toMatchObject({
      code: 'ATHLETE_NOT_OWNED'
    });
  });

  it('vende atleta com sucesso e credita refund', async () => {
    const user = buildUser({ id: 1, coins: 5 });
    const destroyTeamAthlete = vi.fn().mockResolvedValue(undefined);
    mocks.findUser.mockResolvedValue(user);
    mocks.findTeam.mockResolvedValue(buildTeam({ id: 10 }));
    mocks.findTeamAthlete.mockResolvedValue({ destroy: destroyTeamAthlete });
    mocks.findAthlete.mockResolvedValue(
      buildAthlete({ id: 100, name: 'Atleta Ouro', tier: 'gold' })
    );
    mocks.countTeamAthletes.mockResolvedValue(1);

    const result = await sellAthlete(1, 100);

    expect(destroyTeamAthlete).toHaveBeenCalled();
    expect(user.coins).toBe(5 + ATHLETE_SELL_REFUND);
    expect(user.save).toHaveBeenCalled();
    expect(result.athlete.refund).toBe(ATHLETE_SELL_REFUND);
    expect(result.team.athletes_count).toBe(1);
    expect(result.athlete.name).toBe('Atleta Ouro');
  });
});
