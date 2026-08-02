import { prisma } from '../../database/prisma.js';
import { AppError } from '../../middlewares/error-handler.js';
import { hashPassword } from '../../utils/security.js';

export async function list(query: Record<string, unknown>) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);
  const search = typeof query.search === 'string' ? query.search : undefined;
  const where = {
    deletedAt: null,
    ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {})
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: 'desc' },
      select: { id: true, name: true, email: true, phone: true, status: true, isActive: true, createdAt: true, userRoles: { include: { role: true } } }
    }),
    prisma.user.count({ where })
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function create(data: { name: string; email: string; password: string; phone?: string | null; roleIds: number[] }, userId?: number) {
  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (exists) throw new AppError('El correo ya existe', 409);
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      phone: data.phone,
      createdBy: userId,
      updatedBy: userId,
      userRoles: { create: data.roleIds.map((roleId) => ({ roleId })) }
    },
    select: { id: true, name: true, email: true, phone: true, status: true, userRoles: { include: { role: true } } }
  });
}

export async function update(id: number, data: { name?: string; email?: string; phone?: string | null; status?: 'ACTIVE' | 'INACTIVE' | 'LOCKED'; isActive?: boolean; roleIds?: number[] }, userId?: number) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: { name: data.name, email: data.email?.toLowerCase(), phone: data.phone, status: data.status, isActive: data.isActive, updatedBy: userId }
    });
    if (data.roleIds) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({ data: data.roleIds.map((roleId) => ({ userId: id, roleId })) });
    }
    return updated;
  });
}

export async function remove(id: number, userId?: number) {
  return prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, updatedBy: userId } });
}
