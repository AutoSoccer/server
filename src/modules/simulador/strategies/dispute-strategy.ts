import { computeSuccessChance, effectiveAttribute, type AttackAttribute } from '../formula';
import type { Athlete, DisputeKind, DisputeOutcome, RandomFn } from '../types';

/**
 * Strategy (GoF) para resolver um tipo de disputa de bola (RN012).
 *
 * Cada estrategia encapsula QUAL atributo do atacante entra no embate e se um
 * sucesso resulta em gol, mantendo o motor de turnos agnostico e facil de
 * estender (basta criar uma nova estrategia para um novo tipo de disputa).
 */
export interface DisputeStrategy {
  /** Nome legivel para os logs (ex.: "Drible vs Desarme"). */
  readonly name: string;
  /** Atributo do atacante usado no calculo (velocidade no drible, ataque no chute). */
  readonly attackerAttribute: AttackAttribute;
  /** Tipo de evento gerado quando o atacante vence a disputa. */
  readonly successKind: DisputeKind;
  /** Se um sucesso desta estrategia marca gol (RN003/RN004). */
  readonly scoresGoal: boolean;
  /** Resolve a disputa usando atributos efetivos (base + buffs) e RNG. */
  resolve(attacker: Athlete, defender: Athlete | undefined, rng: RandomFn): DisputeOutcome;
}

/**
 * Resolucao compartilhada: calcula atributos efetivos, a chance (RN012) e sorteia.
 * Centralizada aqui para as estrategias concretas nao duplicarem a matematica.
 */
export const resolveDispute = (
  strategy: Pick<DisputeStrategy, 'attackerAttribute' | 'scoresGoal'>,
  attacker: Athlete,
  defender: Athlete | undefined,
  rng: RandomFn
): DisputeOutcome => {
  const attackerAttribute = effectiveAttribute(attacker, strategy.attackerAttribute);
  const defenderAttribute = effectiveAttribute(defender, 'defense');
  const successChance = computeSuccessChance(attackerAttribute, defenderAttribute);
  const roll = rng();
  const success = roll < successChance;
  return {
    attackerAttribute,
    defenderAttribute,
    successChance,
    roll,
    success,
    goal: success && strategy.scoresGoal
  };
};
