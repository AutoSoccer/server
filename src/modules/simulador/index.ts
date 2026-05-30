export { Simulador, processarRodada, TOTAL_TURNS } from './simulador.service';

export { computeSuccessChance, effectiveAttribute, FALLBACK_ATTRIBUTE } from './formula';

export { moveAthleteToDefense, retreatOnPossessionLoss } from './movement';

export {
  dribbleVsTackle,
  shotVsKeeper,
  resolveDispute,
  strategyForBallRow,
  DribbleVsTackleStrategy,
  ShotVsKeeperStrategy
} from './strategies';
export type { DisputeStrategy } from './strategies';

export {
  Athlete,
  TeamDTO,
  type AttributeBonus,
  type BallRow,
  type DisputeKind,
  type DisputeOutcome,
  type MatchResult,
  type MatchScore,
  type MatchWinner,
  type Possession,
  type RandomFn,
  type SimulationOptions,
  type TurnEvent
} from './types';
