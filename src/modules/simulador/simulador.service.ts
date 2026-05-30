import { retreatOnPossessionLoss } from './movement';
import { strategyForBallRow } from './strategies';
import {
  Athlete,
  type BallRow,
  type DisputeOutcome,
  type MatchResult,
  type MatchWinner,
  type Possession,
  type RandomFn,
  type SimulationOptions,
  TeamDTO,
  type TurnEvent
} from './types';

/**
 * RN008: a partida dura no maximo 12 turnos automaticos. A rodada pode encerrar
 * antes por gol (RN007). Constante usada como default, sobrescrita apenas em testes.
 */
export const TOTAL_TURNS = 12;

const defaultRandom: RandomFn = Math.random;

const cloneTeam = (team: TeamDTO): TeamDTO => JSON.parse(JSON.stringify(team)) as TeamDTO;

const pickRandom = <T>(items: T[], rng: RandomFn): T | undefined => {
  if (items.length === 0) {
    return undefined;
  }
  return items[Math.floor(rng() * items.length)];
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

const togglePossession = (possession: Possession): Possession =>
  possession === 'player' ? 'opponent' : 'player';

const describeDispute = (
  strategyName: string,
  attacker: Athlete,
  defender: Athlete | undefined,
  outcome: DisputeOutcome,
  goal: boolean
): string => {
  const chance = Math.round(outcome.successChance * 100);
  const roll = outcome.roll.toFixed(2);
  const marker = defender
    ? `${defender.name} (${outcome.defenderAttribute})`
    : 'sem marcacao';
  const tail = `${strategyName}, ${chance}% chance, sorteio ${roll}`;
  if (goal) {
    return `GOL! ${attacker.name} (${outcome.attackerAttribute}) vence ${marker} — ${tail}.`;
  }
  if (outcome.success) {
    return `${attacker.name} (${outcome.attackerAttribute}) supera ${marker} — ${tail}.`;
  }
  return `${marker} interrompe ${attacker.name} (${outcome.attackerAttribute}) — ${tail}.`;
};

/**
 * Motor de simulacao de partida (Tasks 4.2 + 4.5).
 *
 * Executa ate TOTAL_TURNS turnos consecutivos (RN008) entre o time do jogador e
 * um adversario, resolvendo cada disputa por uma Strategy (RN012) que considera
 * os buffs de itens, recuando o atleta vencido em ataque (RN011, salvo habilidade
 * especial) e encerrando IMEDIATAMENTE a rodada quando ha gol (RN003/RN004/RN007).
 * Se nenhum gol sai em 12 turnos, a rodada termina empatada 0x0 (RN005).
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

  let possession: Possession =
    options.initialPossession ?? (rng() < 0.5 ? 'player' : 'opponent');
  let ballRow: BallRow = 0;
  let turnsPlayed = 0;

  for (let turn = 1; turn <= totalTurns; turn++) {
    turnsPlayed = turn;

    const attackingTeam = possession === 'player' ? player : opponent;
    const defendingTeam = possession === 'player' ? opponent : player;

    let attackers = getRowAthletes(attackingTeam, ballRow);
    if (attackers.length === 0) {
      attackers = collectAllPositioned(attackingTeam);
    }

    if (attackers.length === 0) {
      events.push({
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
      });
      possession = togglePossession(possession);
      ballRow = 0;
      continue;
    }

    const attacker = pickRandom(attackers, rng)!;

    const defendersInRow = getRowAthletes(defendingTeam, ballRow);
    const defenders =
      defendersInRow.length > 0 ? defendersInRow : collectAllPositioned(defendingTeam);
    const defender = pickRandom(defenders, rng);

    const strategy = strategyForBallRow(ballRow);
    const outcome = strategy.resolve(attacker, defender, rng);

    const baseEvent = {
      turn,
      possession,
      ballRow,
      attackerTeamId: attackingTeam.id,
      defenderTeamId: defendingTeam.id,
      attackerId: attacker.id,
      attackerName: attacker.name,
      defenderId: defender?.id ?? null,
      defenderName: defender?.name ?? null,
      attackerRoll: outcome.attackerAttribute,
      defenderRoll: outcome.defenderAttribute
    };

    if (outcome.goal) {
      // RN003 / RN004: vencer a ultima linha computa um gol.
      if (possession === 'player') {
        score.player += 1;
      } else {
        score.opponent += 1;
      }
      events.push({
        ...baseEvent,
        kind: 'shot',
        success: true,
        goal: true,
        description: describeDispute(strategy.name, attacker, defender, outcome, true)
      });
      // RN007: o gol encerra a rodada imediatamente.
      break;
    }

    if (outcome.success) {
      // A bola avanca uma linha mantendo a posse.
      events.push({
        ...baseEvent,
        kind: strategy.successKind,
        success: true,
        goal: false,
        description: describeDispute(strategy.name, attacker, defender, outcome, false)
      });
      ballRow = Math.min(ballRow + 1, 2) as BallRow;
      continue;
    }

    // Defesa vence — perda de posse.
    events.push({
      ...baseEvent,
      kind: 'tackle',
      success: false,
      goal: false,
      description: describeDispute(strategy.name, attacker, defender, outcome, false)
    });

    // RN011: perda na linha de ataque recua o atleta, salvo habilidade especial.
    retreatOnPossessionLoss(attackingTeam, attacker, ballRow);

    possession = togglePossession(possession);
    ballRow = 0;
  }

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
    // RN005: nenhum gol em 12 turnos => empate 0x0.
    winner = 'draw';
  }

  return {
    player,
    opponent,
    score,
    winner,
    totalTurns: turnsPlayed,
    events
  };
};

/**
 * Wrapper orientado a objetos.
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
