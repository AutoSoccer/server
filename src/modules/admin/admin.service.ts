import { User, type UserRole } from '../../database/models';

export type AdminListUsersInput = {
  page?: number;
  limit?: number;
};

export type AdminUserSummary = {
  id: number;
  nickname: string;
  email: string;
  role: UserRole;
  coins: number;
  is_guest: boolean;
  created_at: string | null;
};

export type AdminListUsersResponse = {
  users: AdminUserSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const clampPage = (page?: number): number =>
  Math.max(DEFAULT_PAGE, Math.floor(page ?? DEFAULT_PAGE));

const clampLimit = (limit?: number): number =>
  Math.min(Math.max(1, Math.floor(limit ?? DEFAULT_LIMIT)), MAX_LIMIT);

const toIsoOrNull = (value: Date | string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : String(value);
};

/**
 * Listagem administrativa de usuarios (T5). Pagina por `page`/`limit` e expoe
 * apenas campos nao sensiveis (nunca `hashed_password`). Restrita a tokens
 * com role 'admin' via `authenticate` + `requireRole('admin')` na rota.
 */
export const listUsers = async (
  input: AdminListUsersInput = {}
): Promise<AdminListUsersResponse> => {
  const page = clampPage(input.page);
  const limit = clampLimit(input.limit);

  const { rows, count } = await User.findAndCountAll({
    attributes: ['id', 'nickname', 'email', 'role', 'coins', 'is_guest', 'created_at'],
    order: [['id', 'ASC']],
    limit,
    offset: (page - 1) * limit
  });

  return {
    users: rows.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      role: user.role ?? 'user',
      coins: user.coins,
      is_guest: user.is_guest,
      created_at: toIsoOrNull(user.created_at)
    })),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / limit))
    }
  };
};
