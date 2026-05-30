import { Op, type Transaction } from 'sequelize';

import { sequelize } from '../../config/database';
import {
  Athlete as AthleteModel,
  Team,
  TeamAthlete,
  TeamSnapshot
} from '../../database/models';
import type {
  SnapshotAthlete,
  SnapshotPositions
} from '../../database/models/team-snapshot.model';

export const GRID_SIZE = 3;
export const REQUIRED_ATHLETES = 6;

export type AthletePositionInput = {
  athleteId: number;
  posX: number;
  posY: number;
};

export type SalvarEstadoInput = {
  userId: number;
  positions: AthletePositionInput[];
  /**
   * IDs de itens aplicados a equipe nesta rodada.
   * Reservado para a Sprint 5 — hoje so registramos no log.
   */
  items?: number[];
};

export type SalvarEstadoResult = {
  snapshotId: number;
  teamId: number;
  round: number;
  victory: number;
  lose: number;
  victoryRatio: number;
  positions: SnapshotPositions;
};

export type TeamSnapshotErrorCode =
  | 'TEAM_NOT_FOUND'
  | 'INVALID_BODY'
  | 'WRONG_ATHLETE_COUNT'
  | 'DUPLICATE_ATHLETE'
  | 'DUPLICATE_POSITION'
  | 'OUT_OF_BOUNDS'
  | 'ATHLETE_NOT_IN_TEAM'
  | 'ITEM_NOT_IN_INVENTORY';

export class TeamSnapshotError extends Error {
  public readonly code: TeamSnapshotErrorCode;

