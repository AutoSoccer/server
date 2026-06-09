import {
  computeSuccessChance,
  effectiveAttribute,
  type SimAttribute
} from './formula';
import { SimuladorServiceError } from './simulador.errors';
import {
  Athlete,
  type BallRow,
  type BallState,
  type DisputeOutcome,
  type FieldColumn,
  type FieldMovement,
  type FieldPosition,
  type InitiativeResult,
  type MatchResult,
  type MatchWinner,
  type Possession,
  type RandomFn,
  type SimulationOptions,
  TeamDTO,
  type TurnEvent
} from './types';

export const TOTAL_TURNS = 12;

const FIELD_COLUMNS = 3;
const FIELD_ROWS = 6;
const defaultRandom: RandomFn = Math.random;

type FieldAthlete = {
  team: Possession;
  athlete: Athlete;
  position: FieldPosition;
};

type FieldState = Record<Possession, FieldAthlete[]>;

const cloneTeam = (team: TeamDTO): TeamDTO =>
  JSON.parse(JSON.stringify(team)) as TeamDTO;

const directionFor = (team: Possession): 1 | -1 =>
  team === 'player' ? 1 : -1;

const goalRowFor = (team: Possession): BallRow =>
  team === 'player' ? 5 : 0;

const opponentOf = (team: Possession): Possession =>
  team === 'player' ? 'opponent' : 'player';

const toPosition = (x: number, y: number): FieldPosition => ({
  x: x as FieldColumn,
  y: y as BallRow
});

const isInsideField = (x: number, y: number): boolean =>
  x >= 0 && x < FIELD_COLUMNS && y >= 0 && y < FIELD_ROWS;

const samePosition = (left: FieldPosition, right: FieldPosition): boolean =>
  left.x === right.x && left.y === right.y;

const distanceBetween = (
  left: FieldPosition,
  right: FieldPosition
): number =>
  Math.max(
    Math.abs(left.x - right.x),
    Math.abs(left.y - right.y)
  );

const buildFieldTeam = (
  team: TeamDTO,
  side: Possession
): FieldAthlete[] => {
  const athletes: FieldAthlete[] = [];

  team.athletesPositions.forEach((row, rowIndex) => {
    row.forEach((athlete, columnIndex) => {
      if (!athlete) {
        return;
      }

      athlete.type =
        athlete.type ??
        (rowIndex === 0
          ? 'defender'
          : rowIndex === 2
            ? 'attacker'
            : 'midfielder');

      athletes.push({
        team: side,
        athlete,
        position: toPosition(
          columnIndex,
          side === 'player' ? rowIndex : FIELD_ROWS - 1 - rowIndex
        )
      });
    });
  });

  return athletes;
};

const buildField = (player: TeamDTO, opponent: TeamDTO): FieldState => ({
  player: buildFieldTeam(player, 'player'),
  opponent: buildFieldTeam(opponent, 'opponent')
});

const frontLineAthletes = (
  athletes: FieldAthlete[],
  side: Possession
): FieldAthlete[] => {
  if (athletes.length === 0) {
    return [];
  }

  const frontRow = athletes.reduce(
    (current, entry) =>
      side === 'player'
        ? Math.max(current, entry.position.y)
        : Math.min(current, entry.position.y),
    side === 'player' ? -Infinity : Infinity
  );

  return athletes.filter((entry) => entry.position.y === frontRow);
};

const velocityOf = (entry: FieldAthlete): number =>
  effectiveAttribute(entry.athlete, 'velocity');

const strongestByVelocity = (athletes: FieldAthlete[]): FieldAthlete => {
  const ordered = [...athletes].sort((left, right) => {
    const velocityDelta = velocityOf(right) - velocityOf(left);
    if (velocityDelta !== 0) {
      return velocityDelta;
    }
    const attackDelta =
      effectiveAttribute(right.athlete, 'attack') -
      effectiveAttribute(left.athlete, 'attack');
    if (attackDelta !== 0) {
      return attackDelta;
    }
    return left.athlete.id - right.athlete.id;
  });

  const selected = ordered[0];
  if (!selected) {
    throw new SimuladorServiceError(
      'NO_RECEIVER_AVAILABLE',
      'Nao ha atletas disponiveis para receber a bola.'
    );
  }
  return selected;
};

