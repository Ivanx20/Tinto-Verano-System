import { prisma } from '../../database/prisma.js';
import { AppError } from '../../middlewares/error-handler.js';

type ModelName =
  | 'user'
  | 'role'
  | 'productCategory'
  | 'product'
  | 'customer'
  | 'supplier'
  | 'restaurantTable'
  | 'order'
  | 'inventoryItem'
  | 'inventoryMovement'
  | 'purchase'
  | 'cashRegister'
  | 'cashMovement'
  | 'sale'
  | 'reservation'
  | 'promotion'
  | 'companySettings'
  | 'auditLog'
  | 'accountsReceivable'
  | 'accountsPayable';

const searchable: Partial<Record<ModelName, string[]>> = {
  user: ['name', 'email'],
  role: ['name', 'description'],
  productCategory: ['name', 'description'],
  product: ['name', 'sku', 'description'],
  customer: ['name', 'email', 'phone', 'identification'],
  supplier: ['name', 'ruc', 'email'],
  restaurantTable: ['name', 'location'],
  inventoryItem: ['name', 'unit'],
  sale: ['saleNumber', 'notes'],
  reservation: ['customerName', 'phone', 'occasion'],
  promotion: ['name', 'description'],
  auditLog: ['action', 'entity']
};

function model(modelName: ModelName) {
  return (prisma as unknown as Record<string, any>)[modelName];
}

function relationInclude(modelName: ModelName) {
  if (modelName === 'order') {
    return {
      table: true,
      items: { include: { product: true }, where: { deletedAt: null } }
    };
  }
  return undefined;
}

function buildWhere(modelName: ModelName, search?: string) {
  const base: Record<string, unknown> = {};
  if (modelName !== 'auditLog') base.deletedAt = null;
  if (search && searchable[modelName]?.length) {
    base.OR = searchable[modelName]!.map((field) => ({ [field]: { contains: search } }));
  }
  return base;
}

export async function list(modelName: ModelName, query: Record<string, unknown>) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const search = typeof query.search === 'string' ? query.search : undefined;
  const status = typeof query.status === 'string' ? query.status : undefined;
  const tableId = Number(query.tableId);
  const skip = (page - 1) * limit;
  const where = buildWhere(modelName, search);
  if (status && modelName === 'order') where.status = status;
  if (!Number.isNaN(tableId) && tableId > 0 && modelName === 'order') where.tableId = tableId;
  const include = relationInclude(modelName);

  const delegate = model(modelName);
  const [items, total] = await prisma.$transaction([
    delegate.findMany({ where, include, skip, take: limit, orderBy: { id: 'desc' } }),
    delegate.count({ where })
  ]);

  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function findById(modelName: ModelName, id: number) {
  const include = relationInclude(modelName);
  const item = await model(modelName).findFirst({ where: { id, ...(modelName === 'auditLog' ? {} : { deletedAt: null }) }, include });
  if (!item) throw new AppError('Registro no encontrado', 404);
  return item;
}

export async function create(modelName: ModelName, data: Record<string, unknown>, userId?: number) {
  const clean: Record<string, unknown> = { ...data, createdBy: userId ?? null, updatedBy: userId ?? null };
  delete clean.id;
  delete clean.createdAt;
  delete clean.updatedAt;
  delete clean.deletedAt;
  return model(modelName).create({ data: clean });
}

export async function update(modelName: ModelName, id: number, data: Record<string, unknown>, userId?: number) {
  await findById(modelName, id);
  const clean: Record<string, unknown> = { ...data, updatedBy: userId ?? null };
  delete clean.id;
  delete clean.createdAt;
  delete clean.updatedAt;
  delete clean.deletedAt;
  return model(modelName).update({ where: { id }, data: clean });
}

export async function softDelete(modelName: ModelName, id: number, userId?: number) {
  await findById(modelName, id);
  return model(modelName).update({ where: { id }, data: { deletedAt: new Date(), isActive: false, updatedBy: userId ?? null } });
}
