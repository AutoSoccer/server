import { dribbleVsTackle } from './dribble-vs-tackle.strategy';
import { shotVsKeeper } from './shot-vs-keeper.strategy';
import type { DisputeStrategy } from './dispute-strategy';
import type { BallRow } from '../types';

export { dribbleVsTackle, shotVsKeeper };
export { resolveDispute } from './dispute-strategy';
export { DribbleVsTackleStrategy } from './dribble-vs-tackle.strategy';
export { ShotVsKeeperStrategy } from './shot-vs-keeper.strategy';
export type { DisputeStrategy };

/**
 * RN011: a linha de ataque (row 2) dispara a estrategia de chute; as demais
 * (defesa/meio) usam o drible. Factory que seleciona a Strategy do turno.
 */
export const strategyForBallRow = (ballRow: BallRow): DisputeStrategy =>
  ballRow >= 2 ? shotVsKeeper : dribbleVsTackle;