const ballFor = (entry: FieldAthlete): BallState => ({
  team: entry.team,
  athleteId: entry.athlete.id,
  athleteName: entry.athlete.name,
  position: { ...entry.position }
});

export const computeInitiative = (
  player: TeamDTO,
  opponent: TeamDTO,
  rng: RandomFn = defaultRandom
): InitiativeResult => {
  const field = buildField(player, opponent);
  const playerFront = frontLineAthletes(field.player, 'player');
  const opponentFront = frontLineAthletes(field.opponent, 'opponent');
  const playerVelocity = playerFront.reduce(
    (total, entry) => total + velocityOf(entry),
    0
  );
  const opponentVelocity = opponentFront.reduce(
    (total, entry) => total + velocityOf(entry),
    0
  );

  let startsWith: Possession;
  if (playerVelocity > opponentVelocity) {
    startsWith = 'player';
  } else if (opponentVelocity > playerVelocity) {
    startsWith = 'opponent';
  } else {
    startsWith = rng() < 0.5 ? 'player' : 'opponent';
  }

  const carrier = strongestByVelocity(
    startsWith === 'player' ? playerFront : opponentFront
  );

  return {
    playerLeadVelocity: playerVelocity,
    opponentLeadVelocity: opponentVelocity,
    startsWith,
    carrier: ballFor(carrier)
  };
};

const athleteAt = (
  athletes: FieldAthlete[],
  position: FieldPosition
): FieldAthlete | undefined =>
  athletes.find((entry) => samePosition(entry.position, position));

const fieldAthleteById = (
  field: FieldState,
  side: Possession,
  athleteId: number
): FieldAthlete | undefined =>
  field[side].find((entry) => entry.athlete.id === athleteId);

const resolveAttributeContest = (
  attacker: Athlete,
  attackerAttribute: SimAttribute,
  defender: Athlete | undefined,
  defenderAttribute: SimAttribute,
  rng: RandomFn
): DisputeOutcome => {
  const attackValue = effectiveAttribute(attacker, attackerAttribute);
  const defenseValue = effectiveAttribute(defender, defenderAttribute);
  const successChance = computeSuccessChance(attackValue, defenseValue);
  const roll = rng();
  const success = roll < successChance;

  return {
    attackerAttribute: attackValue,
    defenderAttribute: defenseValue,
    successChance,
    roll,
    success,
    goal: false
  };
};

const moveAthlete = (
  entry: FieldAthlete,
  destination: FieldPosition
): FieldMovement => {
  const movement: FieldMovement = {
    team: entry.team,
    athleteId: entry.athlete.id,
    from: { ...entry.position },
    to: { ...destination }
  };
  entry.position = { ...destination };
  return movement;
};

const opponentResistanceAt = (
  field: FieldState,
  side: Possession,
  position: FieldPosition
): number => {
  const defender = athleteAt(field[opponentOf(side)], position);
  return defender
    ? effectiveAttribute(defender.athlete, 'defense')
    : 0;
};

const bestMovementOption = (
  field: FieldState,
  side: Possession,
  positions: FieldPosition[]
): FieldPosition | null => {
  const available = positions.filter(
    (position) => !athleteAt(field[side], position)
  );
  if (available.length === 0) {
    return null;
  }

  return [...available].sort((left, right) => {
    const resistanceDelta =
      opponentResistanceAt(field, side, left) -
      opponentResistanceAt(field, side, right);
    if (resistanceDelta !== 0) {
      return resistanceDelta;
    }
    const centerDelta =
      Math.abs(left.x - 1) - Math.abs(right.x - 1);
    if (centerDelta !== 0) {
      return centerDelta;
    }
    return left.x - right.x;
  })[0];
};

