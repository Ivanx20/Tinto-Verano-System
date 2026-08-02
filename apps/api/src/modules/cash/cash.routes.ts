import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { authenticate, requirePermission } from '../../middlewares/auth.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { validate } from '../../middlewares/validate.js';
import { ok, created } from '../../utils/api-response.js';
import { AppError } from '../../middlewares/error-handler.js';
import { createCrudRoutes } from '../crud/crud.routes.js';

export const cashRoutes = Router();

const openSchema = z.object({ body: z.object({ openingAmount: z.coerce.number().nonnegative() }) });
const closeSchema = z.object({ body: z.object({ closingAmount: z.coerce.number().nonnegative() }) });
const movementSchema = z.object({ body: z.object({ type: z.string().max(30), amount: z.coerce.number().positive(), reason: z.string().max(255).optional(), reference: z.string().max(120).optional() }) });

cashRoutes.post('/open', authenticate, requirePermission('cash.open'), validate(openSchema), asyncHandler(async (req, res) => {
  const existing = await prisma.cashRegister.findFirst({ where: { status: 'OPEN', deletedAt: null } });
  if (existing) throw new AppError('Ya existe una caja abierta', 409);
  const register = await prisma.cashRegister.create({ data: { openedBy: req.auth!.sub, openingAmount: req.body.openingAmount, createdBy: req.auth!.sub, updatedBy: req.auth!.sub } });
  return created(res, register, 'Caja abierta correctamente');
}));

cashRoutes.post('/close', authenticate, requirePermission('cash.close'), validate(closeSchema), asyncHandler(async (req, res) => {
  const current = await prisma.cashRegister.findFirst({ where: { status: 'OPEN', deletedAt: null }, include: { movements: true } });
  if (!current) throw new AppError('No hay caja abierta', 404);
  const movementsTotal = current.movements.reduce((acc, m) => acc + (m.type === 'OUT' ? -Number(m.amount) : Number(m.amount)), 0);
  const expectedAmount = Number(current.openingAmount) + movementsTotal;
  const difference = Number(req.body.closingAmount) - expectedAmount;
  const register = await prisma.cashRegister.update({ where: { id: current.id }, data: { status: 'CLOSED', closedBy: req.auth!.sub, closedAt: new Date(), closingAmount: req.body.closingAmount, expectedAmount, difference, updatedBy: req.auth!.sub } });
  return ok(res, register, 'Caja cerrada correctamente');
}));

cashRoutes.get('/current', authenticate, requirePermission('cash.open'), asyncHandler(async (_req, res) => {
  const current = await prisma.cashRegister.findFirst({ where: { status: 'OPEN', deletedAt: null }, include: { movements: true } });
  return ok(res, current);
}));

cashRoutes.post('/movements', authenticate, requirePermission('cash.open'), validate(movementSchema), asyncHandler(async (req, res) => {
  const current = await prisma.cashRegister.findFirst({ where: { status: 'OPEN', deletedAt: null } });
  if (!current) throw new AppError('No hay caja abierta', 404);
  const movement = await prisma.cashMovement.create({ data: { cashRegisterId: current.id, type: req.body.type, amount: req.body.amount, reason: req.body.reason, reference: req.body.reference, createdBy: req.auth!.sub, updatedBy: req.auth!.sub } });
  return created(res, movement, 'Movimiento registrado');
}));

cashRoutes.use('/movements', createCrudRoutes({ modelName: 'cashMovement', entity: 'cash_movements', permissions: { read: ['cash.open'], create: ['cash.open'], update: ['cash.close'], delete: ['settings.manage'] } }));
cashRoutes.use('/', createCrudRoutes({ modelName: 'cashRegister', entity: 'cash', permissions: { read: ['cash.open'], create: ['cash.open'], update: ['cash.close'], delete: ['settings.manage'] } }));
