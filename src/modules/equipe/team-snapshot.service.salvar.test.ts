/**
 * Testes unitarios para salvarEstadoEquipe com mocks de Sequelize.
 *
 * As validacoes puras de validateAthletePositions sao cobertas em
 * `team-snapshot.service.test.ts`. Este arquivo foca na orquestracao
 * (transaction, lookups, persistencia) usando o mesmo padrao de mocks
 * `vi.hoisted` + `vi.mock` adotado em equipe.service.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAthlete } from '../../__tests__/factories/athlete';
import { buildTeam } from '../../__tests__/factories/team';

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findTeam: vi.fn(),
  findAllTeamAthletes: vi.fn(),
  createSnapshot: vi.fn(),
  computeVictoryRatio: vi.fn()
}));

vi.mock('../../config/database', () => ({
  sequelize: {
    transaction: mocks.transaction
  }
}));

vi.mock('../../database/models', () => ({
  Team: {
    findOne: mocks.findTeam
  },
  TeamAthlete: {
    findAll: mocks.findAllTeamAthletes
  },
  TeamSnapshot: {
    create: mocks.createSnapshot
  },
  Athlete: {}
}));

vi.mock('../matchmaking/matchmaking.service', () => ({
  computeVictoryRatio: mocks.computeVictoryRatio
}));

import { TeamSnapshotError, salvarEstadoEquipe } from './team-snapshot.service';

const setupTransaction = () => {
  mocks.transaction.mockImplementation(async (callback) => callback({}));
};

const teamWithAthletes = (athletes: ReturnType<typeof buildAthlete>[]) => {
  const team = buildTeam({ id: 10, user_id: 1, victory: 5, lose: 2, draw: 1 });
  return {
    ...team,
    get: vi.fn((key: string) => {
      if (key === 'athletes') return athletes;
      return undefined;
    })
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  setupTransaction();
  mocks.computeVictoryRatio.mockReturnValue(0.625);
});

describe('salvarEstadoEquipe — validacao previa', () => {
  it('lanca antes de abrir transacao quando positions sao invalidas', async () => {
    await expect(salvarEstadoEquipe({ userId: 1, positions: [] })).rejects.toThrow(
      TeamSnapshotError
    );

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.findTeam).not.toHaveBeenCalled();
  });

  it('rejeita uso de items (reservado para Sprint 5)', async () => {
    try {
      await salvarEstadoEquipe({
        userId: 1,
        positions: [{ athleteId: 1, posX: 0, posY: 0 }],
        items: [99]
      });
      throw new Error('Era esperado ITEM_NOT_IN_INVENTORY');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TeamSnapshotError);
      expect((error as TeamSnapshotError).code).toBe('ITEM_NOT_IN_INVENTORY');
    }
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('aceita items vazio sem lancar (apenas registra log)', async () => {
    const athlete = buildAthlete({ id: 100 });
    mocks.findTeam.mockResolvedValue(teamWithAthletes([athlete]));
    mocks.findAllTeamAthletes.mockResolvedValue([{ team_id: 10, athlete_id: 100 }]);
    mocks.createSnapshot.mockResolvedValue({
      id: 200,
      round: 1,
      victory: 5,
      lose: 2,
      draw: 1,
      positions: []
    });

    await expect(
      salvarEstadoEquipe({
        userId: 1,
        positions: [{ athleteId: 100, posX: 0, posY: 0 }],
        items: []
      })
    ).resolves.toBeDefined();
  });
});

describe('salvarEstadoEquipe — busca da equipe', () => {
  it('lanca TEAM_NOT_FOUND quando usuario nao tem time', async () => {
    mocks.findTeam.mockResolvedValue(null);

    try {
      await salvarEstadoEquipe({
        userId: 1,
        positions: [{ athleteId: 100, posX: 0, posY: 0 }]
      });
      throw new Error('Era esperado TEAM_NOT_FOUND');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TeamSnapshotError);
      expect((error as TeamSnapshotError).code).toBe('TEAM_NOT_FOUND');
      expect((error as TeamSnapshotError).i18nKey).toBe('equipe.snapshot.teamNotFound');
    }
  });

  it('busca o time do usuario com include de athletes', async () => {
    const athlete = buildAthlete({ id: 100 });
    mocks.findTeam.mockResolvedValue(teamWithAthletes([athlete]));
    mocks.findAllTeamAthletes.mockResolvedValue([{ team_id: 10, athlete_id: 100 }]);
    mocks.createSnapshot.mockResolvedValue({
      id: 200,
      round: 1,
      victory: 5,
      lose: 2,
      draw: 1,
      positions: []
    });

    await salvarEstadoEquipe({
      userId: 42,
      positions: [{ athleteId: 100, posX: 0, posY: 0 }]
    });

    expect(mocks.findTeam).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user_id: 42 },
        include: expect.any(Array)
      })
    );
  });
});

describe('salvarEstadoEquipe — propriedade dos atletas', () => {
  it('lanca ATHLETE_NOT_IN_TEAM quando atleta nao pertence ao time', async () => {
    const athlete = buildAthlete({ id: 100 });
    mocks.findTeam.mockResolvedValue(teamWithAthletes([athlete]));

    try {
      await salvarEstadoEquipe({
        userId: 1,
        positions: [{ athleteId: 999, posX: 0, posY: 0 }]
      });
      throw new Error('Era esperado ATHLETE_NOT_IN_TEAM');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TeamSnapshotError);
      expect((error as TeamSnapshotError).code).toBe('ATHLETE_NOT_IN_TEAM');
      expect((error as TeamSnapshotError).params).toMatchObject({
        ids: '999'
      });
    }
  });

  it('inclui todos os IDs faltantes nos params do erro', async () => {
    const athlete = buildAthlete({ id: 100 });
    mocks.findTeam.mockResolvedValue(teamWithAthletes([athlete]));

    try {
      await salvarEstadoEquipe({
        userId: 1,
        positions: [
          { athleteId: 100, posX: 0, posY: 0 },
          { athleteId: 999, posX: 1, posY: 0 },
          { athleteId: 888, posX: 2, posY: 0 }
        ]
      });
      throw new Error('deveria ter lancado');
    } catch (error: unknown) {
      const e = error as TeamSnapshotError;
      expect(e.params?.ids).toContain('999');
      expect(e.params?.ids).toContain('888');
    }
  });

  it('lanca ATHLETE_NOT_IN_TEAM (athleteNoLongerInTeam) quando refresh defensivo falha', async () => {
    const athlete = buildAthlete({ id: 100 });
    mocks.findTeam.mockResolvedValue(teamWithAthletes([athlete]));
    // Atleta vendido entre o load e o transaction: findAll devolve menos
    // registros do que o esperado
    mocks.findAllTeamAthletes.mockResolvedValue([]);

    try {
      await salvarEstadoEquipe({
        userId: 1,
        positions: [{ athleteId: 100, posX: 0, posY: 0 }]
      });
      throw new Error('deveria ter lancado');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TeamSnapshotError);
      expect((error as TeamSnapshotError).code).toBe('ATHLETE_NOT_IN_TEAM');
      expect((error as TeamSnapshotError).i18nKey).toBe('equipe.snapshot.athleteNoLongerInTeam');
    }
  });
});

describe('salvarEstadoEquipe — happy path e grid', () => {
  it('cria snapshot com positions do grid 3x3 preenchidas', async () => {
    const athleteA = buildAthlete({
      id: 100,
      name: 'Ronaldinho',
      velocity: 90,
      attack: 85,
      defense: 50,
      type: 'attacker'
    });
    const athleteB = buildAthlete({
      id: 101,
      name: 'Cafu',
      velocity: 80,
      attack: 60,
      defense: 85,
      type: 'defender'
    });

    mocks.findTeam.mockResolvedValue(teamWithAthletes([athleteA, athleteB]));
    mocks.findAllTeamAthletes.mockResolvedValue([
      { team_id: 10, athlete_id: 100 },
      { team_id: 10, athlete_id: 101 }
    ]);
    mocks.createSnapshot.mockImplementation(async (data) => ({
      id: 200,
      ...data,
      victory_ratio: 0.625
    }));

    const result = await salvarEstadoEquipe({
      userId: 1,
      positions: [
        { athleteId: 100, posX: 2, posY: 0 },
        { athleteId: 101, posX: 0, posY: 2 }
      ]
    });

    expect(result.snapshotId).toBe(200);
    expect(result.teamId).toBe(10);
    expect(result.victoryRatio).toBe(0.625);
    expect(result.round).toBe(1);
    expect(result.victory).toBe(5);
    expect(result.lose).toBe(2);

    // Grid 3x3 preenchido nas posicoes corretas (grid[y][x])
    const createCall = mocks.createSnapshot.mock.calls[0][0];
    expect(createCall.positions[0][2]).toMatchObject({
      id: 100,
      name: 'Ronaldinho',
      attack: 85
    });
    expect(createCall.positions[2][0]).toMatchObject({
      id: 101,
      name: 'Cafu',
      defense: 85
    });
    // Outras celulas vazias
    expect(createCall.positions[1][1]).toBeNull();
    expect(createCall.positions[0][0]).toBeNull();
  });

  it('chama computeVictoryRatio com victory/lose/draw do time', async () => {
    const athlete = buildAthlete({ id: 100 });
    mocks.findTeam.mockResolvedValue(teamWithAthletes([athlete]));
    mocks.findAllTeamAthletes.mockResolvedValue([{ team_id: 10, athlete_id: 100 }]);
    mocks.createSnapshot.mockResolvedValue({
      id: 200,
      round: 1,
      victory: 5,
      lose: 2,
      draw: 1,
      positions: []
    });

    await salvarEstadoEquipe({
      userId: 1,
      positions: [{ athleteId: 100, posX: 0, posY: 0 }]
    });

    expect(mocks.computeVictoryRatio).toHaveBeenCalledWith(5, 2, 1);
  });

  it('usa fallback 0 para victory/lose/draw quando time nao tem stats', async () => {
    const athlete = buildAthlete({ id: 100 });
    const teamNoStats = {
      ...buildTeam({ id: 10, user_id: 1 }),
      victory: undefined,
      lose: undefined,
      draw: undefined,
      round: undefined,
      get: vi.fn((key: string) => (key === 'athletes' ? [athlete] : undefined))
    };
    mocks.findTeam.mockResolvedValue(teamNoStats);
    mocks.findAllTeamAthletes.mockResolvedValue([{ team_id: 10, athlete_id: 100 }]);
    mocks.createSnapshot.mockResolvedValue({
      id: 200,
      round: 1,
      victory: 0,
      lose: 0,
      draw: 0,
      positions: []
    });

    await salvarEstadoEquipe({
      userId: 1,
      positions: [{ athleteId: 100, posX: 0, posY: 0 }]
    });

    expect(mocks.computeVictoryRatio).toHaveBeenCalledWith(0, 0, 0);
    const createCall = mocks.createSnapshot.mock.calls[0][0];
    expect(createCall.round).toBe(1); // fallback
    expect(createCall.victory).toBe(0);
    expect(createCall.lose).toBe(0);
    expect(createCall.draw).toBe(0);
  });

  it('passa transaction para findTeam, findAllTeamAthletes e createSnapshot', async () => {
    const athlete = buildAthlete({ id: 100 });
    mocks.findTeam.mockResolvedValue(teamWithAthletes([athlete]));
    mocks.findAllTeamAthletes.mockResolvedValue([{ team_id: 10, athlete_id: 100 }]);
    mocks.createSnapshot.mockResolvedValue({
      id: 200,
      round: 1,
      victory: 5,
      lose: 2,
      draw: 1,
      positions: []
    });

    const fakeTx = { id: 'tx-1' };
    mocks.transaction.mockImplementation(async (callback) => callback(fakeTx));

    await salvarEstadoEquipe({
      userId: 1,
      positions: [{ athleteId: 100, posX: 0, posY: 0 }]
    });

    expect(mocks.findTeam).toHaveBeenCalledWith(expect.objectContaining({ transaction: fakeTx }));
    expect(mocks.findAllTeamAthletes).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: fakeTx })
    );
    expect(mocks.createSnapshot).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ transaction: fakeTx })
    );
  });

  it('lida com time sem athletes (array vazio do include)', async () => {
    const teamEmpty = {
      ...buildTeam({ id: 10, user_id: 1 }),
      get: vi.fn((key: string) => (key === 'athletes' ? [] : undefined))
    };
    mocks.findTeam.mockResolvedValue(teamEmpty);

    await expect(
      salvarEstadoEquipe({
        userId: 1,
        positions: [{ athleteId: 100, posX: 0, posY: 0 }]
      })
    ).rejects.toThrow(TeamSnapshotError);

    expect(mocks.findAllTeamAthletes).not.toHaveBeenCalled();
  });

  it('filtra athletes null/undefined do array do include', async () => {
    const athlete = buildAthlete({ id: 100 });
    const teamWithNulls = {
      ...buildTeam({ id: 10, user_id: 1 }),
      get: vi.fn((key: string) =>
        key === 'athletes' ? [athlete, null, undefined, athlete] : undefined
      )
    };
    mocks.findTeam.mockResolvedValue(teamWithNulls);
    mocks.findAllTeamAthletes.mockResolvedValue([{ team_id: 10, athlete_id: 100 }]);
    mocks.createSnapshot.mockResolvedValue({
      id: 200,
      round: 1,
      victory: 5,
      lose: 2,
      draw: 1,
      positions: []
    });

    // Nao deve lancar — null/undefined sao filtrados
    await expect(
      salvarEstadoEquipe({
        userId: 1,
        positions: [{ athleteId: 100, posX: 0, posY: 0 }]
      })
    ).resolves.toBeDefined();
  });
});
