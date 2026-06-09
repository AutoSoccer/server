/**
 * Builder simples para mockar instancias de User como POJO.
 * Inclui `save` como vi.fn() vazio por padrao para facilitar os testes de
 * services que persistem o registro.
 */
import { vi } from 'vitest';

export type MockUser = {
  id: number;
  name: string;
  nickname: string;
  hashed_password: string;
  email: string;
  phone_number: string | null;
  victory: number;
  defeat: number;
  trophies: number;
  coins: number;
  is_guest: boolean;
  save: ReturnType<typeof vi.fn>;
};

export function buildUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 1,
    name: 'Lucas',
    nickname: 'lucas',
    hashed_password: '$2a$12$hashed',
    email: 'lucas@example.com',
    phone_number: null,
    victory: 0,
    defeat: 0,
    trophies: 0,
    coins: 2500,
    is_guest: false,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}
