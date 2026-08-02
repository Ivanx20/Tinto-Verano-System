import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { authenticate, requirePermission } from '../../middlewares/auth.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { validate } from '../../middlewares/validate.js';
import { ok } from '../../utils/api-response.js';
import { createCrudRoutes } from '../crud/crud.routes.js';
import { tableSchema } from '../crud/crud.schemas.js';

const statusSchema = z.object({ body: z.object({ status: z.enum(['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'BILL_REQUESTED']) }), params: z.object({ id: z.coerce.number().int().positive() }) });

export const tablesRoutes = createCrudRoutes({
  modelName: 'restaurantTable',
  entity: 'tables',
  schema: tableSchema,
  permissions: { read: ['sale.create'], create: ['settings.manage'], update: ['settings.manage'], delete: ['settings.manage'] }
});

tablesRoutes.patch('/:id/status', authenticate, requirePermission('sale.create'), validate(statusSchema), asyncHandler(async (req, res) => {
  const table = await prisma.restaurantTable.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status, updatedBy: req.auth?.sub } });
  return ok(res, table, 'Estado de mesa actualizado');
}));
