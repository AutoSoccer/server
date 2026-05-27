import { sequelize } from '../../config/database';
import {
  Athlete as AthleteModel,
  Team,
  TeamSnapshot
} from '../../database/models';
import {
  type SnapshotAthlete,
  type SnapshotPositions
} from '../../database/models/team-snapshot.model';
import {
  computeVictoryRatio,
  findOpponentSnapshot,
  MatchmakingError
} from '../matchmaking/matchmaking.service';
import {
  Athlete as SimAthlete,
  type MatchResult,
  type Possession,
  processarRodada,
  type SimulationOptions,
  TeamDTO
} from '../simulador';

const GRID_ROWS = 3;
const GRID_COLS = 3;

export type RodadaServiceErrorCode =
  | 'TEAM_NOT_FOUND'
  | 'TEAM_EMPTY'
  | 'SNAPSHOT_NOT_FOUND'
  | 'SNAPSHOT_FORBIDDEN'
  | 'NO_OPPONENT_FOUND';

export class RodadaServiceError extends Error {
  public readonly code: RodadaServiceErrorCode;

  constructor(code: RodadaServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type JogarRodadaInput = {
  userId: number;
  snapshotId?: number;
};

export type JogarRodadaResult = MatchResult & {
  matchmaking: {
    snapshotId: number;
    opponentSnapshotId: number;
    opponentUserId: number;
    victoryRatio: number;
    delta: number;
    windowUsed: number;
  };
  initiative: {
    playerLeadVelocity: number;
    opponentLeadVelocity: number;
    startsWith: Possession;
  };
  persisted: {
    teamId: number;
    victory: number;
    lose: number;
    round: number;
  };
};

const rowForType = (type: string | undefined): number => {
  if (type === 'goalkeeper' || type === 'defender') {
    return 0;
  }
  if (type === 'attacker') {
    return 2;
  }
  return 1;
};

const emptyGrid = <T>(): (T | null)[][] =>
  Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => null as T | null)
  );

const toSnapshotAthlete = (athlete: AthleteModel): SnapshotAthlete => ({
  id: athlete.id,
  name: athlete.name,
  velocity: athlete.velocity,
  attack: athlete.attack,
  defense: athlete.defense
});

const placeOnGrid = <T>(
  grid: (T | null)[][],
  preferredRow: number,
  value: T
): void => {
  const order = [preferredRow, 1, 0, 2].filter(
    (row, idx, arr) => arr.indexOf(row) === idx
  );
  for (const row of order) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (grid[row][col] === null) {
        grid[row][col] = value;
        return;
      }
    }
  }
};

const buildSnapshotPositions = (athletes: AthleteModel[]): SnapshotPositions => {
  const grid = emptyGrid<SnapshotAthlete>();
  for (const athlete of athletes) {
    placeOnGrid(grid, rowForType(athlete.type), toSnapshotAthlete(athlete));
  }
  return grid;
};

const snapshotToTeamDto = (
  snapshot: TeamSnapshot,
  fallbackName: string
): TeamDTO => {
  const dto = new TeamDTO();
  dto.id = snapshot.team_id;
  dto.name = fallbackName;
  dto.turn = snapshot.round;
  dto.victorys = snapshot.victory;
  dto.loses = snapshot.lose;
  dto.athletesPositions = snapshot.positions.map((row) =>
    row.map((cell) => {
      if (!cell) {
        return null;
      }
      const a = new SimAthlete();
      a.id = cell.id;
      a.name = cell.name;
      a.velocity = cell.velocity;
      a.attack = cell.attack;
      a.defense = cell.defense;
      return a;
    })
  );
  dto.athlethes = dto.athletesPositions
    .flat()
    .filter((entry): entry is SimAthlete => entry !== null);
  return dto;
};

const loadPlayerTeam = async (userId: number) => {
  const team = await Team.findOne({
    where: { user_id: userId },
    order: [['id', 'ASC']],
    include: [{ association: 'athletes', required: false }]
  });

  if (!team) {
    throw new RodadaServiceError(
      'TEAM_NOT_FOUND',
      'Voce precisa de um time para jogar uma rodada.'
    );
  }

  const athletes = ((team.get('athletes') as AthleteModel[] | undefined) ?? []).filter(
    (a): a is AthleteModel => a !== null && a !== undefined
  );

  if (athletes.length === 0) {
    throw new RodadaServiceError(
      'TEAM_EMPTY',
      'Seu time nao possui atletas; contrate antes de jogar.'
    );
  }

  return { team, athletes };
};

