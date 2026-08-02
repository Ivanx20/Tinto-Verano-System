import type { NextFunction, Request, Response } from 'express';
import { AppError } from './error-handler.js';
import { verifyAccessToken } from '../utils/security.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const tokenFromHeader = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = tokenFromHeader || req.cookies?.accessToken;

  if (!token) throw new AppError('No autenticado', 401);

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch {
    throw new AppError('Sesión inválida o expirada', 401);
  }
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new AppError('No autenticado', 401);
    if (!req.auth.permissions.includes(permission)) throw new AppError('No autorizado', 403);
    next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new AppError('No autenticado', 401);
    if (!permissions.some((permission) => req.auth?.permissions.includes(permission))) throw new AppError('No autorizado', 403);
    next();
  };
}
