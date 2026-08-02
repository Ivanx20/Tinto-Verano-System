import type { Request, Response } from 'express';
import { created, ok } from '../../utils/api-response.js';
import * as service from './users.service.js';

export async function list(req: Request, res: Response) {
  return ok(res, await service.list(req.query));
}

export async function create(req: Request, res: Response) {
  return created(res, await service.create(req.body, req.auth?.sub));
}

export async function update(req: Request, res: Response) {
  return ok(res, await service.update(Number(req.params.id), req.body, req.auth?.sub), 'Usuario actualizado');
}

export async function remove(req: Request, res: Response) {
  return ok(res, await service.remove(Number(req.params.id), req.auth?.sub), 'Usuario eliminado');
}