const chooseMovementTarget = (
  field: FieldState,
  carrier: FieldAthlete
): FieldPosition | null => {
  const direction = directionFor(carrier.team);
  const forwardY = carrier.position.y + direction;
  if (!isInsideField(carrier.position.x, forwardY)) {
    return null;
  }

  const straight = toPosition(carrier.position.x, forwardY);
  if (!athleteAt(field[carrier.team], straight)) {
    return straight;
  }

  const diagonals = [-1, 1]
    .map((offset) => ({
      x: carrier.position.x + offset,
      y: forwardY
    }))
    .filter(({ x, y }) => isInsideField(x, y))
    .map(({ x, y }) => toPosition(x, y));
  const diagonal = bestMovementOption(field, carrier.team, diagonals);
  if (diagonal) {
    return diagonal;
  }

  const lateral = [-1, 1]
    .map((offset) => ({
      x: carrier.position.x + offset,
      y: carrier.position.y
    }))
    .filter(({ x, y }) => isInsideField(x, y))
    .map(({ x, y }) => toPosition(x, y));

  return bestMovementOption(field, carrier.team, lateral);
};

const passPriority = (
  carrier: FieldAthlete,
  target: FieldAthlete
): { category: number; distance: number } | null => {
  const direction = directionFor(carrier.team);
  const forwardDistance =
    (target.position.y - carrier.position.y) * direction;
  const lateralDistance = Math.abs(target.position.x - carrier.position.x);

  if (forwardDistance > 0 && lateralDistance === 0) {
    return {
      category: 0,
      distance: forwardDistance
    };
  }

  if (forwardDistance > 0 && lateralDistance > 0) {
    return {
      category: 1,
      distance: Math.max(forwardDistance, lateralDistance)
    };
  }

  if (forwardDistance === 0 && lateralDistance > 0) {
    return {
      category: 2,
      distance: lateralDistance
    };
  }

  return null;
};

const choosePassTarget = (
  field: FieldState,
  carrier: FieldAthlete
): FieldAthlete | null => {
  const teammates = field[carrier.team].filter(
    (entry) => entry.athlete.id !== carrier.athlete.id
  );
  const attackers = teammates.filter(
    (entry) => entry.athlete.type === 'attacker'
  );
  const pool = attackers.length > 0 ? attackers : teammates;

  const ranked = pool
    .map((entry) => ({
      entry,
      priority: passPriority(carrier, entry)
    }))
    .filter(
      (
        candidate
      ): candidate is {
        entry: FieldAthlete;
        priority: { category: number; distance: number };
      } => candidate.priority !== null
    )
    .sort((left, right) => {
      const categoryDelta =
        left.priority.category - right.priority.category;
      if (categoryDelta !== 0) {
        return categoryDelta;
      }
      const distanceDelta =
        left.priority.distance - right.priority.distance;
      if (distanceDelta !== 0) {
        return distanceDelta;
      }
      const velocityDelta =
        velocityOf(right.entry) - velocityOf(left.entry);
      if (velocityDelta !== 0) {
        return velocityDelta;
      }
      return left.entry.athlete.id - right.entry.athlete.id;
    });

  return ranked[0]?.entry ?? null;
};

const nearestOpponents = (
  field: FieldState,
  side: Possession,
  position: FieldPosition
): FieldAthlete[] => {
  const opponents = field[opponentOf(side)];
  if (opponents.length === 0) {
    return [];
  }

  const nearestDistance = Math.min(
    ...opponents.map((entry) =>
      distanceBetween(entry.position, position)
    )
  );
  return opponents.filter(
    (entry) =>
      distanceBetween(entry.position, position) === nearestDistance
  );
};

const strongestInterceptor = (
  candidates: FieldAthlete[]
): FieldAthlete | undefined =>
  [...candidates].sort((left, right) => {
    const velocityDelta = velocityOf(right) - velocityOf(left);
    if (velocityDelta !== 0) {
      return velocityDelta;
    }
    return left.athlete.id - right.athlete.id;
  })[0];

