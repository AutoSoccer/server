import type {
  SnapshotAthlete,
  SnapshotAthleteBonus
} from '../../database/models/team-snapshot.model';

export type ItemModifiers = {
  attack: number;
  defense: number;
  velocity: number;
};

/**
 * Soma os modificadores de um item ao bonus ja existente do atleta no snapshot.
 * Funcao pura — facilita o teste do empilhamento de buffs (Task 4.1).
 */
export const mergeBonus = (
  current: SnapshotAthleteBonus | undefined,
  mods: ItemModifiers
): SnapshotAthleteBonus => ({
  attack: (current?.attack ?? 0) + mods.attack,
  defense: (current?.defense ?? 0) + mods.defense,
  velocity: (current?.velocity ?? 0) + mods.velocity
});

/**
 * RN de empilhamento (stacking): um item nao-stackable nao pode ser aplicado
 * duas vezes ao mesmo atleta na mesma rodada. Retorna true se a aplicacao e valida.
 */
export const canApplyItem = (
  athlete: Pick<SnapshotAthlete, 'appliedItemIds'>,
  itemId: number,
  stackable: boolean
): boolean => {
  if (stackable) {
    return true;
  }
  const applied = athlete.appliedItemIds ?? [];
  return !applied.includes(itemId);
};
