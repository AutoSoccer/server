import { resolveDispute, type DisputeStrategy } from './dispute-strategy';
import type { Athlete, DisputeOutcome, RandomFn } from '../types';

/**
 * "Drible vs Desarme" — disputa de avanco pelas linhas de defesa/meio (RN011/RN012).
 * O atacante usa a VELOCIDADE (+buffs) contra a DEFESA (+buffs) do marcador;
 * vencer avanca a bola uma linha mantendo a posse.
 */
export class DribbleVsTackleStrategy implements DisputeStrategy {
  readonly name = 'Drible vs Desarme';
  readonly attackerAttribute = 'velocity' as const;
  readonly successKind = 'pass' as const;
  readonly scoresGoal = false;

  resolve(attacker: Athlete, defender: Athlete | undefined, rng: RandomFn): DisputeOutcome {
    return resolveDispute(this, attacker, defender, rng);
  }
}

export const dribbleVsTackle = new DribbleVsTackleStrategy();
