import {
  Athlete,
  type BallRow,
  type MatchResult,
  type MatchWinner,
  type Possession,
  type RandomFn,
  type SimulationOptions,
  TeamDTO,
  type TurnEvent
} from './types';

/**
 * RN008: a partida deve durar exatamente 12 turnos automaticos.
 * Esta constante e usada como default e pode ser sobrescrita apenas em
 * cenarios de teste atraves de SimulationOptions.totalTurns.
 */
export const TOTAL_TURNS = 12;

const ATTRIBUTE_WEIGHT = 0.6;
const ROLL_WINDOW = 40;

const defaultRandom: RandomFn = Math.random;

const cloneTeam = (team: TeamDTO): TeamDTO =>
  JSON.parse(JSON.stringify(team)) as TeamDTO;

const rollFor = (value: number, rng: RandomFn): number =>
  value * ATTRIBUTE_WEIGHT + rng() * ROLL_WINDOW;

const pickRandom = <T>(items: T[], rng: RandomFn): T | undefined => {
  if (items.length === 0) {
    return undefined;
  }
  const index = Math.floor(rng() * items.length);
  return items[index];
};

const getRowAthletes = (team: TeamDTO, row: number): Athlete[] => {
  const cols = team.athletesPositions[row];
  if (!cols) {
    return [];
  }
  return cols.filter((entry): entry is Athlete => entry !== null);
};

const collectAllPositioned = (team: TeamDTO): Athlete[] => {
  const result: Athlete[] = [];
  for (const row of team.athletesPositions) {
    for (const entry of row) {
      if (entry !== null) {
        result.push(entry);
      }
    }
  }
  return result;
};

/**
 * RN011: ao perder a posse na linha de ataque, o atleta deve retornar
 * para uma vaga livre na linha de defesa do proprio time.
 */
const moveAthleteToDefense = (team: TeamDTO, athleteId: number): boolean => {
  for (let row = 0; row < team.athletesPositions.length; row++) {
    const cols = team.athletesPositions[row];
    for (let col = 0; col < cols.length; col++) {
      const entry = cols[col];
      if (entry && entry.id === athleteId && row !== 0) {
        const defenseRow = team.athletesPositions[0];
        const freeCol = defenseRow.findIndex((slot) => slot === null);
        if (freeCol === -1) {
          return false;
        }
        cols[col] = null;
        defenseRow[freeCol] = entry;
        return true;
      }
    }
  }
  return false;
};

const getAttribute = (athlete: Athlete | undefined, attr: keyof Athlete): number => {
  if (!athlete) {
    return 0;
  }
  const value = athlete[attr];
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  return 50;
};

const togglePossession = (possession: Possession): Possession =>
  possession === 'player' ? 'opponent' : 'player';

const buildEvent = (base: Omit<TurnEvent, 'description'> & { description?: string }): TurnEvent => ({
  ...base,
  description: base.description ?? ''
});

/**
 * Motor de simulacao de partida (Task 4.2).
 *
 * Executa estruturalmente TOTAL_TURNS turnos consecutivos (RN008) entre o
 * time do jogador e um adversario, decidindo cada disputa via RNG +
 * atributos (RN012), atualizando o posicionamento do atleta vencido em
 * ataque para a defesa (RN011) e contabilizando gols quando a posse
 * vence a ultima linha adversaria (RN003 / RN004).
 */
