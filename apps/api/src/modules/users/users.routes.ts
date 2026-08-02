import { Router } from 'express';
import { authenticate, requirePermission } from '../../middlewares/auth.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { audit } from '../../middlewares/audit.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema, listQuerySchema } from '../crud/crud.schemas.js';
import { createUserSchema, updateUserSchema } from './users.schemas.js';
import * as c from './users.controller.js';

export const usersRoutes = Router();

usersRoutes.get('/', authenticate, requirePermission('user.create'), validate(listQuerySchema), asyncHandler(c.list));
usersRoutes.post('/', authenticate, requirePermission('user.create'), validate(createUserSchema), audit('users.create', 'users'), asyncHandler(c.create));
usersRoutes.put('/:id', authenticate, requirePermission('user.create'), validate(idParamSchema), validate(updateUserSchema), audit('users.update', 'users'), asyncHandler(c.update));
usersRoutes.delete('/:id', authenticate, requirePermission('user.create'), validate(idParamSchema), audit('users.delete', 'users'), asyncHandler(c.remove));
