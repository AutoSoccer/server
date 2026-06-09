/**
 * Builder simples para mockar instancias de Team como POJO.
 */
import { vi } from 'vitest';

export type MockTeam = {
  id: number;
  user_id: number;
  name: string;
  round: number;
  victory: number;
  lose: number;
  draw: number;
  trophies?: number;
  save: ReturnType<typeof vi.fn>;
  get?: ReturnType<typeof vi.fn>;
};

export function buildTeam(overrides: Partial<MockTeam> = {}): MockTeam {
  return {
    id: 10,
    user_id: 1,
    name: 'Time do Lucas',
    round: 1,
    victory: 0,
    lose: 0,
    draw: 0,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}
