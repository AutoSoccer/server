import { describe, expect, it } from 'vitest';
import { createMatchEntry, consumeMatchEntry } from './match-stream.store';
import { type JogarRodadaResult } from './rodada.service';

const makeResult = (): JogarRodadaResult =>
  ({
    events: [{ turn: 1, goal: false, description: 'evento', kind: 'move' }],
    score: { player: 1, opponent: 0 },
    winner: 'player',
    totalTurns: 1
  }) as unknown as JogarRodadaResult;

describe('match-stream.store', () => {
  it('cria uma entrada e retorna um matchId nao vazio', () => {
    const id = createMatchEntry(makeResult());
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('consome a entrada uma unica vez', () => {
    const id = createMatchEntry(makeResult());
    const first = consumeMatchEntry(id);
    const second = consumeMatchEntry(id);
    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('retorna null para matchId inexistente', () => {
    expect(consumeMatchEntry('nao-existe')).toBeNull();
  });

  it('cada matchId e unico', () => {
    const id1 = createMatchEntry(makeResult());
    const id2 = createMatchEntry(makeResult());
    expect(id1).not.toBe(id2);
  });
});
