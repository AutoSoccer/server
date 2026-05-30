import type { Athlete } from './types';

export type AttackAttribute = 'velocity' | 'attack';
export type DefenseAttribute = 'defense';
export type SimAttribute = AttackAttribute | DefenseAttribute;

/** Valor neutro usado quando um atributo vem ausente/invalido, para a simulacao nunca quebrar. */
export const FALLBACK_ATTRIBUTE = 50;

/**
 * Atributo efetivo de um atleta: valor base somado ao bonus de itens (RN012 / Task 4.1).
 */
export const effectiveAttribute = (
  athlete: Athlete | undefined,
  attribute: SimAttribute
): number => {
  if (!athlete) {
    return 0;
  }
  const raw = athlete[attribute];
  const base =
    typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : FALLBACK_ATTRIBUTE;
  const bonusRaw = athlete.bonus?.[attribute];
  const bonus = typeof bonusRaw === 'number' && Number.isFinite(bonusRaw) ? bonusRaw : 0;
  const value = base + bonus;
  return value > 0 ? value : 0;
};

/**
 * RN012 — formula da disputa.
 *
 * Chance de sucesso do atacante = atributoAtacante / (atributoAtacante + atributoDefensor).
 * Propriedades garantidas (cobertas por testes):
 *  - justa: atributos iguais => 50%;
 *  - monotonica: mais atributo (ou buff) => mais chance;
 *  - sempre em [0, 1], o que impede que o loop de turnos entre em ciclo infinito.
 */
export const computeSuccessChance = (
  attackerAttribute: number,
  defenderAttribute: number
): number => {
  const atk = Math.max(0, attackerAttribute);
  const def = Math.max(0, defenderAttribute);
  const total = atk + def;
  if (total <= 0) {
    return 0.5;
  }
  return atk / total;
};
