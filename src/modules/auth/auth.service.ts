import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op, UniqueConstraintError } from 'sequelize';

import { env } from '../../config/env';
import { User } from './user.model';

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
  };
};

type ServiceErrorCode = 'CONFLICT' | 'INVALID_CREDENTIALS' | 'NOT_FOUND';

export class ServiceError extends Error {
  public readonly code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.code = code;
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
  trophies: user.trophies
});

const signToken = (user: User): string => {
  return jwt.sign(
    {
      id: user.id,
      nickname: user.nickname
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
    throw new ServiceError('CONFLICT', 'Field name is required.');
  }

  const duplicatedField = await findDuplicatedField(nickname, email, phoneNumber);

  if (duplicatedField) {
    throw new ServiceError('CONFLICT', `Field already in use: ${duplicatedField}`);
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
      throw new ServiceError('CONFLICT', 'Nickname, email or phone_number already in use.');
    }

    throw error;
  }
};

export const getMe = async (userId: number): Promise<AuthResponse['user']> => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new ServiceError('NOT_FOUND', 'Usuario nao encontrado.');
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
    throw new ServiceError('INVALID_CREDENTIALS', 'Invalid credentials.');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.hashed_password);

  if (!isPasswordValid) {
    throw new ServiceError('INVALID_CREDENTIALS', 'Invalid credentials.');
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user)
  };
};
