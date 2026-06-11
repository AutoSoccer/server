import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  // sequelize
  transaction: vi.fn(),
  // models
  teamFindOne: vi.fn(),
  teamFindByPk: vi.fn(),
  athleteFindOne: vi.fn(),
  teamAthleteDestroy: vi.fn(),
  teamSnapshotFindByPk: vi.fn(),
  teamSnapshotCreate: vi.fn(),
  userFindByPk: vi.fn(),
  roundLogFindAll: vi.fn(),
  roundLogCreate: vi.fn(),
  // matchmaking
  findOpponentSnapshot: vi.fn(),
  // simulador
  processarRodada: vi.fn(),
  computeInitiative: vi.fn(),
  // snapshot service
  salvarEstadoEquipe: vi.fn()
}));

vi.mock('../../config/database', () => ({
  sequelize: {
    transaction: mocks.transaction
  }
}));

vi.mock('../../database/models', () => ({
  Athlete: {
    findOne: mocks.athleteFindOne
  },
  RoundLog: {
    findAll: mocks.roundLogFindAll,
    create: mocks.roundLogCreate
  },
  Team: {
    findOne: mocks.teamFindOne,
    findByPk: mocks.teamFindByPk
  },
  TeamAthlete: {
    destroy: mocks.teamAthleteDestroy
  },
  TeamSnapshot: {
    findByPk: mocks.teamSnapshotFindByPk,
    create: mocks.teamSnapshotCreate
  },
  User: {
    findByPk: mocks.userFindByPk
  }
}));

vi.mock('../matchmaking/matchmaking.service', async () => {
  const actual = await vi.importActual<typeof import('../matchmaking/matchmaking.service')>(
    '../matchmaking/matchmaking.service'
  );
  return {
    ...actual,
    findOpponentSnapshot: mocks.findOpponentSnapshot
  };
});

vi.mock('../simulador', async () => {
  const actual = await vi.importActual<typeof import('../simulador')>('../simulador');
  return {
    ...actual,
    processarRodada: mocks.processarRodada,
    computeInitiative: mocks.computeInitiative
  };
});

vi.mock('../equipe/team-snapshot.service', () => ({
  salvarEstadoEquipe: mocks.salvarEstadoEquipe
}));

import { jogarRodada, jogarRodadaComFormacao, RodadaServiceError } from './rodada.service';

const buildSnapshot = (overrides: Record<string, unknown> = {}) => ({
  id: 11,
  team_id: 10,
  user_id: 1,
  round: 1,
  victory: 0,
  lose: 0,
  draw: 0,
  victory_ratio: 0,
  positions: Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null)),
  ...overrides
});

const stubTransaction = () => {
  mocks.transaction.mockImplementation(
    async (callback: (t: { LOCK: { UPDATE: string } }) => Promise<unknown>) =>
      callback({ LOCK: { UPDATE: 'UPDATE' } })
  );
};

describe('jogarRodada — erros de pre-requisito', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubTransaction();
  });

  it('lanca TEAM_NOT_FOUND quando o usuario nao tem time (snapshot criado do zero)', async () => {
    mocks.teamFindOne.mockResolvedValue(null);

    await expect(jogarRodada({ userId: 1 })).rejects.toBeInstanceOf(RodadaServiceError);
    await expect(jogarRodada({ userId: 1 })).rejects.toMatchObject({
      code: 'TEAM_NOT_FOUND'
    });
  });

  it('lanca TEAM_EMPTY quando o time nao possui atletas', async () => {
    const team = {
      id: 10,
      user_id: 1,
      victory: 0,
      lose: 0,
      draw: 0,
      round: 1,
      name: 'Time vazio',
      get: vi.fn().mockReturnValue([])
    };
    mocks.teamFindOne.mockResolvedValue(team);

    await expect(jogarRodada({ userId: 1 })).rejects.toMatchObject({
      code: 'TEAM_EMPTY'
    });
  });

  it('lanca SNAPSHOT_NOT_FOUND quando snapshot_id inexistente', async () => {
    mocks.teamSnapshotFindByPk.mockResolvedValue(null);

    await expect(jogarRodada({ userId: 1, snapshotId: 999 })).rejects.toMatchObject({
      code: 'SNAPSHOT_NOT_FOUND'
    });
  });

  it('lanca SNAPSHOT_FORBIDDEN quando snapshot pertence a outro user (403)', async () => {
    mocks.teamSnapshotFindByPk.mockResolvedValue(buildSnapshot({ user_id: 99 }));

    await expect(jogarRodada({ userId: 1, snapshotId: 11 })).rejects.toMatchObject({
      code: 'SNAPSHOT_FORBIDDEN'
    });
  });

  it('propaga NO_OPPONENT_FOUND quando matchmaking falha sem fantasmas conhecidos', async () => {
    const snapshot = buildSnapshot();
    mocks.teamSnapshotFindByPk.mockResolvedValue(snapshot);
    mocks.roundLogFindAll.mockResolvedValue([]);
    mocks.findOpponentSnapshot.mockRejectedValue(
      Object.assign(new Error('sem oponente'), {
        name: 'MatchmakingError',
        code: 'NO_OPPONENT_FOUND'
      })
    );

    // a constante real eh MatchmakingError, mas o catch do rodada eh por instanceof.
    // Como mockamos com Object.assign de Error, cai no else (rethrow).
    await expect(jogarRodada({ userId: 1, snapshotId: 11 })).rejects.toThrow();
  });
});

