import { describe, expect, it } from 'vitest';

import { canApplyItem, mergeBonus } from './itens.logic';

describe('mergeBonus (empilhamento de buffs)', () => {
  it('cria o bonus a partir do zero quando o atleta nao tinha nenhum', () => {
    expect(mergeBonus(undefined, { attack: 10, defense: 0, velocity: 0 })).toEqual({
      attack: 10,
      defense: 0,
      velocity: 0
    });
  });

  it('acumula sobre o bonus existente', () => {
    const current = { attack: 10, defense: 5, velocity: 0 };
    expect(mergeBonus(current, { attack: 4, defense: 0, velocity: 8 })).toEqual({
      attack: 14,
      defense: 5,
      velocity: 8
    });
  });
});

describe('canApplyItem (regra de stacking)', () => {
  it('item stackable pode ser aplicado mesmo se ja existe', () => {
    expect(canApplyItem({ appliedItemIds: [1] }, 1, true)).toBe(true);
  });

  it('item nao-stackable e bloqueado se ja foi aplicado ao atleta', () => {
    expect(canApplyItem({ appliedItemIds: [1, 2] }, 1, false)).toBe(false);
  });

  it('item nao-stackable e permitido se ainda nao foi aplicado', () => {
    expect(canApplyItem({ appliedItemIds: [2] }, 1, false)).toBe(true);
    expect(canApplyItem({ appliedItemIds: undefined }, 1, false)).toBe(true);
  });
});
