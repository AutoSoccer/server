import { describe, expect, it } from 'vitest';

import { computeSuccessChance, effectiveAttribute } from './formula';
import {
  computeInitiative,
  processarRodada,
  TOTAL_TURNS
} from './simulador.service';
import {
  Athlete,
  type AthleteRole,
  type RandomFn,
  TeamDTO
} from './types';

const constant = (value: number): RandomFn => () => value;

const sequence = (values: number[]): RandomFn => {
  let index = 0;
  return () => values[index++ % values.length];
};

type Placement = {
  id: number;
  row: number;
  col: number;
  type: AthleteRole;
  velocity?: number;
  attack?: number;
  defense?: number;
};

const athlete = (placement: Placement): Athlete =>
  Object.assign(new Athlete(), {
    id: placement.id,
    name: `Atleta ${placement.id}`,
    type: placement.type,
    velocity: placement.velocity ?? 50,
    attack: placement.attack ?? 50,
    defense: placement.defense ?? 50
  });

const team = (
  id: number,
  name: string,
  placements: Placement[]
): TeamDTO => {
  const dto = new TeamDTO();
  dto.id = id;
  dto.name = name;

  for (const placement of placements) {
    dto.athletesPositions[placement.row][placement.col] =
      athlete(placement);
  }

  dto.athlethes = dto.athletesPositions
    .flat()
    .filter((entry): entry is Athlete => entry !== null);
  return dto;
};

const singleAttackerTeam = (
  id: number,
  attack = 50,
  velocity = 50,
  column = 1
): TeamDTO =>
  team(id, `Time ${id}`, [
    {
      id: id * 10 + 1,
      row: 2,
      col: column,
      type: 'attacker',
      attack,
      velocity,
      defense: 50
    }
  ]);

describe('computeSuccessChance', () => {
  it('usa a proporcao entre os dois atributos', () => {
    expect(computeSuccessChance(75, 25)).toBe(0.75);
    expect(computeSuccessChance(45, 45)).toBe(0.5);
  });

  it('mantem o resultado entre zero e um', () => {
    expect(computeSuccessChance(-10, 80)).toBe(0);
    expect(computeSuccessChance(80, -10)).toBe(1);
    expect(computeSuccessChance(0, 0)).toBe(0.5);
  });
});

describe('effectiveAttribute', () => {
  it('considera bonus de item sem aplicar bonus por posicao', () => {
    const entry = athlete({
      id: 1,
      row: 0,
      col: 0,
      type: 'defender',
      attack: 60
    });
    entry.bonus = { attack: 15 };

    expect(effectiveAttribute(entry, 'attack')).toBe(75);
  });
});

describe('computeInitiative', () => {
  it('soma a velocidade de todos os atletas da linha mais avancada', () => {
    const player = team(1, 'Player', [
      {
        id: 11,
        row: 2,
        col: 0,
        type: 'attacker',
        velocity: 45
      },
      {
        id: 12,
        row: 2,
        col: 2,
        type: 'attacker',
        velocity: 55
      }
    ]);
    const opponent = team(2, 'Opponent', [
      {
        id: 21,
        row: 2,
        col: 1,
        type: 'attacker',
        velocity: 90
      }
    ]);

    const initiative = computeInitiative(player, opponent, constant(0.9));

    expect(initiative.playerLeadVelocity).toBe(100);
    expect(initiative.opponentLeadVelocity).toBe(90);
    expect(initiative.startsWith).toBe('player');
    expect(initiative.carrier.athleteId).toBe(12);
  });

  it('usa a linha ocupada mais avancada e sorteia o empate', () => {
    const player = team(1, 'Player', [
      {
        id: 11,
        row: 1,
        col: 1,
        type: 'midfielder',
        velocity: 60
      }
    ]);
    const opponent = team(2, 'Opponent', [
      {
        id: 21,
        row: 1,
        col: 1,
        type: 'midfielder',
        velocity: 60
      }
    ]);

    expect(
      computeInitiative(player, opponent, constant(0.49)).startsWith
    ).toBe('player');
    expect(
      computeInitiative(player, opponent, constant(0.5)).startsWith
    ).toBe('opponent');
  });
});

describe('passes', () => {
  const passingTeam = () =>
    team(1, 'Player', [
      {
        id: 11,
        row: 0,
        col: 1,
        type: 'defender',
        velocity: 50
      },
      {
        id: 12,
        row: 2,
        col: 1,
        type: 'attacker',
        velocity: 80
      }
    ]);

  it('defensor passa para o atacante mais proximo e o passe atravessa linhas', () => {
    const opponent = singleAttackerTeam(2, 30, 40, 1);
    const result = processarRodada(passingTeam(), opponent, {
      totalTurns: 1,
      initialPossession: 'player',
      initialCarrierId: 11,
      rng: constant(0.5)
    });

    const event = result.events[0];
    expect(event.kind).toBe('pass');
    expect(event.success).toBe(true);
    expect(event.attackerId).toBe(12);
    expect(event.ball.team).toBe('player');
    expect(event.ball.athleteId).toBe(12);
  });

  it('o adversario mais proximo intercepta usando velocidade', () => {
    const opponent = singleAttackerTeam(2, 30, 90, 1);
    const result = processarRodada(passingTeam(), opponent, {
      totalTurns: 1,
      initialPossession: 'player',
      initialCarrierId: 11,
      rng: constant(0.9)
    });

    const event = result.events[0];
    expect(event.kind).toBe('pass');
    expect(event.success).toBe(false);
    expect(event.defenderId).toBe(21);
    expect(event.ball.team).toBe('opponent');
    expect(event.ball.athleteId).toBe(21);
  });
});

