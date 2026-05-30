import { describe, expect, it } from 'vitest';

import { computeSuccessChance, effectiveAttribute } from './formula';
import { moveAthleteToDefense, retreatOnPossessionLoss } from './movement';
import { processarRodada, TOTAL_TURNS } from './simulador.service';
import { dribbleVsTackle, shotVsKeeper, strategyForBallRow } from './strategies';
import { Athlete, type RandomFn, TeamDTO } from './types';

// ---------------------------------------------------------------------------
// Helpers de teste — RNG deterministico e construcao de times com atributos falsos.
// ---------------------------------------------------------------------------

/** RNG que sempre devolve o mesmo valor. */
const constant = (value: number): RandomFn => () => value;

/** RNG que percorre uma sequencia ciclicamente — torna a simulacao reproduzivel. */
const sequence = (values: number[]): RandomFn => {
  let index = 0;
  return () => values[index++ % values.length];
};

const athlete = (over: Partial<Athlete>): Athlete => Object.assign(new Athlete(), over);

const emptyGrid = (): (Athlete | null)[][] =>
  Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null as Athlete | null));

/** Monta um time com 6 atletas (2 por linha: defesa/meio/ataque) e atributos uniformes. */
const team = (
  id: number,
  name: string,
  attrs?: { atk?: number; def?: number; vel?: number }
): TeamDTO => {
  const dto = new TeamDTO();
  dto.id = id;
  dto.name = name;
  const grid = emptyGrid();
  let counter = id * 10;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      counter += 1;
      grid[row][col] = athlete({
        id: counter,
        name: `${name}-${row}-${col}`,
        velocity: attrs?.vel ?? 50,
        attack: attrs?.atk ?? 50,
        defense: attrs?.def ?? 50
      });
    }
  }
  dto.athletesPositions = grid;
  dto.athlethes = grid.flat().filter((a): a is Athlete => a !== null);
  return dto;
};

// ---------------------------------------------------------------------------
// RN012 — fórmula de chance
// ---------------------------------------------------------------------------

