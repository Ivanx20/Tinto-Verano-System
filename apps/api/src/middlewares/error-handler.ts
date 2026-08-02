import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  errors: unknown[];

  constructor(message: string, statusCode = 400, errors: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  void next;
  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.errors });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ success: false, message: error.message, errors: error.errors });
  }

  logger.error(error);

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    errors: env.isProduction ? [] : [String(error)]
  });
}
