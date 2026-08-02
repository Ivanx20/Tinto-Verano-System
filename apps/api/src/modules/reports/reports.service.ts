import { prisma } from '../../database/prisma.js';

export async function dashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayAgg, monthAgg, ordersCount, occupiedTables, lowStockItems, receivable, payable, products] = await Promise.all([
    prisma.sale.aggregate({ where: { createdAt: { gte: today }, status: { not: 'CANCELLED' }, deletedAt: null }, _sum: { total: true }, _count: true, _avg: { total: true } }),
    prisma.sale.aggregate({ where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' }, deletedAt: null }, _sum: { total: true }, _count: true }),
    prisma.order.count({ where: { createdAt: { gte: today }, deletedAt: null } }),
    prisma.restaurantTable.count({ where: { status: 'OCCUPIED', deletedAt: null } }),
    prisma.inventoryItem.findMany({ where: { deletedAt: null }, select: { currentStock: true, minimumStock: true } }),
    prisma.accountsReceivable.aggregate({ where: { status: { in: ['PENDING', 'PARTIAL'] }, deletedAt: null }, _sum: { amount: true, paidAmount: true } }),
    prisma.accountsPayable.aggregate({ where: { status: { in: ['PENDING', 'PARTIAL'] }, deletedAt: null }, _sum: { amount: true, paidAmount: true } }),
    prisma.saleDetail.groupBy({ by: ['productId'], _sum: { quantity: true, subtotal: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 })
  ]);

  const productIds = products.map((p) => p.productId);
  const productNames = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });
  const nameMap = new Map(productNames.map((p) => [p.id, p.name]));

  const chart = await prisma.sale.findMany({
    where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' }, deletedAt: null },
    select: { createdAt: true, total: true },
    orderBy: { createdAt: 'asc' }
  });

  return {
    metrics: {
      todaySales: Number(todayAgg._sum.total ?? 0),
      monthSales: Number(monthAgg._sum.total ?? 0),
      totalOrders: ordersCount,
      averageTicket: Number(todayAgg._avg.total ?? 0),
      occupiedTables,
      lowStock: lowStockItems.filter((item) => Number(item.currentStock) <= Number(item.minimumStock)).length,
      receivableBalance: Number(receivable._sum.amount ?? 0) - Number(receivable._sum.paidAmount ?? 0),
      payableBalance: Number(payable._sum.amount ?? 0) - Number(payable._sum.paidAmount ?? 0)
    },
    topProducts: products.map((p) => ({ productId: p.productId, name: nameMap.get(p.productId) ?? 'Producto', quantity: Number(p._sum.quantity ?? 0), total: Number(p._sum.subtotal ?? 0) })),
    salesChart: chart.map((s) => ({ date: s.createdAt.toISOString().slice(0, 10), total: Number(s.total) }))
  };
}

export async function sales() {
  return dashboard();
}
