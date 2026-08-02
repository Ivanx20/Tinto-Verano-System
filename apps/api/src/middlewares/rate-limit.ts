import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiadas solicitudes. Intente nuevamente.', errors: [] }
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos de inicio de sesión.', errors: [] }
});
