import crypto from 'crypto';
import argon2 from 'argon2';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { AppError } from '../middlewares/error-handler.js';
import { env } from '../config/env.js';

export type TokenPayload = {
  sub: number;
  email: string;
  permissions: string[];
  roles: string[];
};

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: env.ARGON2_MEMORY_COST,
    timeCost: env.ARGON2_TIME_COST,
    parallelism: env.ARGON2_PARALLELISM
  });
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL } as SignOptions);
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (
    typeof payload !== 'object' ||
    typeof payload.sub !== 'number' ||
    typeof payload.email !== 'string' ||
    !Array.isArray(payload.permissions) ||
    !Array.isArray(payload.roles)
  ) {
    throw new AppError('Token inválido', 401);
  }
  return payload as unknown as TokenPayload;
}

export function generateRefreshToken() {
  return crypto.randomBytes(64).toString('base64url');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshTokenExpiresAt() {
  const date = new Date();
  date.setDate(date.getDate() + env.REFRESH_TOKEN_DAYS);
  return date;
}
