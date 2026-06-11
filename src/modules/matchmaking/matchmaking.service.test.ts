import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SnapshotPositions } from '../../database/models/team-snapshot.model';
import type { TeamSnapshot } from '../../database/models';

const mocks = vi.hoisted(() => ({
  findAll: vi.fn()
}));

vi.mock('../../config/database', () => ({
  sequelize: {
    literal: (sql: string) => ({ __literal: sql })
  }
}));

vi.mock('../../database/models', () => ({
  TeamSnapshot: {
    findAll: mocks.findAll
  }
}));

import {
  countSnapshotAthletes,
  findOpponentSnapshot,
  isEligibleOpponentSnapshot,
  MatchmakingError,
  maxOpponentAthletesForProgress
} from './matchmaking.service';

const positionsWithAthletes = (count: number): SnapshotPositions => {
  const positions: SnapshotPositions = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => null)
  );

  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / 3);
    const col = index % 3;
    positions[row][col] = {
      id: index + 1,
      name: `Atleta ${index + 1}`,
      velocity: 50,
      attack: 50,
      defense: 50,
      type: 'midfielder'
    };
  }

  return positions;
};

const snapshotWithAthletes = (count: number): TeamSnapshot =>
  ({
    positions: positionsWithAthletes(count)
  }) as TeamSnapshot;

type PartialSnapshot = Partial<{
  id: number;
  user_id: number;
  team_id: number;
  victory: number;
  lose: number;
  draw: number;
  victory_ratio: number;
  positions: SnapshotPositions;
}>;

const buildSnapshot = (overrides: PartialSnapshot = {}): TeamSnapshot =>
  ({
    id: 1,
    user_id: 1,
    team_id: 10,
    round: 1,
    victory: 0,
    lose: 0,
    draw: 0,
    victory_ratio: 0,
    positions: positionsWithAthletes(3),
    ...overrides
  }) as unknown as TeamSnapshot;

describe('limite de atletas no matchmaking', () => {
  it('limita adversarios da primeira rodada a tres atletas', () => {
    const maxAthletes = maxOpponentAthletesForProgress(0, 0, 0);

    expect(maxAthletes).toBe(3);
    expect(isEligibleOpponentSnapshot(snapshotWithAthletes(3), maxAthletes)).toBe(true);
    expect(isEligibleOpponentSnapshot(snapshotWithAthletes(6), maxAthletes)).toBe(false);
  });

  it('permite ate seis atletas depois da primeira rodada', () => {
    const maxAthletes = maxOpponentAthletesForProgress(1, 0, 0);

    expect(maxAthletes).toBe(6);
    expect(isEligibleOpponentSnapshot(snapshotWithAthletes(6), maxAthletes)).toBe(true);
  });

  it('conta somente celulas ocupadas da formacao', () => {
    expect(countSnapshotAthletes(snapshotWithAthletes(1))).toBe(1);
    expect(countSnapshotAthletes(snapshotWithAthletes(3))).toBe(3);
    expect(countSnapshotAthletes(snapshotWithAthletes(6))).toBe(6);
  });
});