const randomCandidate = (
  candidates: FieldAthlete[],
  rng: RandomFn
): FieldAthlete | undefined => {
  if (candidates.length === 0) {
    return undefined;
  }
  if (candidates.length === 1) {
    return candidates[0];
  }
  const index = Math.min(
    candidates.length - 1,
    Math.floor(rng() * candidates.length)
  );
  return candidates[index];
};

const retreatAfterLoss = (
  field: FieldState,
  carrier: FieldAthlete
): FieldMovement[] => {
  const defenseY = carrier.team === 'player' ? 0 : 5;
  if (
    carrier.athlete.holdsPosition ||
    carrier.position.y === defenseY
  ) {
    return [];
  }

  const columnOrder = [
    carrier.position.x,
    carrier.position.x - 1,
    carrier.position.x + 1,
    0,
    1,
    2
  ].filter(
    (column, index, all) =>
      column >= 0 &&
      column < FIELD_COLUMNS &&
      all.indexOf(column) === index
  );

  for (const column of columnOrder) {
    const destination = toPosition(column, defenseY);
    if (!athleteAt(field[carrier.team], destination)) {
      return [moveAthlete(carrier, destination)];
    }
  }

  return [];
};

const createEvent = (
  input: Omit<TurnEvent, 'ballRow'>
): TurnEvent => ({
  ...input,
  ballRow: input.ball.position.y
});

const executePass = (
  turn: number,
  field: FieldState,
  carrier: FieldAthlete,
  receiver: FieldAthlete,
  rng: RandomFn,
  teamIds: Record<Possession, number>
): TurnEvent => {
  const interceptor = strongestInterceptor(
    nearestOpponents(field, carrier.team, receiver.position)
  );

  if (!interceptor) {
    const ball = ballFor(receiver);
    return createEvent({
      turn,
      possession: carrier.team,
      kind: 'pass',
      attackerTeamId: teamIds[carrier.team],
      defenderTeamId: teamIds[opponentOf(carrier.team)],
      attackerId: receiver.athlete.id,
      attackerName: receiver.athlete.name,
      defenderId: null,
      defenderName: null,
      attackerRoll: velocityOf(receiver),
      defenderRoll: 0,
      successChance: 1,
      randomRoll: 0,
      success: true,
      goal: false,
      movements: [],
      ball,
      description: `${carrier.athlete.name} passa para ${receiver.athlete.name}, sem marcacao proxima.`
    });
  }

  const outcome = resolveAttributeContest(
    receiver.athlete,
    'velocity',
    interceptor.athlete,
    'velocity',
    rng
  );
  const ball = outcome.success
    ? ballFor(receiver)
    : ballFor(interceptor);
  const chance = Math.round(outcome.successChance * 100);

  return createEvent({
    turn,
    possession: carrier.team,
    kind: 'pass',
    attackerTeamId: teamIds[carrier.team],
    defenderTeamId: teamIds[opponentOf(carrier.team)],
    attackerId: receiver.athlete.id,
    attackerName: receiver.athlete.name,
    defenderId: interceptor.athlete.id,
    defenderName: interceptor.athlete.name,
    attackerRoll: outcome.attackerAttribute,
    defenderRoll: outcome.defenderAttribute,
    successChance: outcome.successChance,
    randomRoll: outcome.roll,
    success: outcome.success,
    goal: false,
    movements: [],
    ball,
    description: outcome.success
      ? `${carrier.athlete.name} encontra ${receiver.athlete.name}; ele supera ${interceptor.athlete.name} na velocidade (${chance}%).`
      : `${interceptor.athlete.name} antecipa o passe para ${receiver.athlete.name} e toma a bola (${chance}% para o receptor).`
  });
};

