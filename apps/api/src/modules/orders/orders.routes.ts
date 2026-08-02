import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { authenticate, requirePermission } from '../../middlewares/auth.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import { validate } from '../../middlewares/validate.js';
import { ok } from '../../utils/api-response.js';
import { createCrudRoutes } from '../crud/crud.routes.js';
import { AppError } from '../../middlewares/error-handler.js';

type CheckoutPaymentInput = {
  method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'DEPOSIT' | 'MIXED' | 'CREDIT' | 'COURTESY' | 'INTERNAL_CONSUMPTION';
  amount: number;
  reference?: string | null;
  bank?: string | null;
};

const statusSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({ status: z.enum(['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']) })
});

const takeOrderSchema = z.object({
  body: z.object({
    tableId: z.coerce.number().int().positive(),
    notes: z.string().max(2000).optional().nullable(),
    items: z
      .array(
        z.object({
          productId: z.coerce.number().int().positive(),
          quantity: z.coerce.number().positive(),
          notes: z.string().max(255).optional().nullable()
        })
      )
      .min(1)
  })
});

const checkoutOrderSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    customerId: z.coerce.number().int().positive().optional().nullable(),
    discount: z.coerce.number().min(0).default(0),
    serviceFee: z.coerce.number().min(0).default(0),
    paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'MIXED', 'CREDIT', 'COURTESY', 'INTERNAL_CONSUMPTION']).default('CASH'),
    payments: z
      .array(
        z.object({
          method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'MIXED', 'CREDIT', 'COURTESY', 'INTERNAL_CONSUMPTION']),
          amount: z.coerce.number().positive(),
          reference: z.string().max(120).optional().nullable(),
          bank: z.string().max(120).optional().nullable()
        })
      )
      .optional()
  })
});

export const ordersRoutes = createCrudRoutes({
  modelName: 'order',
  entity: 'orders',
  permissions: { read: ['sale.create'], create: ['sale.create'], update: ['sale.create'], delete: ['sale.cancel'] }
});

ordersRoutes.post(
  '/take',
  authenticate,
  requirePermission('sale.create'),
  validate(takeOrderSchema),
  asyncHandler(async (req, res) => {
    const { tableId, items, notes } = req.body;

    const table = await prisma.restaurantTable.findFirst({ where: { id: tableId, deletedAt: null } });
    if (!table) throw new AppError('Mesa no encontrada', 404);

    const productIds = items.map((item: { productId: number }) => item.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, deletedAt: null, isActive: true, isAvailable: true } });
    const productMap = new Map(products.map((product) => [product.id, product]));
    const invalid = productIds.filter((id: number) => !productMap.has(id));
    if (invalid.length) throw new AppError(`Productos inválidos o no disponibles: ${invalid.join(', ')}`, 400);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tableId,
          waiterId: req.auth?.sub ?? null,
          status: 'PENDING',
          notes,
          createdBy: req.auth?.sub ?? null,
          updatedBy: req.auth?.sub ?? null,
          items: {
            create: items.map((item: { productId: number; quantity: number; notes?: string | null }) => ({
              productId: item.productId,
              quantity: item.quantity,
              notes: item.notes,
              status: 'PENDING',
              createdBy: req.auth?.sub ?? null,
              updatedBy: req.auth?.sub ?? null
            }))
          }
        },
        include: { table: true, items: { include: { product: true } } }
      });

      await tx.restaurantTable.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED', updatedBy: req.auth?.sub ?? null }
      });

      await tx.auditLog.create({
        data: {
          userId: req.auth?.sub,
          action: 'orders.take',
          entity: 'orders',
          entityId: String(created.id),
          metadata: { tableId, items: items.length }
        }
      });

      return created;
    });

    return ok(res, order, 'Comanda creada correctamente');
  })
);