describe('movimento e disputa', () => {
  it('o portador avanca reto quando a casa esta livre', () => {
    const result = processarRodada(
      singleAttackerTeam(1),
      singleAttackerTeam(2, 50, 50, 0),
      {
        totalTurns: 1,
        initialPossession: 'player',
        rng: constant(0)
      }
    );

    const event = result.events[0];
    expect(event.kind).toBe('move');
    expect(event.movements[0]).toMatchObject({
      athleteId: 11,
      from: { x: 1, y: 2 },
      to: { x: 1, y: 3 }
    });
    expect(event.ball.position).toEqual({ x: 1, y: 3 });
  });

  it('a disputa normal usa ataque contra defesa', () => {
    const player = singleAttackerTeam(1, 75, 50, 1);
    const opponent = team(2, 'Opponent', [
      {
        id: 21,
        row: 2,
        col: 1,
        type: 'attacker',
        defense: 25
      }
    ]);
    const result = processarRodada(player, opponent, {
      totalTurns: 1,
      initialPossession: 'player',
      rng: constant(0.7)
    });

    const event = result.events[0];
    expect(event.kind).toBe('tackle');
    expect(event.successChance).toBe(0.75);
    expect(event.success).toBe(true);
    expect(event.ball.team).toBe('player');
  });

  it('ao perder a disputa no ataque, perde a posse e recua para a defesa', () => {
    const player = singleAttackerTeam(1, 25, 50, 1);
    const opponent = team(2, 'Opponent', [
      {
        id: 21,
        row: 2,
        col: 1,
        type: 'attacker',
        defense: 75
      }
    ]);
    const result = processarRodada(player, opponent, {
      totalTurns: 1,
      initialPossession: 'player',
      rng: constant(0.9)
    });

    const event = result.events[0];
    expect(event.success).toBe(false);
    expect(event.ball.team).toBe('opponent');
    expect(event.ball.athleteId).toBe(21);
    expect(event.movements[0]).toMatchObject({
      athleteId: 11,
      from: { x: 1, y: 2 },
      to: { x: 1, y: 0 }
    });
  });

  it('tambem recua quando a disputa perdida comeca no meio-campo', () => {
    const player = team(1, 'Player', [
      {
        id: 11,
        row: 1,
        col: 1,
        type: 'attacker',
        attack: 25,
        defense: 75
      }
    ]);
    const opponent = team(2, 'Opponent', [
      {
        id: 21,
        row: 2,
        col: 1,
        type: 'attacker',
        attack: 25,
        defense: 75
      }
    ]);
    opponent.athlethes[0].holdsPosition = true;
    const result = processarRodada(player, opponent, {
      totalTurns: 3,
      initialPossession: 'opponent',
      rng: sequence([0.9, 0.9])
    });

    const event = result.events[2];
    expect(event.success).toBe(false);
    expect(event.movements[0]).toMatchObject({
      athleteId: 11,
      from: { x: 1, y: 1 },
      to: { x: 1, y: 0 }
    });
  });
});

describe('finalizacao', () => {
  it('usa o ataque como porcentagem direta e o gol encerra a rodada', () => {
    const result = processarRodada(
      singleAttackerTeam(1, 75),
      singleAttackerTeam(2, 20, 40, 0),
      {
        totalTurns: 12,
        initialPossession: 'player',
        rng: constant(0.5)
      }
    );

    expect(result.score).toEqual({ player: 1, opponent: 0 });
    expect(result.winner).toBe('player');
    expect(result.totalTurns).toBe(4);
    expect(result.events.at(-1)).toMatchObject({
      kind: 'shot',
      successChance: 0.75,
      goal: true
    });
  });

  it('no chute perdido, o adversario mais proximo recebe a bola e o empate e sorteado', () => {
    const player = singleAttackerTeam(1, 40, 50, 1);
    const opponent = team(2, 'Opponent', [
      {
        id: 21,
        row: 0,
        col: 0,
        type: 'defender'
      },
      {
        id: 22,
        row: 0,
        col: 2,
        type: 'defender'
      }
    ]);
    const result = processarRodada(player, opponent, {
      totalTurns: 4,
      initialPossession: 'player',
      rng: sequence([0.9, 0.75])
    });

    const shot = result.events.at(-1)!;
    expect(shot.kind).toBe('shot');
    expect(shot.goal).toBe(false);
    expect(shot.ball.team).toBe('opponent');
    expect(shot.ball.athleteId).toBe(22);
  });
});

describe('limites da rodada', () => {
  it('termina empatada depois de 12 acoes sem gol', () => {
    const player = singleAttackerTeam(1, 1);
    const opponent = singleAttackerTeam(2, 1);
    const result = processarRodada(player, opponent, {
      initialPossession: 'player',
      rng: constant(0.999)
    });

    expect(result.totalTurns).toBe(TOTAL_TURNS);
    expect(result.events).toHaveLength(TOTAL_TURNS);
    expect(result.winner).toBe('draw');
    expect(result.score).toEqual({ player: 0, opponent: 0 });
  });

  it('nao altera os times recebidos por parametro', () => {
    const player = singleAttackerTeam(1, 75);
    const before = JSON.stringify(player);

    processarRodada(player, singleAttackerTeam(2), {
      totalTurns: 1,
      initialPossession: 'player',
      rng: constant(0)
    });

    expect(JSON.stringify(player)).toBe(before);
  });
});