const executeMovement = (
  turn: number,
  field: FieldState,
  carrier: FieldAthlete,
  destination: FieldPosition,
  rng: RandomFn,
  teamIds: Record<Possession, number>
): TurnEvent => {
  const defender = athleteAt(field[opponentOf(carrier.team)], destination);

  if (!defender) {
    const movements = [moveAthlete(carrier, destination)];
    const ball = ballFor(carrier);
    return createEvent({
      turn,
      possession: carrier.team,
      kind: 'move',
      attackerTeamId: teamIds[carrier.team],
      defenderTeamId: teamIds[opponentOf(carrier.team)],
      attackerId: carrier.athlete.id,
      attackerName: carrier.athlete.name,
      defenderId: null,
      defenderName: null,
      attackerRoll: 0,
      defenderRoll: 0,
      successChance: 1,
      randomRoll: 0,
      success: true,
      goal: false,
      movements,
      ball,
      description: `${carrier.athlete.name} avanca com a bola para (${destination.x}, ${destination.y}).`
    });
  }

  const outcome = resolveAttributeContest(
    carrier.athlete,
    'attack',
    defender.athlete,
    'defense',
    rng
  );
  const movements = outcome.success
    ? [moveAthlete(carrier, destination)]
    : retreatAfterLoss(field, carrier);
  const ball = outcome.success
    ? ballFor(carrier)
    : ballFor(defender);
  const chance = Math.round(outcome.successChance * 100);

  return createEvent({
    turn,
    possession: carrier.team,
    kind: 'tackle',
    attackerTeamId: teamIds[carrier.team],
    defenderTeamId: teamIds[opponentOf(carrier.team)],
    attackerId: carrier.athlete.id,
    attackerName: carrier.athlete.name,
    defenderId: defender.athlete.id,
    defenderName: defender.athlete.name,
    attackerRoll: outcome.attackerAttribute,
    defenderRoll: outcome.defenderAttribute,
    successChance: outcome.successChance,
    randomRoll: outcome.roll,
    success: outcome.success,
    goal: false,
    movements,
    ball,
    description: outcome.success
      ? `${carrier.athlete.name} vence ${defender.athlete.name} no ataque contra defesa (${chance}%) e segue com a bola.`
      : `${defender.athlete.name} vence ${carrier.athlete.name} no ataque contra defesa e toma a bola (${chance}% para o atacante).`
  });
};

const executeShot = (
  turn: number,
  field: FieldState,
  carrier: FieldAthlete,
  rng: RandomFn,
  teamIds: Record<Possession, number>
): TurnEvent => {
  const attack = effectiveAttribute(carrier.athlete, 'attack');
  const chance = Math.max(0, Math.min(1, attack / 100));
  const roll = rng();
  const goal = roll < chance;
  const rebound = goal
    ? undefined
    : randomCandidate(
        nearestOpponents(field, carrier.team, carrier.position),
        rng
      );
  const ball = rebound ? ballFor(rebound) : ballFor(carrier);

  return createEvent({
    turn,
    possession: carrier.team,
    kind: 'shot',
    attackerTeamId: teamIds[carrier.team],
    defenderTeamId: teamIds[opponentOf(carrier.team)],
    attackerId: carrier.athlete.id,
    attackerName: carrier.athlete.name,
    defenderId: rebound?.athlete.id ?? null,
    defenderName: rebound?.athlete.name ?? null,
    attackerRoll: attack,
    defenderRoll: Math.max(0, 100 - attack),
    successChance: chance,
    randomRoll: roll,
    success: goal,
    goal,
    movements: [],
    ball,
    description: goal
      ? `GOL! ${carrier.athlete.name} finaliza com ${Math.round(chance * 100)}% de chance.`
      : `${carrier.athlete.name} perde a finalizacao; ${rebound?.athlete.name ?? 'o adversario'} fica com a bola.`
  });
};

const noSpaceEvent = (
  turn: number,
  carrier: FieldAthlete,
  teamIds: Record<Possession, number>
): TurnEvent =>
  createEvent({
    turn,
    possession: carrier.team,
    kind: 'move',
    attackerTeamId: teamIds[carrier.team],
    defenderTeamId: teamIds[opponentOf(carrier.team)],
    attackerId: carrier.athlete.id,
    attackerName: carrier.athlete.name,
    defenderId: null,
    defenderName: null,
    attackerRoll: 0,
    defenderRoll: 0,
    successChance: 0,
    randomRoll: 0,
    success: false,
    goal: false,
    movements: [],
    ball: ballFor(carrier),
    description: `${carrier.athlete.name} nao encontra espaco para avancar.`
  });

