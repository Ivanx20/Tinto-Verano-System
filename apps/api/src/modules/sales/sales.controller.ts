import type { Request, Response } from 'express';
import { created, ok } from '../../utils/api-response.js';
import * as service from './sales.service.js';

export async function list(req: Request, res: Response) { return ok(res, await service.list(req.query)); }
export async function find(req: Request, res: Response) { return ok(res, await service.find(Number(req.params.id))); }
export async function create(req: Request, res: Response) { return created(res, await service.create(req.body, req.auth?.sub), 'Venta registrada correctamente'); }
export async function cancel(req: Request, res: Response) { return ok(res, await service.cancel(Number(req.params.id), req.auth?.sub), 'Venta anulada'); }