ordersRoutes.post(
  '/:id/checkout',
  authenticate,
  requirePermission('sale.create'),
  validate(checkoutOrderSchema),
  asyncHandler(async (req, res) => {
    const orderId = Number(req.params.id);
    const order = await prisma.order.findFirst({
      where: { id: orderId, deletedAt: null, status: { in: ['READY', 'DELIVERED'] } },
      include: { items: { where: { deletedAt: null }, include: { product: true } } }
    });
    if (!order) throw new AppError('Comanda no encontrada o no lista para facturar', 404);
    if (!order.items.length) throw new AppError('La comanda no tiene items para facturar', 400);

    const discount = Number(req.body.discount ?? 0);
    const serviceFee = Number(req.body.serviceFee ?? 0);
    const providedPayments = (req.body.payments ?? []) as CheckoutPaymentInput[];
    const hasMixedPayments = providedPayments.length > 0;
    const effectivePaymentMethod = hasMixedPayments ? 'MIXED' : req.body.paymentMethod;

    if ((effectivePaymentMethod === 'CREDIT' || providedPayments.some((payment: CheckoutPaymentInput) => payment.method === 'CREDIT')) && !req.body.customerId) {
      throw new AppError('Para facturar a crédito debes seleccionar un cliente', 400);
    }
    let subtotal = 0;
    const details = order.items.map((item) => {
      const unitPrice = Number(item.product.price);
      const lineSubtotal = unitPrice * Number(item.quantity);
      subtotal += lineSubtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        discount: 0,
        subtotal: lineSubtotal,
        notes: item.notes,
        createdBy: req.auth?.sub ?? null,
        updatedBy: req.auth?.sub ?? null
      };
    });

    const taxable = Math.max(subtotal - discount, 0);
    const tax = taxable * 0.15;
    const total = taxable + serviceFee + tax;
    const paymentTotal = hasMixedPayments ? providedPayments.reduce((sum: number, payment: CheckoutPaymentInput) => sum + Number(payment.amount), 0) : total;

    if (Math.abs(paymentTotal - total) > 0.01) {
      throw new AppError('La suma de pagos no coincide con el total de la cuenta', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          customerId: req.body.customerId ?? null,
          cashierId: req.auth?.sub ?? null,
          saleNumber: `VT-ORDER-${order.id}-${Date.now()}`,
          saleType: 'DINE_IN',
          status: effectivePaymentMethod === 'CREDIT' ? 'CREDIT' : 'COMPLETED',
          subtotal,
          discount,
          serviceFee,
          tax,
          total,
          notes: `Facturación de comanda #${order.id}`,
          createdBy: req.auth?.sub ?? null,
          updatedBy: req.auth?.sub ?? null,
          details: { create: details },
          payments: {
            create: hasMixedPayments
              ? providedPayments.map((payment: CheckoutPaymentInput) => ({
                  method: payment.method,
                  amount: payment.amount,
                  status: 'CONFIRMED',
                  reference: payment.reference,
                  bank: payment.bank,
                  createdBy: req.auth?.sub ?? null,
                  updatedBy: req.auth?.sub ?? null
                }))
              : [
                  {
                    method: req.body.paymentMethod,
                    amount: total,
                    status: 'CONFIRMED',
                    createdBy: req.auth?.sub ?? null,
                    updatedBy: req.auth?.sub ?? null
                  }
                ]
          }
        }
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'DELIVERED', updatedBy: req.auth?.sub ?? null }
      });

      if (order.tableId) {
        await tx.restaurantTable.update({
          where: { id: order.tableId },
          data: { status: 'FREE', updatedBy: req.auth?.sub ?? null }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: req.auth?.sub,
          action: 'orders.checkout',
          entity: 'orders',
          entityId: String(order.id),
          metadata: { saleId: sale.id, total }
        }
      });

      return sale;
    });

    return ok(res, result, 'Comanda facturada correctamente');
  })
);

ordersRoutes.patch(
  '/:id/status',
  authenticate,
  requirePermission('sale.create'),
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const orderId = Number(req.params.id);
    const existing = await prisma.order.findFirst({ where: { id: orderId, deletedAt: null } });
    if (!existing) throw new AppError('Orden no encontrada', 404);

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: req.body.status, updatedBy: req.auth?.sub ?? null }
    });
    return ok(res, order, 'Estado de orden actualizado');
  })
);
