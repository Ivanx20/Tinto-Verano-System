import { prisma } from '../../database/prisma.js';
import { AppError } from '../../middlewares/error-handler.js';

export async function list(query: Record<string, unknown>) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const [items, total] = await prisma.$transaction([
    prisma.sale.findMany({ where: { deletedAt: null }, include: { customer: true, details: { include: { product: true } }, payments: true }, orderBy: { id: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.sale.count({ where: { deletedAt: null } })
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function find(id: number) {
  const sale = await prisma.sale.findFirst({ where: { id, deletedAt: null }, include: { customer: true, details: { include: { product: true } }, payments: true, invoices: true } });
  if (!sale) throw new AppError('Venta no encontrada', 404);
  return sale;
}

export async function create(data: any, userId?: number) {
  return prisma.$transaction(async (tx) => {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new AppError('La venta debe incluir al menos un producto', 400);
    }

    const products = await tx.product.findMany({ where: { id: { in: data.items.map((i: any) => i.productId) }, deletedAt: null } });
    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;

    const details = data.items.map((item: any) => {
      const product = productMap.get(item.productId);
      if (!product) throw new AppError(`Producto no encontrado: ${item.productId}`, 404);
      if (!product.isAvailable || !product.isActive) throw new AppError(`Producto no disponible para la venta: ${product.name}`, 409);
      const unitPrice = Number(item.unitPrice ?? product.price);
      const lineSubtotal = unitPrice * Number(item.quantity) - Number(item.discount ?? 0);
      subtotal += lineSubtotal;
      return { productId: item.productId, quantity: item.quantity, unitPrice, discount: item.discount ?? 0, subtotal: lineSubtotal, notes: item.notes, createdBy: userId, updatedBy: userId };
    });

    const discount = Number(data.discount ?? 0);
    const serviceFee = Number(data.serviceFee ?? 0);
    const tax = Math.max(subtotal - discount, 0) * 0.15;
    const total = Math.max(subtotal - discount, 0) + serviceFee + tax;
    const paymentTotal = (data.payments ?? []).reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);
    const hasCreditPayment = Boolean((data.payments ?? []).some((p: any) => p.method === 'CREDIT'));

    if (!hasCreditPayment && Math.abs(paymentTotal - total) > 0.01) {
      throw new AppError('El total de pagos no cuadra con el total de la venta', 400);
    }

    if (hasCreditPayment && !data.customerId) {
      throw new AppError('Las ventas a crédito requieren cliente asociado', 400);
    }

    const saleNumber = `VT-${Date.now()}`;

    const sale = await tx.sale.create({
      data: {
        customerId: data.customerId,
        cashierId: userId,
        saleNumber,
        saleType: data.saleType,
        subtotal,
        discount,
        serviceFee,
        tax,
        total,
        notes: data.notes,
        status: data.payments?.some((p: any) => p.method === 'CREDIT') ? 'CREDIT' : 'COMPLETED',
        createdBy: userId,
        updatedBy: userId,
        details: { create: details },
        payments: { create: (data.payments ?? []).map((p: any) => ({ method: p.method, amount: p.amount, reference: p.reference, bank: p.bank, createdBy: userId, updatedBy: userId })) }
      },
      include: { details: true, payments: true }
    });

    await tx.auditLog.create({ data: { userId, action: 'sales.create', entity: 'sales', entityId: String(sale.id), metadata: { total, saleNumber } } });
    return sale;
  });
}

export async function cancel(id: number, userId?: number) {
  const sale = await prisma.sale.findFirst({ where: { id, deletedAt: null } });
  if (!sale) throw new AppError('Venta no encontrada', 404);
  return prisma.sale.update({ where: { id }, data: { status: 'CANCELLED', updatedBy: userId } });
}
