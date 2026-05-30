import { resolveDispute, type DisputeStrategy } from './dispute-strategy';
import type { Athlete, DisputeOutcome, RandomFn } from '../types';

/**
 * "Chute vs Defesa do Goleiro" — disputa na ultima linha (RN003/RN004/RN007).
 * O atacante usa o ATAQUE (+buffs) contra a DEFESA (+buffs) do goleiro; vencer
 * marca gol e encerra a rodada imediatamente (break no motor).
 */
export class ShotVsKeeperStrategy implements DisputeStrategy {
  readonly name = 'Chute vs Defesa do Goleiro';
  readonly attackerAttribute = 'attack' as const;
  readonly successKind = 'shot' as const;
  readonly scoresGoal = true;

  resolve(attacker: Athlete, defender: Athlete | undefined, rng: RandomFn): DisputeOutcome {
    return resolveDispute(this, attacker, defender, rng);
  }
}

export const shotVsKeeper = new ShotVsKeeperStrategy();
