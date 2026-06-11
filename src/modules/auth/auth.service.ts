import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op, UniqueConstraintError } from 'sequelize';

import { env } from '../../config/env';
import { User, type UserRole } from './user.model';

export type RegisterInput = {
  name: string;
  nickname: string;
  password: string;
  email: string;
  phone_number?: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

type AuthResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phone_number: string | null;
    victory: number;
    defeat: number;
    trophies: number;
    coins: number;
    is_guest: boolean;
    role: UserRole;
  };
};

type ServiceErrorCode = 'CONFLICT' | 'INVALID_CREDENTIALS' | 'NOT_FOUND';

export type ServiceErrorOptions = {
  /**
   * Chave hierarquica i18n (ex.: `auth.login.invalidCredentials`). Quando
   * presente, o errorHandler usa-a com prioridade ao resolver a mensagem via
   * `req.t(i18nKey, params)`.
   */
  i18nKey?: string;
  /** Parametros usados na interpolacao da chave i18n. */
  params?: Record<string, unknown>;
};

export class ServiceError extends Error {
  public readonly code: ServiceErrorCode;
  public readonly i18nKey: string;
  public readonly params?: Record<string, unknown>;

  constructor(code: ServiceErrorCode, options: ServiceErrorOptions = {}) {
    const i18nKey = options.i18nKey ?? `auth.errors.${code}`;
    // Fallback usado em logs e quando o i18next nao tem a chave: inclui o
    // proprio i18nKey + params relevantes (alem de preservar contratos antigos
    // de teste que checam `expect.stringContaining('nickname')`).
    const paramSummary = options.params
      ? Object.entries(options.params)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => `${key}=${String(value)}`)
          .join(' ')
      : '';
    const fallback = paramSummary ? `${i18nKey} (${paramSummary})` : i18nKey;
    super(fallback);
    this.name = 'ServiceError';
    this.code = code;
    this.i18nKey = i18nKey;
    this.params = options.params;
  }
}

const sanitizeUser = (user: User): AuthResponse['user'] => ({
  id: user.id,
  name: user.name,
  nickname: user.nickname,
  email: user.email,
  phone_number: user.phone_number,
  victory: user.victory,
  defeat: user.defeat,
  trophies: user.trophies,
  coins: user.coins,
  is_guest: user.is_guest,
  role: user.role ?? 'user'
});

/**
 * Assina o JWT com as claims de identidade + permissao (T5). Todo token
 * emitido (register, login e guest) carrega `role`; convidados e usuarios
 * comuns recebem 'user', contas administrativas recebem 'admin'.
 */
const signToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      nickname: user.nickname,
      role: user.role ?? 'user'
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn']
    }
  );
};

const trimOrUndefined = (value?: string): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const findDuplicatedField = async (
  nickname: string,
  email: string,
  phoneNumber?: string
): Promise<string | null> => {
  const conditions: Array<Record<string, string>> = [{ nickname }, { email }];

  if (phoneNumber) {
    conditions.push({ phone_number: phoneNumber });
  }

  const existingUser = await User.findOne({
    where: {
      [Op.or]: conditions
    }
  });

  if (!existingUser) {
    return null;
  }

  if (existingUser.nickname === nickname) {
    return 'nickname';
  }

  if (existingUser.email === email) {
    return 'email';
  }

  if (phoneNumber && existingUser.phone_number === phoneNumber) {
    return 'phone_number';
  }

  return 'identifier';
};

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  const name = input.name.trim();
  const nickname = input.nickname.trim();
  const email = input.email.trim().toLowerCase();
  const phoneNumber = trimOrUndefined(input.phone_number);

  if (name.length === 0) {
    throw new ServiceError('CONFLICT', { i18nKey: 'auth.register.nameRequired' });
  }

  const duplicatedField = await findDuplicatedField(nickname, email, phoneNumber);

  if (duplicatedField) {
    throw new ServiceError('CONFLICT', {
      i18nKey: 'auth.register.fieldInUse',
      params: { field: duplicatedField }
    });
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  try {
    const user = await User.create({
      name,
      nickname,
      hashed_password: hashedPassword,
      email,
      phone_number: phoneNumber ?? null,
      victory: 0,
      defeat: 0,
      trophies: 0
    });

    return {
      token: signToken(user),
      user: sanitizeUser(user)
    };
  } catch (error: unknown) {
    if (error instanceof UniqueConstraintError) {
      throw new ServiceError('CONFLICT', {
        i18nKey: 'auth.register.uniqueConstraint'
      });
    }

    throw error;
  }
};

/**
 * RF005 — cria uma conta de CONVIDADO efemera (is_guest=true) e ja devolve um
 * token JWT para jogar sem cadastro. Convidados nao contabilizam trofeus
 * (tratado no fim da partida) nem entram no ranking geral.
 */
/**
 * RF005/RF010 — saldo inicial do convidado (economia original).
 */
export const GUEST_INITIAL_COINS = 10;

export const createGuest = async (): Promise<AuthResponse> => {
  // nickname tem limite de 20 chars; "guest_" + 12 = 18 cabe com folga.
  const makeSuffix = (): string =>
    `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`.slice(-12);

  // Senha aleatoria — o convidado nunca faz login por senha.
  const randomPassword = `${Math.random().toString(36).slice(2)}${Date.now()}`;
  const hashedPassword = await bcrypt.hash(randomPassword, 12);

  for (let attempt = 0; attempt < 3; attempt++) {
    const suffix = makeSuffix();
    try {
      const user = await User.create({
        name: 'Convidado',
        nickname: `guest_${suffix}`,
        hashed_password: hashedPassword,
        email: `guest_${suffix}@guest.local`,
        phone_number: null,
        victory: 0,
        defeat: 0,
        trophies: 0,
        coins: GUEST_INITIAL_COINS,
        is_guest: true
      });

      return {
        token: signToken(user),
        user: sanitizeUser(user)
      };
    } catch (error: unknown) {
      if (error instanceof UniqueConstraintError && attempt < 2) {
        continue;
      }
      throw error;
    }
  }

  throw new ServiceError('CONFLICT', { i18nKey: 'auth.guest.createFailed' });
};

export const getMe = async (userId: number): Promise<AuthResponse['user']> => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new ServiceError('NOT_FOUND', { i18nKey: 'auth.me.userNotFound' });
  }

  return sanitizeUser(user);
};

export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  const identifier = input.identifier.trim();

  const user = await User.findOne({
    where: {
      [Op.or]: [
        {
          email: identifier.toLowerCase()
        },
        {
          nickname: identifier
        }
      ]
    }
  });

  if (!user) {
    throw new ServiceError('INVALID_CREDENTIALS', {
      i18nKey: 'auth.login.invalidCredentials'
    });
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.hashed_password);

  if (!isPasswordValid) {
    throw new ServiceError('INVALID_CREDENTIALS', {
      i18nKey: 'auth.login.invalidCredentials'
    });
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user)
  };
};