describe('jogarRodada — sucesso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubTransaction();
  });

  const setupHappyPath = (
    overrides: {
      winner?: 'player' | 'opponent' | 'draw';
      teamVictory?: number;
      teamLose?: number;
      isGuest?: boolean;
      matchEnded?: boolean;
    } = {}
  ) => {
    const playerSnapshot = buildSnapshot({ id: 11, user_id: 1, team_id: 10 });
    const opponentSnapshot = buildSnapshot({
      id: 22,
      user_id: 2,
      team_id: 20,
      victory_ratio: 0.5
    });

    mocks.teamSnapshotFindByPk.mockResolvedValue(playerSnapshot);
    mocks.roundLogFindAll.mockResolvedValue([]);
    mocks.findOpponentSnapshot.mockResolvedValue({
      opponent: opponentSnapshot,
      delta: 0.1,
      windowUsed: 0.05
    });

    const playerTeam = {
      id: 10,
      name: 'Time A',
      victory: overrides.teamVictory ?? 0,
      lose: overrides.teamLose ?? 0,
      draw: 0,
      round: 1,
      save: vi.fn().mockResolvedValue(undefined)
    };
    const opponentTeam = { id: 20, name: 'Time B' };

    mocks.teamFindByPk.mockImplementation(async (id: number) => {
      if (id === 10) {
        return playerTeam;
      }
      if (id === 20) {
        return opponentTeam;
      }
      return null;
    });

    mocks.computeInitiative.mockReturnValue({
      playerLeadVelocity: 100,
      opponentLeadVelocity: 80,
      startsWith: 'player',
      carrier: {
        team: 'player',
        athleteId: 1,
        athleteName: 'A',
        position: { x: 0, y: 0 }
      }
    });

    mocks.processarRodada.mockReturnValue({
      player: {},
      opponent: {},
      score: { player: 2, opponent: 1 },
      winner: overrides.winner ?? 'player',
      totalTurns: 12,
      initialBall: {
        team: 'player',
        athleteId: 1,
        athleteName: 'A',
        position: { x: 0, y: 0 }
      },
      events: []
    });

    const user = {
      id: 1,
      coins: 0,
      trophies: 100,
      victory: 0,
      defeat: 0,
      is_guest: overrides.isGuest ?? false,
      save: vi.fn().mockResolvedValue(undefined)
    };
    mocks.userFindByPk.mockResolvedValue(user);

    mocks.roundLogCreate.mockResolvedValue({ id: 555 });

    return { playerSnapshot, opponentSnapshot, playerTeam, user };
  };

  it('vitoria simples: atualiza victory, persiste roundLog, paga RF010', async () => {
    const { playerTeam, user } = setupHappyPath({ winner: 'player' });

    const result = await jogarRodada({ userId: 1, snapshotId: 11 });

    expect(playerTeam.victory).toBe(1);
    expect(playerTeam.lose).toBe(0);
    expect(playerTeam.round).toBe(2);
    expect(user.coins).toBe(10); // RF010 — saldo da rodada
    // partida nao encerrou: trofeus inalterados
    expect(user.trophies).toBe(100);
    expect(result.resolution.matchStatus).toBe('in_progress');
    expect(result.resolution.matchEnded).toBe(false);
    expect(result.resolution.coinsEarned).toBe(10);
    expect(result.resolution.roundLogId).toBe(555);
    expect(mocks.roundLogCreate).toHaveBeenCalledOnce();
  });

  it('derrota simples conta no campo lose', async () => {
    const { playerTeam } = setupHappyPath({ winner: 'opponent' });

    await jogarRodada({ userId: 1, snapshotId: 11 });

    expect(playerTeam.lose).toBe(1);
    expect(playerTeam.victory).toBe(0);
  });

  it('empate conta como rodada jogada (RN005)', async () => {
    const { playerTeam } = setupHappyPath({ winner: 'draw' });

    await jogarRodada({ userId: 1, snapshotId: 11 });

    expect(playerTeam.draw).toBe(1);
    expect(playerTeam.victory).toBe(0);
    expect(playerTeam.lose).toBe(0);
  });

  it('encerra partida com vitoria (RN001) e aplica +30 trofeus + victory++', async () => {
    const { playerTeam, user } = setupHappyPath({
      winner: 'player',
      teamVictory: 9
    });

    const result = await jogarRodada({ userId: 1, snapshotId: 11 });

    expect(result.resolution.matchEnded).toBe(true);
    expect(result.resolution.matchStatus).toBe('won');
    expect(result.resolution.trophiesDelta).toBe(30); // RF004 — +30 win
    expect(user.trophies).toBe(130);
    expect(user.victory).toBe(1);
    // reset da campanha apos encerrar
    expect(playerTeam.victory).toBe(0);
    expect(playerTeam.lose).toBe(0);
    expect(playerTeam.round).toBe(1);
    expect(mocks.teamAthleteDestroy).toHaveBeenCalledOnce();
  });

  it('encerra partida com derrota (RN002) e aplica -15 trofeus + defeat++', async () => {
    const { user } = setupHappyPath({
      winner: 'opponent',
      teamLose: 4
    });

    const result = await jogarRodada({ userId: 1, snapshotId: 11 });

    expect(result.resolution.matchEnded).toBe(true);
    expect(result.resolution.matchStatus).toBe('lost');
    expect(result.resolution.trophiesDelta).toBe(-15); // RF004 — -15 loss
    expect(user.trophies).toBe(85);
    expect(user.defeat).toBe(1);
  });

  it('convidado nao altera trofeus mesmo ao encerrar', async () => {
    const { user } = setupHappyPath({
      winner: 'player',
      teamVictory: 9,
      isGuest: true
    });

    const result = await jogarRodada({ userId: 1, snapshotId: 11 });

    expect(result.resolution.matchEnded).toBe(true);
    expect(result.resolution.trophiesDelta).toBe(0);
    expect(user.trophies).toBe(100); // intacto
    expect(user.victory).toBe(0); // convidado nao soma vitoria
  });
});

