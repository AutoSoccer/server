/**
 * Builder simples para mockar instancias de Item como POJO.
 */
export type MockItem = {
  id: number;
  name: string;
  description: string;
  modifier_attack: number;
  modifier_defense: number;
  modifier_velocity: number;
  cost: number;
  stackable: boolean;
  is_active: boolean;
};

export function buildItem(overrides: Partial<MockItem> = {}): MockItem {
  return {
    id: 1,
    name: 'Chuteira Magica',
    description: 'Aumenta velocidade.',
    modifier_attack: 0,
    modifier_defense: 0,
    modifier_velocity: 5,
    cost: 3,
    stackable: false,
    is_active: true,
    ...overrides
  };
}
