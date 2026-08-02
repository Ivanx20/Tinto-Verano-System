import { Router } from 'express';
import { prisma } from '../../database/prisma.js';
import { authenticate, requirePermission } from '../../middlewares/auth.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { createCrudRoutes } from '../crud/crud.routes.js';
import { inventoryItemSchema } from '../crud/crud.schemas.js';

export const inventoryRoutes = Router();

inventoryRoutes.get('/kardex/:itemId', authenticate, requirePermission('inventory.adjust'), asyncHandler(async (req, res) => {
  const movements = await prisma.inventoryMovement.findMany({ where: { inventoryItemId: Number(req.params.itemId), deletedAt: null }, orderBy: { id: 'desc' } });
  return ok(res, movements);
}));

inventoryRoutes.use('/movements', createCrudRoutes({ modelName: 'inventoryMovement', entity: 'inventory_movements', permissions: { read: ['inventory.adjust'], create: ['inventory.adjust'], update: ['inventory.adjust'], delete: ['inventory.adjust'] } }));
inventoryRoutes.use('/', createCrudRoutes({ modelName: 'inventoryItem', entity: 'inventory', schema: inventoryItemSchema, permissions: { read: ['inventory.adjust'], create: ['inventory.adjust'], update: ['inventory.adjust'], delete: ['inventory.adjust'] } }));
