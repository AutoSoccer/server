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
import { computeVictoryRatio } from '../matchmaking/matchmaking.service';

export const GRID_SIZE = 3;
export const MIN_POSITIONED_ATHLETES = 1;
export const MAX_POSITIONED_ATHLETES = 6;

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

export type TeamSnapshotErrorOptions = {
  i18nKey?: string;
  params?: Record<string, unknown>;
};

export class TeamSnapshotError extends Error {
  public readonly code: TeamSnapshotErrorCode;
  public readonly i18nKey: string;
  public readonly params?: Record<string, unknown>;

  constructor(code: TeamSnapshotErrorCode, options: TeamSnapshotErrorOptions = {}) {
    const i18nKey = options.i18nKey ?? `equipe.errors.${code}`;
    super(i18nKey);
    this.name = 'TeamSnapshotError';
    this.code = code;
    this.i18nKey = i18nKey;
    this.params = options.params;
  }
}

const ensurePositionsShape = (positions: unknown): AthletePositionInput[] => {
  if (!Array.isArray(positions)) {
    throw new TeamSnapshotError('INVALID_BODY', {
      i18nKey: 'equipe.snapshot.invalidBody.positionsArray'
    });
  }

  const normalized: AthletePositionInput[] = [];
  for (const entry of positions) {
    if (!entry || typeof entry !== 'object') {
      throw new TeamSnapshotError('INVALID_BODY', {
        i18nKey: 'equipe.snapshot.invalidBody.positionsObject',
        params: { shape: '{ athleteId, posX, posY }' }
      });
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
      throw new TeamSnapshotError('INVALID_BODY', {
        i18nKey: 'equipe.snapshot.invalidBody.positionsIntegers'
      });
    }
    normalized.push({ athleteId, posX, posY });
  }
  return normalized;
};

const ensureValidPositions = (positions: AthletePositionInput[]): void => {
  // RN: o jogador pode iniciar a rodada com qualquer formacao entre 1 e 6 atletas.
  if (
    positions.length < MIN_POSITIONED_ATHLETES ||
    positions.length > MAX_POSITIONED_ATHLETES
  ) {
    throw new TeamSnapshotError('WRONG_ATHLETE_COUNT', {
      i18nKey: 'equipe.snapshot.wrongAthleteCount',
      params: {
        min: MIN_POSITIONED_ATHLETES,
        max: MAX_POSITIONED_ATHLETES,
        count: positions.length
      }
    });
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
      throw new TeamSnapshotError('OUT_OF_BOUNDS', {
        i18nKey: 'equipe.snapshot.outOfBounds',
        params: { posX: entry.posX, posY: entry.posY, grid: GRID_SIZE }
      });
    }

    if (athleteIds.has(entry.athleteId)) {
      throw new TeamSnapshotError('DUPLICATE_ATHLETE', {
        i18nKey: 'equipe.snapshot.duplicateAthlete',
        params: { athleteId: entry.athleteId }
      });
    }
    athleteIds.add(entry.athleteId);

    const cellKey = `${entry.posX},${entry.posY}`;
    if (cells.has(cellKey)) {
      throw new TeamSnapshotError('DUPLICATE_POSITION', {
        i18nKey: 'equipe.snapshot.duplicatePosition',
        params: { posX: entry.posX, posY: entry.posY }
      });
    }
    cells.add(cellKey);
  }
};

export const validateAthletePositions = (
  positions: unknown
): AthletePositionInput[] => {
  const normalized = ensurePositionsShape(positions);
  ensureValidPositions(normalized);
  return normalized;
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
    throw new TeamSnapshotError('TEAM_NOT_FOUND', {
      i18nKey: 'equipe.snapshot.teamNotFound'
    });
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
    throw new TeamSnapshotError('ATHLETE_NOT_IN_TEAM', {
      i18nKey: 'equipe.snapshot.athleteNotInTeam',
      params: { ids: missing.join(', ') }
    });
  }

  return ownership;
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
      defense: athlete.defense,
      type: athlete.type
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
 *  - de 1 a 6 atletas posicionados (RN)
 *  - grid 3x3, sem celulas duplicadas, sem atletas duplicados
 *  - todos os IDs pertencem ao inventario atual do usuario (RF007/RF008)
 *  - itens (Sprint 5) reservado para integracao futura
 */
export const salvarEstadoEquipe = async (
  input: SalvarEstadoInput
): Promise<SalvarEstadoResult> => {
  const positions = validateAthletePositions(input.positions);

  if (input.items && input.items.length > 0) {
    // Sprint 5 — Sistema de Itens ainda nao existe; impedimos uso ate la.
    throw new TeamSnapshotError('ITEM_NOT_IN_INVENTORY', {
      i18nKey: 'equipe.snapshot.itemNotInInventory'
    });
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
      throw new TeamSnapshotError('ATHLETE_NOT_IN_TEAM', {
        i18nKey: 'equipe.snapshot.athleteNoLongerInTeam'
      });
    }

    const victoryRatio = computeVictoryRatio(
      team.victory ?? 0,
      team.lose ?? 0,
      team.draw ?? 0
    );

    const snapshot = await TeamSnapshot.create(
      {
        team_id: team.id,
        user_id: input.userId,
        round: team.round ?? 1,
        victory: team.victory ?? 0,
        lose: team.lose ?? 0,
        draw: team.draw ?? 0,
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
