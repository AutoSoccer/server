export type MatchStatus = 'in_progress' | 'won' | 'lost';
export type RoundWinner = 'player' | 'opponent' | 'draw';

/** RN001: vitorias de rodada necessarias para vencer a partida. */
export const WINS_TO_WIN_MATCH = 7;
/** RN002: derrotas de rodada que encerram a partida com derrota. */
export const LOSSES_TO_LOSE_MATCH = 4;

/** RF010: moedas creditadas por rodada jogada (economia original). */
export const COINS_PER_ROUND = 10;
/** RF010: bonus de moedas por vencer a rodada. */
export const COINS_WIN_BONUS = 0;

/**
 * RF010 — recompensa de moedas ao fim de uma rodada. Toda rodada jogada paga uma
 * base (mantem a economia girando) e a vitoria adiciona um bonus.
 */
export const coinsForRound = (_winner: RoundWinner): number => COINS_PER_ROUND;

/** RF004: trofeus ganhos ao vencer a partida. */
export const TROPHIES_ON_WIN = 30;
/** RF004: trofeus perdidos ao ser derrotado na partida. */
export const TROPHIES_ON_LOSS = 15;

/**
 * RN001/RN002 — define o status da partida a partir do placar acumulado de rodadas.
 * 7 rodadas vencidas => 'won'; 4 perdidas => 'lost'; senao continua 'in_progress'.
 */
export const resolveMatchStatus = (wins: number, losses: number): MatchStatus => {
  if (wins >= WINS_TO_WIN_MATCH) {
    return 'won';
  }
  if (losses >= LOSSES_TO_LOSE_MATCH) {
    return 'lost';
  }
  return 'in_progress';
};

/**
 * RF004 — variacao de trofeus ao encerrar a partida (positiva na vitoria,
 * negativa na derrota, zero enquanto a partida segue em andamento).
 */
export const trophiesForStatus = (status: MatchStatus): number => {
  if (status === 'won') {
    return TROPHIES_ON_WIN;
  }
  if (status === 'lost') {
    return -TROPHIES_ON_LOSS;
  }
  return 0;
};

/** Aplica a variacao de trofeus sem permitir total negativo (coluna UNSIGNED). */
export const applyTrophies = (current: number, delta: number): number =>
  Math.max(0, current + delta);
