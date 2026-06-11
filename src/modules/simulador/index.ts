export { computeInitiative, Simulador, processarRodada, TOTAL_TURNS } from './simulador.service';

export { SimuladorServiceError, type SimuladorServiceErrorCode } from './simulador.errors';

export { computeSuccessChance, effectiveAttribute, FALLBACK_ATTRIBUTE } from './formula';

export {
  Athlete,
  TeamDTO,
  type AttributeBonus,
  type AthleteRole,
  type BallRow,
  type BallState,
  type DisputeKind,
  type DisputeOutcome,
  type FieldColumn,
  type FieldMovement,
  type FieldPosition,
  type InitiativeResult,
  type MatchResult,
  type MatchScore,
  type MatchWinner,
  type Possession,
  type RandomFn,
  type SimulationOptions,
  type TurnEvent
} from './types';