const loadOrCreateSnapshot = async (
  userId: number,
  snapshotId: number | undefined
): Promise<TeamSnapshot> => {
  if (snapshotId !== undefined) {
    const existing = await TeamSnapshot.findByPk(snapshotId);
    if (!existing) {
      throw new RodadaServiceError(
        'SNAPSHOT_NOT_FOUND',
        `Snapshot ${snapshotId} nao encontrado.`
      );
    }
    if (existing.user_id !== userId) {
      throw new RodadaServiceError(
        'SNAPSHOT_FORBIDDEN',
        'Voce nao tem permissao para usar este snapshot.'
      );
    }
    return existing;
  }

  const { team, athletes } = await loadPlayerTeam(userId);
  const ratio = computeVictoryRatio(team.victory ?? 0, team.lose ?? 0);

  return TeamSnapshot.create({
    team_id: team.id,
    user_id: userId,
    round: team.round ?? 1,
    victory: team.victory ?? 0,
    lose: team.lose ?? 0,
    victory_ratio: ratio,
    positions: buildSnapshotPositions(athletes)
  });
};

const getLeadVelocity = (team: TeamDTO): number => {
  // RN009: atleta "mais a frente" e o da linha de ataque (row 2).
  for (let row = team.athletesPositions.length - 1; row >= 0; row--) {
    const cols = team.athletesPositions[row];
    let bestInRow = -Infinity;
    for (const cell of cols) {
      if (cell && typeof cell.velocity === 'number') {
        bestInRow = Math.max(bestInRow, cell.velocity);
      }
    }
    if (bestInRow !== -Infinity) {
      return bestInRow;
    }
  }
  return 0;
};

const computeInitiative = (
  player: TeamDTO,
  opponent: TeamDTO,
  rng: () => number
): { playerLeadVelocity: number; opponentLeadVelocity: number; startsWith: Possession } => {
  const playerLead = getLeadVelocity(player);
  const opponentLead = getLeadVelocity(opponent);

  let startsWith: Possession;
  if (playerLead > opponentLead) {
    startsWith = 'player';
  } else if (opponentLead > playerLead) {
    startsWith = 'opponent';
  } else {
    startsWith = rng() < 0.5 ? 'player' : 'opponent';
  }

  return {
    playerLeadVelocity: playerLead,
    opponentLeadVelocity: opponentLead,
    startsWith
  };
};

const persistResultOnPlayer = async (
  team: Team,
  winner: MatchResult['winner']
): Promise<{ teamId: number; victory: number; lose: number; round: number }> => {
  return sequelize.transaction(async (transaction) => {
    if (winner === 'player') {
      team.victory = (team.victory ?? 0) + 1;
    } else if (winner === 'opponent') {
      team.lose = (team.lose ?? 0) + 1;
    }
    team.round = (team.round ?? 1) + 1;
    await team.save({ transaction });
    return {
      teamId: team.id,
      victory: team.victory,
      lose: team.lose,
      round: team.round
    };
  });
};

/**
 * Task 4.3 — orquestra a rodada completa:
 * 1. Garante o snapshot da equipe do jogador (RN: usa o informado ou cria um novo).
 * 2. Busca oponente fantasma com victory_ratio proximo (RN006).
 * 3. Reconstroi TeamDTOs e calcula iniciativa pela velocidade do atacante (RN009).
 * 4. Aciona o motor de 12 turnos (Task 4.2) com a posse inicial calculada.
 * 5. Persiste victory/lose/round no time do jogador.
 */
export const jogarRodada = async (
  input: JogarRodadaInput,
  options?: SimulationOptions
): Promise<JogarRodadaResult> => {
  const { userId, snapshotId } = input;
  const rng = options?.rng ?? Math.random;

  const playerSnapshot = await loadOrCreateSnapshot(userId, snapshotId);

  let opponentSnapshot: TeamSnapshot;
  let delta = 0;
  let windowUsed = 0;

  try {
    const match = await findOpponentSnapshot(playerSnapshot);
    opponentSnapshot = match.opponent;
    delta = match.delta;
    windowUsed = match.windowUsed;
  } catch (error) {
    if (error instanceof MatchmakingError) {
      throw new RodadaServiceError(
        'NO_OPPONENT_FOUND',
        error.message
      );
    }
    throw error;
  }

  const playerTeam = await Team.findByPk(playerSnapshot.team_id);
  if (!playerTeam) {
    throw new RodadaServiceError(
      'TEAM_NOT_FOUND',
      'Time do jogador desapareceu entre o snapshot e a partida.'
    );
  }

  const playerDto = snapshotToTeamDto(playerSnapshot, playerTeam.name);
  const opponentDto = snapshotToTeamDto(
    opponentSnapshot,
    `Adversario fantasma #${opponentSnapshot.team_id}`
  );

  const initiative = computeInitiative(playerDto, opponentDto, rng);

  const result = processarRodada(playerDto, opponentDto, {
    ...options,
    initialPossession: initiative.startsWith
  });

  const persisted = await persistResultOnPlayer(playerTeam, result.winner);

  return {
    ...result,
    matchmaking: {
      snapshotId: playerSnapshot.id,
      opponentSnapshotId: opponentSnapshot.id,
      opponentUserId: opponentSnapshot.user_id,
      victoryRatio: Number(playerSnapshot.victory_ratio),
      delta,
      windowUsed
    },
    initiative,
    persisted
  };
};
