import { Router } from 'express';
import { authenticate, requirePermission } from '../../middlewares/auth.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { audit } from '../../middlewares/audit.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema, listQuerySchema } from '../crud/crud.schemas.js';
import { createSaleSchema } from './sales.schemas.js';
import * as c from './sales.controller.js';

export const salesRoutes = Router();

salesRoutes.get('/', authenticate, requirePermission('sale.create'), validate(listQuerySchema), asyncHandler(c.list));
salesRoutes.get('/:id', authenticate, requirePermission('sale.create'), validate(idParamSchema), asyncHandler(c.find));
salesRoutes.post('/', authenticate, requirePermission('sale.create'), validate(createSaleSchema), audit('sales.create', 'sales'), asyncHandler(c.create));
salesRoutes.post('/:id/cancel', authenticate, requirePermission('sale.cancel'), validate(idParamSchema), audit('sales.cancel', 'sales'), asyncHandler(c.cancel));
