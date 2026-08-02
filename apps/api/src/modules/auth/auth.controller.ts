import type { Request, Response } from 'express';
import { ok } from '../../utils/api-response.js';
import * as service from './auth.service.js';
import { AppError } from '../../middlewares/error-handler.js';

export async function login(req: Request, res: Response) {
  const data = await service.login(req.body.email, req.body.password, req, res);
  return ok(res, data, 'Inicio de sesión correcto');
}

export async function refresh(req: Request, res: Response) {
  const data = await service.refresh(req, res);
  return ok(res, data, 'Sesión renovada');
}

export async function logout(req: Request, res: Response) {
  const data = await service.logout(req, res);
  return ok(res, data, 'Sesión cerrada');
}

export async function me(req: Request, res: Response) {
  if (!req.auth) throw new AppError('No autenticado', 401);
  const data = await service.me(req.auth.sub);
  return ok(res, data, 'Usuario autenticado');
}

export async function changePassword(req: Request, res: Response) {
  if (!req.auth) throw new AppError('No autenticado', 401);
  const data = await service.changePassword(req.auth.sub, req.body.currentPassword, req.body.newPassword);
  return ok(res, data, 'Contraseña actualizada');
}