  constructor(code: TeamSnapshotErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const ensurePositionsShape = (positions: unknown): AthletePositionInput[] => {
  if (!Array.isArray(positions)) {
    throw new TeamSnapshotError(
      'INVALID_BODY',
      'O campo positions precisa ser um array.'
    );
  }

  const normalized: AthletePositionInput[] = [];
  for (const entry of positions) {
    if (!entry || typeof entry !== 'object') {
      throw new TeamSnapshotError(
        'INVALID_BODY',
        'Cada item de positions precisa ser objeto { athleteId, posX, posY }.'
      );
    }
    const athleteId = Number((entry as { athleteId?: unknown }).athleteId);
    const posX = Number((entry as { posX?: unknown }).posX);
    const posY = Number((entry as { posY?: unknown }).posY);
    if (
      !Number.isInteger(athleteId) ||
      athleteId <= 0 ||
      !Number.isInteger(posX) ||
      !Number.isInteger(posY)
    ) {
      throw new TeamSnapshotError(
        'INVALID_BODY',
        'athleteId, posX e posY precisam ser inteiros.'
      );
    }
    normalized.push({ athleteId, posX, posY });
  }
  return normalized;
};

const ensureValidPositions = (positions: AthletePositionInput[]): void => {
  // RN: a equipe precisa estar completa com exatamente 6 atletas posicionados.
  if (positions.length !== REQUIRED_ATHLETES) {
    throw new TeamSnapshotError(
      'WRONG_ATHLETE_COUNT',
      `Equipe precisa de exatamente ${REQUIRED_ATHLETES} atletas posicionados; recebido ${positions.length}.`
    );
  }

  const athleteIds = new Set<number>();
  const cells = new Set<string>();

  for (const entry of positions) {
    if (
      entry.posX < 0 ||
      entry.posX >= GRID_SIZE ||
      entry.posY < 0 ||
      entry.posY >= GRID_SIZE
    ) {
      throw new TeamSnapshotError(
        'OUT_OF_BOUNDS',
        `Posicao (${entry.posX}, ${entry.posY}) fora do grid ${GRID_SIZE}x${GRID_SIZE}.`
      );
    }

    if (athleteIds.has(entry.athleteId)) {
      throw new TeamSnapshotError(
        'DUPLICATE_ATHLETE',
        `Atleta ${entry.athleteId} foi enviado mais de uma vez.`
      );
    }
    athleteIds.add(entry.athleteId);

    const cellKey = `${entry.posX},${entry.posY}`;
    if (cells.has(cellKey)) {
      throw new TeamSnapshotError(
        'DUPLICATE_POSITION',
        `A celula (${entry.posX}, ${entry.posY}) foi atribuida a mais de um atleta.`
      );
    }
    cells.add(cellKey);
  }
};

const loadUserTeam = async (
  userId: number,
  transaction?: Transaction
): Promise<{ team: Team; athletes: AthleteModel[] }> => {
  const team = await Team.findOne({
    where: { user_id: userId },
    order: [['id', 'ASC']],
    include: [{ association: 'athletes', required: false }],
    transaction
  });

  if (!team) {
    throw new TeamSnapshotError(
      'TEAM_NOT_FOUND',
      'Voce precisa de um time para salvar o estado.'
    );
  }

  const athletes = ((team.get('athletes') as AthleteModel[] | undefined) ?? []).filter(
    (a): a is AthleteModel => a !== null && a !== undefined
  );

  return { team, athletes };
};

const ensureAthletesBelongToTeam = (
  teamAthletes: AthleteModel[],
  requestedIds: number[]
): Map<number, AthleteModel> => {
  const ownership = new Map<number, AthleteModel>();
  for (const athlete of teamAthletes) {
    ownership.set(athlete.id, athlete);
  }

  const missing: number[] = [];
  for (const id of requestedIds) {
    if (!ownership.has(id)) {
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    throw new TeamSnapshotError(
      'ATHLETE_NOT_IN_TEAM',
      `Atletas nao pertencem ao seu time: ${missing.join(', ')}.`
    );
  }

  return ownership;
};

const computeVictoryRatio = (victory: number, lose: number): number => {
  const total = victory + lose;
  if (total <= 0) {
    return 0;
  }
  return victory / total;
};

const buildPositionsGrid = (
  positions: AthletePositionInput[],
  ownership: Map<number, AthleteModel>
): SnapshotPositions => {
  const grid: SnapshotPositions = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null as SnapshotAthlete | null)
  );

  for (const entry of positions) {
    const athlete = ownership.get(entry.athleteId)!;
    grid[entry.posY][entry.posX] = {
      id: athlete.id,
      name: athlete.name,
      velocity: athlete.velocity,
      attack: athlete.attack,
      defense: athlete.defense
    };
  }

  return grid;
};

/**
 * Task 3.2 — Snapshot de Equipe por Rodada.
 *
 * Persiste o estado exato (posicionamento) da equipe do usuario em um
 * registro imutavel em team_snapshots. O snapshot guarda o JSON da
 * formacao, blindado contra vendas futuras de atletas (RF011), e e
 * usado pelo matchmaking (Task 4.3) e pelo motor (Task 4.2).
 *
 * Validacoes aplicadas:
 *  - exatamente 6 atletas posicionados (RN)
 *  - grid 3x3, sem celulas duplicadas, sem atletas duplicados
 *  - todos os IDs pertencem ao inventario atual do usuario (RF007/RF008)
 *  - itens (Sprint 5) reservado para integracao futura
 */
export const salvarEstadoEquipe = async (
  input: SalvarEstadoInput
): Promise<SalvarEstadoResult> => {
  const positions = ensurePositionsShape(input.positions);
  ensureValidPositions(positions);

  if (input.items && input.items.length > 0) {
    // Sprint 5 — Sistema de Itens ainda nao existe; impedimos uso ate la.
    throw new TeamSnapshotError(
      'ITEM_NOT_IN_INVENTORY',
      'Sistema de itens ainda nao foi implementado (Sprint 5).'
    );
  }

  return sequelize.transaction(async (transaction) => {
    const { team, athletes } = await loadUserTeam(input.userId, transaction);

    const requestedIds = positions.map((entry) => entry.athleteId);
    const ownership = ensureAthletesBelongToTeam(athletes, requestedIds);

    // Refresh defensivo via team_athletes — atletas vendidos entre o
    // load e o transaction commit nao escorregam.
    const stillOwned = await TeamAthlete.findAll({
      where: { team_id: team.id, athlete_id: { [Op.in]: requestedIds } },
      transaction
    });
    if (stillOwned.length !== requestedIds.length) {
      throw new TeamSnapshotError(
        'ATHLETE_NOT_IN_TEAM',
        'Um ou mais atletas nao pertencem mais ao seu time.'
      );
    }

    const victoryRatio = computeVictoryRatio(
      team.victory ?? 0,
      team.lose ?? 0
    );

    const snapshot = await TeamSnapshot.create(
      {
        team_id: team.id,
        user_id: input.userId,
        round: team.round ?? 1,
        victory: team.victory ?? 0,
        lose: team.lose ?? 0,
        victory_ratio: victoryRatio,
        positions: buildPositionsGrid(positions, ownership)
      },
      { transaction }
    );

    return {
      snapshotId: snapshot.id,
      teamId: team.id,
      round: snapshot.round,
      victory: snapshot.victory,
      lose: snapshot.lose,
      victoryRatio,
      positions: snapshot.positions
    };
  });
};