describe('jogarRodadaComFormacao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubTransaction();
  });

  it('salva snapshot da formacao recebida e delega para jogarRodada', async () => {
    const snapshot = buildSnapshot({ id: 33 });
    mocks.salvarEstadoEquipe.mockResolvedValue({ snapshotId: 33 });
    mocks.teamSnapshotFindByPk.mockResolvedValue(snapshot);
    mocks.roundLogFindAll.mockResolvedValue([]);
    mocks.findOpponentSnapshot.mockResolvedValue({
      opponent: buildSnapshot({ id: 44, user_id: 2, team_id: 20 }),
      delta: 0,
      windowUsed: 0
    });
    mocks.teamFindByPk.mockResolvedValue({
      id: 10,
      name: 'Time',
      victory: 0,
      lose: 0,
      draw: 0,
      round: 1,
      save: vi.fn().mockResolvedValue(undefined)
    });
    mocks.computeInitiative.mockReturnValue({
      playerLeadVelocity: 1,
      opponentLeadVelocity: 1,
      startsWith: 'player',
      carrier: {
        team: 'player',
        athleteId: 1,
        athleteName: 'A',
        position: { x: 0, y: 0 }
      }
    });
    mocks.processarRodada.mockReturnValue({
      player: {},
      opponent: {},
      score: { player: 1, opponent: 0 },
      winner: 'player',
      totalTurns: 12,
      initialBall: {
        team: 'player',
        athleteId: 1,
        athleteName: 'A',
        position: { x: 0, y: 0 }
      },
      events: []
    });
    mocks.userFindByPk.mockResolvedValue({
      id: 1,
      coins: 0,
      trophies: 0,
      victory: 0,
      defeat: 0,
      is_guest: false,
      save: vi.fn()
    });
    mocks.roundLogCreate.mockResolvedValue({ id: 1 });

    const result = await jogarRodadaComFormacao({
      userId: 1,
      positions: [{ athleteId: 1, posX: 0, posY: 0 }]
    });

    expect(mocks.salvarEstadoEquipe).toHaveBeenCalledWith({
      userId: 1,
      positions: [{ athleteId: 1, posX: 0, posY: 0 }],
      items: undefined
    });
    expect(result.matchmaking.snapshotId).toBe(33);
  });
});
