import { Router } from 'express';
import type { AnyZodObject } from 'zod';
import { authenticate, requireAnyPermission } from '../../middlewares/auth.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { audit } from '../../middlewares/audit.js';
import { validate } from '../../middlewares/validate.js';
import { crudController } from './crud.controller.js';
import { idParamSchema, listQuerySchema } from './crud.schemas.js';

type ModelName = Parameters<typeof crudController>[0];

export function createCrudRoutes(options: {
  modelName: ModelName;
  entity: string;
  schema?: AnyZodObject;
  permissions?: {
    read?: string[];
    create?: string[];
    update?: string[];
    delete?: string[];
  };
}) {
  const router = Router();
  const c = crudController(options.modelName);
  const readPerms = options.permissions?.read ?? ['dashboard.view'];
  const createPerms = options.permissions?.create ?? readPerms;
  const updatePerms = options.permissions?.update ?? createPerms;
  const deletePerms = options.permissions?.delete ?? updatePerms;
  const bodyValidators = options.schema ? [validate(options.schema)] : [];

  router.get('/', authenticate, requireAnyPermission(readPerms), validate(listQuerySchema), asyncHandler(c.list));
  router.get('/:id', authenticate, requireAnyPermission(readPerms), validate(idParamSchema), asyncHandler(c.find));
  router.post('/', authenticate, requireAnyPermission(createPerms), ...bodyValidators, audit(`${options.entity}.create`, options.entity), asyncHandler(c.create));
  router.put('/:id', authenticate, requireAnyPermission(updatePerms), validate(idParamSchema), ...bodyValidators, audit(`${options.entity}.update`, options.entity), asyncHandler(c.update));
  router.delete('/:id', authenticate, requireAnyPermission(deletePerms), validate(idParamSchema), audit(`${options.entity}.delete`, options.entity), asyncHandler(c.remove));

  return router;
}