describe('computeSuccessChance (RN012)', () => {
  it('e justa: atributos iguais => 50%', () => {
    expect(computeSuccessChance(50, 50)).toBe(0.5);
    expect(computeSuccessChance(80, 80)).toBe(0.5);
  });

  it('e monotonica: mais ataque => mais chance, menos => menos', () => {
    expect(computeSuccessChance(80, 20)).toBeCloseTo(0.8, 5);
    expect(computeSuccessChance(20, 80)).toBeCloseTo(0.2, 5);
  });

  it('nunca sai do intervalo [0, 1] (impede loop infinito)', () => {
    const samples = [
      [0, 0],
      [1, 999],
      [999, 1],
      [50, 50],
      [-10, 70],
      [70, -10]
    ];
    for (const [atk, def] of samples) {
      const chance = computeSuccessChance(atk, def);
      expect(chance).toBeGreaterThanOrEqual(0);
      expect(chance).toBeLessThanOrEqual(1);
    }
  });

  it('com ambos zerados, cai no neutro 50%', () => {
    expect(computeSuccessChance(0, 0)).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// Atributo efetivo (base + buffs de itens — Task 4.1)
// ---------------------------------------------------------------------------

describe('effectiveAttribute (buffs de itens)', () => {
  it('retorna o atributo base quando nao ha bonus', () => {
    expect(effectiveAttribute(athlete({ velocity: 60 }), 'velocity')).toBe(60);
  });

  it('soma o bonus de itens ao atributo base', () => {
    const buffed = athlete({ attack: 60, bonus: { attack: 15 } });
    expect(effectiveAttribute(buffed, 'attack')).toBe(75);
  });

  it('usa fallback neutro para atributo ausente/invalido', () => {
    expect(effectiveAttribute(athlete({ attack: 0 }), 'attack')).toBe(50);
  });

  it('atleta indefinido vale 0 (sem marcacao)', () => {
    expect(effectiveAttribute(undefined, 'defense')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Strategy pattern — selecao e resolucao
// ---------------------------------------------------------------------------

describe('strategyForBallRow (Strategy pattern)', () => {
  it('defesa/meio usam Drible vs Desarme (velocidade, sem gol)', () => {
    expect(strategyForBallRow(0)).toBe(dribbleVsTackle);
    expect(strategyForBallRow(1)).toBe(dribbleVsTackle);
    expect(dribbleVsTackle.attackerAttribute).toBe('velocity');
    expect(dribbleVsTackle.scoresGoal).toBe(false);
  });

  it('ataque usa Chute vs Defesa do Goleiro (ataque, marca gol)', () => {
    expect(strategyForBallRow(2)).toBe(shotVsKeeper);
    expect(shotVsKeeper.attackerAttribute).toBe('attack');
    expect(shotVsKeeper.scoresGoal).toBe(true);
  });
});

describe('resolucao das disputas', () => {
  it('drible: sorteio abaixo da chance => avanca (sem gol)', () => {
    const out = dribbleVsTackle.resolve(athlete({ velocity: 50 }), athlete({ defense: 50 }), constant(0.4));
    expect(out.success).toBe(true);
    expect(out.goal).toBe(false);
  });

  it('drible: sorteio acima da chance => perde a posse', () => {
    const out = dribbleVsTackle.resolve(athlete({ velocity: 50 }), athlete({ defense: 50 }), constant(0.6));
    expect(out.success).toBe(false);
  });

  it('chute: sucesso vira gol (RN003/RN004)', () => {
    const out = shotVsKeeper.resolve(athlete({ attack: 50 }), athlete({ defense: 50 }), constant(0.1));
    expect(out.success).toBe(true);
    expect(out.goal).toBe(true);
  });

  it('buff de item aumenta a chance de sucesso do atacante', () => {
    const base = dribbleVsTackle.resolve(athlete({ velocity: 50 }), athlete({ defense: 50 }), constant(0));
    const buffed = dribbleVsTackle.resolve(
      athlete({ velocity: 50, bonus: { velocity: 50 } }),
      athlete({ defense: 50 }),
      constant(0)
    );
    expect(buffed.successChance).toBeGreaterThan(base.successChance);
  });
});

// ---------------------------------------------------------------------------
// RN011 — movimentacao tática (recuo)
// ---------------------------------------------------------------------------

describe('movimentacao RN011', () => {
  it('recua o atleta do ataque para uma vaga livre na defesa', () => {
    const t = team(1, 'Alpha');
    const attacker = t.athletesPositions[2][0]!;
    expect(moveAthleteToDefense(t, attacker.id)).toBe(true);
    // saiu do ataque...
    expect(t.athletesPositions[2][0]).toBeNull();
    // ...e reapareceu na defesa.
    expect(t.athletesPositions[0].some((slot) => slot?.id === attacker.id)).toBe(true);
  });

  it('recua ao perder a posse na linha de ataque', () => {
    const t = team(1, 'Alpha');
    const attacker = t.athletesPositions[2][0]!;
    expect(retreatOnPossessionLoss(t, attacker, 2)).toBe(true);
  });

  it('NAO recua se o atleta tem habilidade que ancora a posicao (holdsPosition)', () => {
    const t = team(1, 'Alpha');
    const anchored = t.athletesPositions[2][0]!;
    anchored.holdsPosition = true;
    expect(retreatOnPossessionLoss(t, anchored, 2)).toBe(false);
    expect(t.athletesPositions[2][0]?.id).toBe(anchored.id);
  });

  it('NAO recua quando a perda nao foi na linha de ataque', () => {
    const t = team(1, 'Alpha');
    const midfielder = t.athletesPositions[1][0]!;
    expect(retreatOnPossessionLoss(t, midfielder, 1)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Motor completo — RN007, RN008, RN005, RN009
// ---------------------------------------------------------------------------

describe('processarRodada (motor)', () => {
  it('RN008: nunca passa de 12 turnos e sempre termina (sem loop infinito)', () => {
    const result = processarRodada(team(1, 'Alpha'), team(2, 'Beta'), {
      rng: sequence([0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.8])
    });
    expect(result.events.length).toBeLessThanOrEqual(TOTAL_TURNS);
    expect(result.totalTurns).toBeLessThanOrEqual(TOTAL_TURNS);
    expect(result.totalTurns).toBeGreaterThan(0);
  });

  it('RN007: o gol encerra a rodada imediatamente (placar maximo 1x0)', () => {
    const result = processarRodada(team(1, 'Alpha'), team(2, 'Beta'), {
      rng: constant(0),
      initialPossession: 'player'
    });
    expect(result.score).toEqual({ player: 1, opponent: 0 });
    expect(result.winner).toBe('player');
    expect(result.events.at(-1)?.goal).toBe(true);
    // 3 avancos (defesa -> meio -> ataque -> gol) => break antes dos 12 turnos.
    expect(result.totalTurns).toBeLessThan(TOTAL_TURNS);
    // so o ultimo evento e gol.
    expect(result.events.filter((event) => event.goal)).toHaveLength(1);
  });

  it('RN009: respeita a posse inicial informada', () => {
    const result = processarRodada(team(1, 'Alpha'), team(2, 'Beta'), {
      rng: constant(0),
      initialPossession: 'opponent'
    });
    expect(result.winner).toBe('opponent');
    expect(result.score).toEqual({ player: 0, opponent: 1 });
  });

  it('RN005: sem gol em 12 turnos => empate 0x0', () => {
    const result = processarRodada(team(1, 'Alpha'), team(2, 'Beta'), {
      rng: constant(0.999),
      initialPossession: 'player'
    });
    expect(result.winner).toBe('draw');
    expect(result.score).toEqual({ player: 0, opponent: 0 });
    expect(result.totalTurns).toBe(TOTAL_TURNS);
    expect(result.events.every((event) => event.goal === false)).toBe(true);
  });

  it('nao muta os times originais passados por parametro', () => {
    const player = team(1, 'Alpha');
    const snapshotBefore = JSON.stringify(player.athletesPositions);
    processarRodada(player, team(2, 'Beta'), { rng: constant(0), initialPossession: 'player' });
    expect(JSON.stringify(player.athletesPositions)).toBe(snapshotBefore);
  });
});
