import type { Request, Response } from 'express';

export function notFound(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`, errors: [] });
}