describe('findOpponentSnapshot — RN006 janelas progressivas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('escolhe oponente com mesmo progresso exato (windowUsed=0)', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 2,
      lose: 1,
      draw: 0,
      victory_ratio: 2 / 3
    });

    const opponent = buildSnapshot({
      id: 50,
      user_id: 2,
      team_id: 99,
      victory: 2,
      lose: 1,
      draw: 0,
      victory_ratio: 2 / 3,
      positions: positionsWithAthletes(6)
    });

    mocks.findAll.mockResolvedValueOnce([opponent]);

    const result = await findOpponentSnapshot(player);

    expect(result.opponent.id).toBe(50);
    expect(result.windowUsed).toBe(0);
    expect(result.delta).toBe(0);
  });

  it('encontra adversario na janela 0.05 quando nao ha progresso exato', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 5,
      lose: 5,
      draw: 0,
      victory_ratio: 0.5
    });

    const opponent = buildSnapshot({
      id: 77,
      user_id: 2,
      team_id: 101,
      victory: 5,
      lose: 4,
      draw: 1,
      victory_ratio: 0.52,
      positions: positionsWithAthletes(6)
    });

    // findFirstEligibleSnapshot p/ progresso exato => vazio
    mocks.findAll.mockResolvedValueOnce([]);
    // findFirstEligibleSnapshot p/ janela 0.05 => acha
    mocks.findAll.mockResolvedValueOnce([opponent]);

    const result = await findOpponentSnapshot(player);

    expect(result.opponent.id).toBe(77);
    expect(result.windowUsed).toBe(0.05);
    expect(result.delta).toBeCloseTo(0.02, 5);
  });

  it('escala janela ate 0.1 quando 0.05 nao retorna ninguem', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 4,
      lose: 6,
      draw: 0,
      victory_ratio: 0.4
    });

    const opponent = buildSnapshot({
      id: 88,
      user_id: 2,
      team_id: 102,
      victory: 3,
      lose: 7,
      draw: 0,
      victory_ratio: 0.3,
      positions: positionsWithAthletes(6)
    });

    // 1) progresso exato — vazio
    mocks.findAll.mockResolvedValueOnce([]);
    // 2) janela 0.05 — vazio
    mocks.findAll.mockResolvedValueOnce([]);
    // 3) fallback sample janela 0.05 — vazio
    mocks.findAll.mockResolvedValueOnce([]);
    // 4) janela 0.1 — encontra
    mocks.findAll.mockResolvedValueOnce([opponent]);

    const result = await findOpponentSnapshot(player);

    expect(result.opponent.id).toBe(88);
    expect(result.windowUsed).toBe(0.1);
  });

  it('escala janela ate 0.2 quando 0.05 e 0.1 falham', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 8,
      lose: 2,
      draw: 0,
      victory_ratio: 0.8
    });

    const opponent = buildSnapshot({
      id: 90,
      user_id: 2,
      team_id: 103,
      victory: 6,
      lose: 4,
      draw: 0,
      victory_ratio: 0.6,
      positions: positionsWithAthletes(6)
    });

    // exato, 0.05, fallback 0.05, 0.1, fallback 0.1
    mocks.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([opponent]);

    const result = await findOpponentSnapshot(player);

    expect(result.opponent.id).toBe(90);
    expect(result.windowUsed).toBe(0.2);
  });

  it('escala janela ate 0.35 quando 0.05/0.1/0.2 falham', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 9,
      lose: 1,
      draw: 0,
      victory_ratio: 0.9
    });

    const opponent = buildSnapshot({
      id: 92,
      user_id: 2,
      team_id: 104,
      victory: 6,
      lose: 4,
      draw: 0,
      victory_ratio: 0.6,
      positions: positionsWithAthletes(6)
    });

    // exato (1) + 3 janelas x 2 chamadas (6) + 1 janela vencedora (1) = 8
    mocks.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([opponent]);

    const result = await findOpponentSnapshot(player);

    expect(result.opponent.id).toBe(92);
    expect(result.windowUsed).toBe(0.35);
  });

  it('escala janela ate 1 (catch-all) quando nada antes serve', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 10,
      lose: 0,
      draw: 0,
      victory_ratio: 1
    });

    const opponent = buildSnapshot({
      id: 95,
      user_id: 2,
      team_id: 105,
      victory: 0,
      lose: 10,
      draw: 0,
      victory_ratio: 0,
      positions: positionsWithAthletes(6)
    });

    // exato + 4 janelas (2 chamadas cada) = 9 chamadas vazias antes da janela 1
    for (let i = 0; i < 9; i += 1) {
      mocks.findAll.mockResolvedValueOnce([]);
    }
    mocks.findAll.mockResolvedValueOnce([opponent]);

    const result = await findOpponentSnapshot(player);

    expect(result.opponent.id).toBe(95);
    expect(result.windowUsed).toBe(1);
    expect(result.delta).toBe(1);
  });

  it('exclui snapshots ja enfrentados via excludeSnapshotIds', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 2,
      lose: 1,
      draw: 0,
      victory_ratio: 2 / 3
    });

    const opponent = buildSnapshot({
      id: 200,
      user_id: 3,
      team_id: 200,
      victory: 2,
      lose: 1,
      draw: 0,
      victory_ratio: 2 / 3,
      positions: positionsWithAthletes(6)
    });

    mocks.findAll.mockResolvedValueOnce([opponent]);

    await findOpponentSnapshot(player, { excludeSnapshotIds: [50, 51] });

    // a primeira chamada deve passar id notIn [player.id, 50, 51]
    const firstCall = mocks.findAll.mock.calls[0][0];
    const whereId = firstCall.where.id;
    expect(whereId).toBeDefined();
    // sequelize Op symbol — comparar pelo primeiro symbol enumeravel
    const symbols = Object.getOwnPropertySymbols(whereId);
    expect(symbols.length).toBeGreaterThan(0);
    const notInValues = whereId[symbols[0]] as number[];
    expect(notInValues).toEqual(expect.arrayContaining([1, 50, 51]));
  });

  it('lanca MatchmakingError quando nenhuma janela encontra adversario (fallback bot)', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 2,
      lose: 1,
      draw: 0,
      victory_ratio: 2 / 3
    });

    // toda chamada retorna vazio — sem oponente humano elegivel
    mocks.findAll.mockResolvedValue([]);

    await expect(findOpponentSnapshot(player)).rejects.toBeInstanceOf(MatchmakingError);
    await expect(findOpponentSnapshot(player)).rejects.toMatchObject({
      code: 'NO_OPPONENT_FOUND'
    });
  });

  it('considera draws na contagem de rodadas jogadas (CAST AS SIGNED)', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 1,
      lose: 1,
      draw: 2, // 4 rodadas jogadas
      victory_ratio: 0.25
    });

    const opponent = buildSnapshot({
      id: 300,
      user_id: 4,
      team_id: 300,
      victory: 1,
      lose: 1,
      draw: 2,
      victory_ratio: 0.25,
      positions: positionsWithAthletes(6)
    });

    mocks.findAll.mockResolvedValueOnce([opponent]);

    const result = await findOpponentSnapshot(player);

    expect(result.opponent.id).toBe(300);
    // o where da primeira chamada deve incluir draw=2
    const firstCall = mocks.findAll.mock.calls[0][0];
    expect(firstCall.where.draw).toBe(2);
  });

  it('descarta candidatos com numero de atletas fora do limite da rodada', async () => {
    const player = buildSnapshot({
      id: 1,
      user_id: 1,
      victory: 0,
      lose: 0,
      draw: 0,
      victory_ratio: 0
    });

    // primeira rodada => limite 3 atletas. Candidato com 6 nao serve.
    const oversized = buildSnapshot({
      id: 400,
      user_id: 5,
      victory: 0,
      lose: 0,
      draw: 0,
      victory_ratio: 0,
      positions: positionsWithAthletes(6)
    });

    const valid = buildSnapshot({
      id: 401,
      user_id: 6,
      victory: 0,
      lose: 0,
      draw: 0,
      victory_ratio: 0,
      positions: positionsWithAthletes(3)
    });

    // exato — devolve oversized + valid, deve filtrar oversized
    mocks.findAll.mockResolvedValueOnce([oversized, valid]);

    const result = await findOpponentSnapshot(player);

    expect(result.opponent.id).toBe(401);
  });
});
