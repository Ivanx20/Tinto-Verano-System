import type { Response } from 'express';

export function ok(res: Response, data: unknown = {}, message = 'Operación realizada correctamente') {
  return res.json({ success: true, message, data });
}

export function created(res: Response, data: unknown = {}, message = 'Registro creado correctamente') {
  return res.status(201).json({ success: true, message, data });
}

export function fail(res: Response, status: number, message: string, errors: unknown[] = []) {
  return res.status(status).json({ success: false, message, errors });
}
