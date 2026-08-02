import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/auth.js';
import { loginRateLimit } from '../../middlewares/rate-limit.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { loginSchema, changePasswordSchema } from './auth.schemas.js';
import * as controller from './auth.controller.js';

export const authRoutes = Router();

authRoutes.post('/login', loginRateLimit, validate(loginSchema), asyncHandler(controller.login));
authRoutes.post('/refresh', asyncHandler(controller.refresh));
authRoutes.post('/logout', asyncHandler(controller.logout));
authRoutes.get('/me', authenticate, asyncHandler(controller.me));
authRoutes.post('/change-password', authenticate, validate(changePasswordSchema), asyncHandler(controller.changePassword));
