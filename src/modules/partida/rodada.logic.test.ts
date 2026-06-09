import { describe, expect, it } from 'vitest';

import {
  applyTrophies,
  COINS_PER_ROUND,
  coinsForRound,
  LOSSES_TO_LOSE_MATCH,
  resolveMatchStatus,
  TROPHIES_ON_LOSS,
  TROPHIES_ON_WIN,
  trophiesForStatus,
  WINS_TO_WIN_MATCH
} from './rodada.logic';

describe('resolveMatchStatus (RN001/RN002)', () => {
  it('continua em andamento abaixo dos limites', () => {
    expect(resolveMatchStatus(0, 0)).toBe('in_progress');
    expect(resolveMatchStatus(9, 4)).toBe('in_progress');
  });

  it('vence a partida com 10 rodadas ganhas (RN001)', () => {
    expect(resolveMatchStatus(WINS_TO_WIN_MATCH, 0)).toBe('won');
    expect(resolveMatchStatus(10, 4)).toBe('won');
  });

  it('perde a partida com 5 rodadas perdidas (RN002)', () => {
    expect(resolveMatchStatus(0, LOSSES_TO_LOSE_MATCH)).toBe('lost');
    expect(resolveMatchStatus(9, 5)).toBe('lost'); // 9 vitorias nao bastam; 5 derrotas encerram
  });

  it('vitoria tem prioridade quando ambos os limites sao atingidos', () => {
    expect(resolveMatchStatus(10, 5)).toBe('won');
  });
});

describe('trophiesForStatus (RF004)', () => {
  it('ganha trofeus na vitoria e perde na derrota', () => {
    expect(trophiesForStatus('won')).toBe(TROPHIES_ON_WIN);
    expect(trophiesForStatus('lost')).toBe(-TROPHIES_ON_LOSS);
  });

  it('nao altera trofeus enquanto a partida segue', () => {
    expect(trophiesForStatus('in_progress')).toBe(0);
  });
});

describe('applyTrophies', () => {
  it('soma a variacao positiva', () => {
    expect(applyTrophies(100, 30)).toBe(130);
  });

  it('nunca deixa o total negativo (coluna UNSIGNED)', () => {
    expect(applyTrophies(10, -15)).toBe(0);
    expect(applyTrophies(0, -30)).toBe(0);
  });
});

describe('coinsForRound (RF010)', () => {
  it('paga valor fixo por rodada jogada', () => {
    expect(coinsForRound('draw')).toBe(COINS_PER_ROUND);
    expect(coinsForRound('opponent')).toBe(COINS_PER_ROUND);
    expect(coinsForRound('player')).toBe(COINS_PER_ROUND);
  });
});
