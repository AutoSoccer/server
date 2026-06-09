import { describe, expect, it } from 'vitest';

import {
  botAthleteCountForRound,
  buildBotFormation
} from './seed';

describe('buildBotFormation', () => {
  it('usa tres atletas na primeira rodada e seis nas seguintes', () => {
    expect(botAthleteCountForRound(1)).toBe(3);
    expect(botAthleteCountForRound(2)).toBe(6);
    expect(botAthleteCountForRound(10)).toBe(6);
  });

  it('gera uma formacao equilibrada de tres atletas para a primeira rodada', () => {
    for (let seed = 0; seed < 27; seed += 1) {
      const formation = buildBotFormation(seed, 3);
      const positions = new Set(
        formation.map((slot) => `${slot.row}:${slot.col}`)
      );

      expect(formation).toHaveLength(3);
      expect(positions.size).toBe(3);
      expect(formation.filter((slot) => slot.type === 'defender')).toHaveLength(1);
      expect(formation.filter((slot) => slot.type === 'midfielder')).toHaveLength(1);
      expect(formation.filter((slot) => slot.type === 'attacker')).toHaveLength(1);
    }
  });

  it('gera seis posicoes unicas com dois atletas por linha', () => {
    for (let seed = 0; seed < 27; seed += 1) {
      const formation = buildBotFormation(seed);
      const positions = new Set(
        formation.map((slot) => `${slot.row}:${slot.col}`)
      );

      expect(formation).toHaveLength(6);
      expect(positions.size).toBe(6);
      expect(formation.filter((slot) => slot.type === 'defender')).toHaveLength(2);
      expect(formation.filter((slot) => slot.type === 'midfielder')).toHaveLength(2);
      expect(formation.filter((slot) => slot.type === 'attacker')).toHaveLength(2);
    }
  });

  it('distribui as snapshots entre as 27 combinacoes possiveis', () => {
    for (const athleteCount of [3, 6] as const) {
      const signatures = new Set(
        Array.from({ length: 27 }, (_, seed) =>
          buildBotFormation(seed, athleteCount)
            .map((slot) => `${slot.row}:${slot.col}`)
            .sort()
            .join('|')
        )
      );

      expect(signatures.size).toBe(27);
    }
  });

  it('nao deixa o centro do meio-campo vazio em todas as formacoes', () => {
    const formationsWithCentralMidfielder = Array.from(
      { length: 27 },
      (_, seed) =>
        buildBotFormation(seed).some(
          (slot) => slot.type === 'midfielder' && slot.col === 1
        )
    ).filter(Boolean);

    expect(formationsWithCentralMidfielder.length).toBeGreaterThan(0);
  });
});