export const processarRodada = (
  equipePlayer: TeamDTO,
  equipeOponente: TeamDTO,
  options: SimulationOptions = {}
): MatchResult => {
  const rng = options.rng ?? defaultRandom;
  const totalTurns = options.totalTurns ?? TOTAL_TURNS;

  if (!Number.isInteger(totalTurns) || totalTurns <= 0) {
    throw new SimuladorServiceError(
      'INVALID_TOTAL_TURNS',
      'totalTurns deve ser inteiro positivo.'
    );
  }

  const player = cloneTeam(equipePlayer);
  const opponent = cloneTeam(equipeOponente);
  const field = buildField(player, opponent);
  const calculatedInitiative = options.initialPossession
    ? null
    : computeInitiative(player, opponent, rng);
  const initialSide =
    options.initialPossession ?? calculatedInitiative!.startsWith;
  const initialCarrier =
    (options.initialCarrierId
      ? fieldAthleteById(field, initialSide, options.initialCarrierId)
      : undefined) ??
    strongestByVelocity(frontLineAthletes(field[initialSide], initialSide));
  let ball = ballFor(initialCarrier);

  const initialBall = {
    ...ball,
    position: { ...ball.position }
  };
  const events: TurnEvent[] = [];
  const score = { player: 0, opponent: 0 };
  const teamIds: Record<Possession, number> = {
    player: player.id,
    opponent: opponent.id
  };

  for (let turn = 1; turn <= totalTurns; turn += 1) {
    const carrier = fieldAthleteById(
      field,
      ball.team,
      ball.athleteId
    );
    if (!carrier) {
      throw new SimuladorServiceError(
        'BALL_HOLDER_NOT_FOUND',
        `Portador da bola ${ball.athleteId} nao encontrado.`
      );
    }

    let event: TurnEvent;
    if (carrier.athlete.type !== 'attacker') {
      const receiver = choosePassTarget(field, carrier);
      if (receiver) {
        event = executePass(
          turn,
          field,
          carrier,
          receiver,
          rng,
          teamIds
        );
      } else if (carrier.position.y === goalRowFor(carrier.team)) {
        event = executeShot(turn, field, carrier, rng, teamIds);
      } else {
        const destination = chooseMovementTarget(field, carrier);
        event = destination
          ? executeMovement(
              turn,
              field,
              carrier,
              destination,
              rng,
              teamIds
            )
          : noSpaceEvent(turn, carrier, teamIds);
      }
    } else if (carrier.position.y === goalRowFor(carrier.team)) {
      event = executeShot(turn, field, carrier, rng, teamIds);
    } else {
      const destination = chooseMovementTarget(field, carrier);
      event = destination
        ? executeMovement(
            turn,
            field,
            carrier,
            destination,
            rng,
            teamIds
          )
        : noSpaceEvent(turn, carrier, teamIds);
    }

    events.push(event);
    ball = event.ball;

    if (event.goal) {
      score[event.possession] += 1;
      break;
    }
  }

  const turnsPlayed = events.length;
  player.turn = turnsPlayed;
  opponent.turn = turnsPlayed;

  let winner: MatchWinner;
  if (score.player > score.opponent) {
    winner = 'player';
    player.victorys += 1;
    opponent.loses += 1;
  } else if (score.opponent > score.player) {
    winner = 'opponent';
    opponent.victorys += 1;
    player.loses += 1;
  } else {
    winner = 'draw';
  }

  return {
    player,
    opponent,
    score,
    winner,
    totalTurns: turnsPlayed,
    initialBall,
    events
  };
};

export class Simulador {
  static processarRodada(
    equipePlayer: TeamDTO,
    equipeOponente: TeamDTO,
    options?: SimulationOptions
  ): MatchResult {
    return processarRodada(equipePlayer, equipeOponente, options);
  }
}
