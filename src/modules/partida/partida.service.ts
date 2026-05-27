import { Op } from 'sequelize';

import { sequelize } from '../../config/database';
import {
  Athlete as AthleteModel,
  Team,
  TeamAthlete
} from '../../database/models';
import {
  Athlete as SimAthlete,
  type MatchResult,
  processarRodada,
  type SimulationOptions,
  TeamDTO
} from '../simulador';

const GRID_ROWS = 3;
const GRID_COLS = 3;
const OPPONENT_TEAM_SIZE = 6;
const FALLBACK_NAME = 'Atleta';

export type PartidaServiceErrorCode =
  | 'TEAM_NOT_FOUND'
  | 'TEAM_EMPTY'
  | 'NO_OPPONENT_POOL';

export class PartidaServiceError extends Error {
  public readonly code: PartidaServiceErrorCode;

  constructor(code: PartidaServiceErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export type SimulateMatchResult = MatchResult & {
  persisted: {
    teamId: number;
    victory: number;
    lose: number;
  };
};

const toSimAthlete = (athlete: AthleteModel | null): SimAthlete | null => {
  if (!athlete) {
    return null;
  }
  const dto = new SimAthlete();
  dto.id = athlete.id;
  dto.name = athlete.name ?? FALLBACK_NAME;
  dto.velocity = athlete.velocity;
  dto.attack = athlete.attack;
  dto.defense = athlete.defense;
  return dto;
};

const emptyGrid = (): (SimAthlete | null)[][] =>
  Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => null as SimAthlete | null)
  );

const rowForType = (type: string | undefined): number => {
  if (type === 'goalkeeper' || type === 'defender') {
    return 0;
  }
  if (type === 'attacker') {
    return 2;
  }
  return 1;
};

const placeAthlete = (grid: (SimAthlete | null)[][], preferredRow: number, athlete: SimAthlete): void => {
  const order = [preferredRow, 1, 0, 2].filter(
    (value, index, all) => all.indexOf(value) === index
  );
  for (const row of order) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (grid[row][col] === null) {
        grid[row][col] = athlete;
        return;
      }
    }
  }
};

const buildPositions = (athletes: AthleteModel[]): (SimAthlete | null)[][] => {
  const grid = emptyGrid();
  athletes
    .map((athlete) => ({
      athlete,
      sim: toSimAthlete(athlete)
    }))
    .filter(
      (entry): entry is { athlete: AthleteModel; sim: SimAthlete } =>
        entry.sim !== null
    )
    .forEach(({ athlete, sim }) => {
      placeAthlete(grid, rowForType(athlete.type), sim);
    });
  return grid;
};

const teamFromAthletes = (
  id: number,
  name: string,
  athletes: AthleteModel[]
): TeamDTO => {
  const dto = new TeamDTO();
  dto.id = id;
  dto.name = name;
  dto.athlethes = athletes
    .map(toSimAthlete)
    .filter((value): value is SimAthlete => value !== null);
  dto.athletesPositions = buildPositions(athletes);
  return dto;
};

const loadPlayerTeam = async (
  userId: number
): Promise<{ team: Team; athletes: AthleteModel[] }> => {
  const team = await Team.findOne({
    where: { user_id: userId },
    order: [['id', 'ASC']],
    include: [{ association: 'athletes', required: false }]
  });

  if (!team) {
    throw new PartidaServiceError(
      'TEAM_NOT_FOUND',
      'Voce precisa de um time para simular uma partida.'
    );
  }

  const athletes = ((team.get('athletes') as AthleteModel[] | undefined) ?? []).filter(
    (athlete): athlete is AthleteModel => athlete !== null && athlete !== undefined
  );

  if (athletes.length === 0) {
    throw new PartidaServiceError(
      'TEAM_EMPTY',
      'Seu time nao possui atletas; contrate antes de jogar.'
    );
  }

  return { team, athletes };
};

const loadOpponentAthletes = async (
  excludeIds: number[]
): Promise<AthleteModel[]> => {
  const candidates = await AthleteModel.findAll({
    where:
      excludeIds.length > 0
        ? {
            id: {
              [Op.notIn]: excludeIds
            }
          }
        : {},
    order: sequelize.random(),
    limit: OPPONENT_TEAM_SIZE
  });

  if (candidates.length === 0) {
    throw new PartidaServiceError(
      'NO_OPPONENT_POOL',
      'Nao ha atletas suficientes para gerar um adversario.'
    );
  }

  return candidates;
};

const persistResult = async (
  team: Team,
  match: MatchResult
): Promise<{ teamId: number; victory: number; lose: number }> => {
  return sequelize.transaction(async (transaction) => {
    if (match.winner === 'player') {
      team.victory = (team.victory ?? 0) + 1;
    } else if (match.winner === 'opponent') {
      team.lose = (team.lose ?? 0) + 1;
    }
    team.round = (team.round ?? 1) + 1;
    await team.save({ transaction });
    return {
      teamId: team.id,
      victory: team.victory,
      lose: team.lose
    };
  });
};

/**
 * Orquestra a Task 4.1: carrega o time do usuario, gera um adversario
 * com atletas aleatorios do mercado e delega a simulacao para o motor
 * (Task 4.2). Persiste vitoria/derrota no Team e devolve o resultado
 * completo para a rota.
 */
export const simulateMatch = async (
  userId: number,
  options?: SimulationOptions
): Promise<SimulateMatchResult> => {
  const { team: playerTeamRow, athletes: playerAthletes } = await loadPlayerTeam(userId);

  const ownedIds = await TeamAthlete.findAll({
    attributes: ['athlete_id']
  });
  const excludeIds = ownedIds.map((entry) => entry.athlete_id);
  const opponentAthletes = await loadOpponentAthletes(excludeIds);

  const playerDto = teamFromAthletes(
    playerTeamRow.id,
    playerTeamRow.name,
    playerAthletes
  );
  playerDto.turn = playerTeamRow.round;
  playerDto.victorys = playerTeamRow.victory;
  playerDto.loses = playerTeamRow.lose;

  const opponentDto = teamFromAthletes(
    0,
    'Bot Adversario',
    opponentAthletes
  );

  const result = processarRodada(playerDto, opponentDto, options);
  const persisted = await persistResult(playerTeamRow, result);

  return {
    ...result,
    persisted
  };
};
