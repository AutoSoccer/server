/**
 * Builder simples para mockar instancias de Athlete como POJO.
 */
export type MockAthlete = {
  id: number;
  name: string;
  velocity: number;
  attack: number;
  defense: number;
  ability_id: number;
  tier: string;
  type: string;
  cost: number;
};

export function buildAthlete(overrides: Partial<MockAthlete> = {}): MockAthlete {
  return {
    id: 100,
    name: 'Atleta Bronze',
    velocity: 50,
    attack: 50,
    defense: 50,
    ability_id: 1,
    tier: 'bronze',
    type: 'midfielder',
    cost: 2,
    ...overrides
  };
}