export const processarRodada = (
  equipePlayer: TeamDTO,
  equipeOponente: TeamDTO,
  options: SimulationOptions = {}
): MatchResult => {
  const rng = options.rng ?? defaultRandom;
  const totalTurns = options.totalTurns ?? TOTAL_TURNS;

  if (!Number.isInteger(totalTurns) || totalTurns <= 0) {
    throw new Error('totalTurns deve ser inteiro positivo.');
  }

  const player = cloneTeam(equipePlayer);
  const opponent = cloneTeam(equipeOponente);

  const events: TurnEvent[] = [];
  const score = { player: 0, opponent: 0 };

  let possession: Possession = rng() < 0.5 ? 'player' : 'opponent';
  let ballRow: BallRow = 0;

  for (let turn = 1; turn <= totalTurns; turn++) {
    const attackingTeam = possession === 'player' ? player : opponent;
    const defendingTeam = possession === 'player' ? opponent : player;

    let attackers = getRowAthletes(attackingTeam, ballRow);
    if (attackers.length === 0) {
      attackers = collectAllPositioned(attackingTeam);
    }

    if (attackers.length === 0) {
      events.push(
        buildEvent({
          turn,
          possession,
          ballRow,
          kind: 'turnover',
          attackerTeamId: attackingTeam.id,
          defenderTeamId: defendingTeam.id,
          attackerId: null,
          attackerName: null,
          defenderId: null,
          defenderName: null,
          attackerRoll: 0,
          defenderRoll: 0,
          success: false,
          goal: false,
          description: `${attackingTeam.name} sem atletas em campo; posse para ${defendingTeam.name}.`
        })
      );
      possession = togglePossession(possession);
      ballRow = 0;
      continue;
    }

    const attacker = pickRandom(attackers, rng)!;

    const defenders =
      getRowAthletes(defendingTeam, ballRow).length > 0
        ? getRowAthletes(defendingTeam, ballRow)
        : collectAllPositioned(defendingTeam);

    const defender = pickRandom(defenders, rng);

    const isShot = ballRow === 2;
    const attackerAttr = getAttribute(attacker, isShot ? 'attack' : 'velocity');
    const defenderAttr = getAttribute(defender, 'defense');

    const attackerRoll = rollFor(attackerAttr, rng);
    const defenderRoll = defender ? rollFor(defenderAttr, rng) : 0;
    const attackerWins = attackerRoll > defenderRoll;

    if (attackerWins && isShot) {
      // RN003 / RN004: vencer a ultima linha adversaria computa um gol.
      if (possession === 'player') {
        score.player += 1;
      } else {
        score.opponent += 1;
      }

      events.push(
        buildEvent({
          turn,
          possession,
          ballRow,
          kind: 'shot',
          attackerTeamId: attackingTeam.id,
          defenderTeamId: defendingTeam.id,
          attackerId: attacker.id,
          attackerName: attacker.name,
          defenderId: defender?.id ?? null,
          defenderName: defender?.name ?? null,
          attackerRoll,
          defenderRoll,
          success: true,
          goal: true,
          description: `GOL! ${attacker.name} (${attackingTeam.name}) vence ${defender?.name ?? 'sem marcacao'} (${defendingTeam.name}).`
        })
      );

      // Reinicia jogada com a posse no adversario.
      possession = togglePossession(possession);
      ballRow = 0;
      continue;
    }

    if (attackerWins) {
      // RN011: a bola avanca uma linha mantendo a posse.
      events.push(
        buildEvent({
          turn,
          possession,
          ballRow,
          kind: 'pass',
          attackerTeamId: attackingTeam.id,
          defenderTeamId: defendingTeam.id,
          attackerId: attacker.id,
          attackerName: attacker.name,
          defenderId: defender?.id ?? null,
          defenderName: defender?.name ?? null,
          attackerRoll,
          defenderRoll,
          success: true,
          goal: false,
          description: `${attacker.name} (${attackingTeam.name}) avanca contra ${defender?.name ?? 'a marcacao'}.`
        })
      );
      ballRow = Math.min(ballRow + 1, 2) as BallRow;
      continue;
    }

    // Defesa vence — perda de posse.
    events.push(
      buildEvent({
        turn,
        possession,
        ballRow,
        kind: 'tackle',
        attackerTeamId: attackingTeam.id,
        defenderTeamId: defendingTeam.id,
        attackerId: attacker.id,
        attackerName: attacker.name,
        defenderId: defender?.id ?? null,
        defenderName: defender?.name ?? null,
        attackerRoll,
        defenderRoll,
        success: false,
        goal: false,
        description: `${defender?.name ?? 'A defesa'} (${defendingTeam.name}) intercepta ${attacker.name}.`
      })
    );

    // RN011: se a perda for na linha de ataque, o atleta retorna para a defesa.
    if (isShot) {
      moveAthleteToDefense(attackingTeam, attacker.id);
    }

    possession = togglePossession(possession);
    ballRow = 0;
  }

  player.turn = totalTurns;
  opponent.turn = totalTurns;

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
    totalTurns,
    events
  };
};

/**
 * Classe utilitaria para uso orientado a objetos quando preferir.
 *
 * @example
 *   const result = Simulador.processarRodada(player, opponent);
 */
export class Simulador {
  static processarRodada(
    equipePlayer: TeamDTO,
    equipeOponente: TeamDTO,
    options?: SimulationOptions
  ): MatchResult {
    return processarRodada(equipePlayer, equipeOponente, options);
  }
}
