import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const permissionKeys = [
  ['dashboard.view', 'Ver dashboard'],
  ['sale.create', 'Crear venta'],
  ['sale.cancel', 'Anular venta'],
  ['discount.apply', 'Aplicar descuento'],
  ['cash.open', 'Abrir caja'],
  ['cash.close', 'Cerrar caja'],
  ['product.create', 'Crear producto'],
  ['product.update', 'Editar producto'],
  ['product.delete', 'Eliminar producto'],
  ['reports.view', 'Ver reportes'],
  ['profit.view', 'Ver utilidad'],
  ['user.create', 'Crear usuario'],
  ['settings.manage', 'Configurar sistema'],
  ['purchase.create', 'Registrar compra'],
  ['inventory.adjust', 'Ajustar inventario'],
  ['accounts_receivable.view', 'Ver cuentas por cobrar'],
  ['accounts_payable.view', 'Ver cuentas por pagar'],
  ['audit.view', 'Ver auditoría']
] as const;

const roleNames = [
  'SUPER_ADMIN',
  'GERENTE',
  'ADMINISTRADOR',
  'CAJERO',
  'MESERO',
  'COCINA',
  'BARRA',
  'BODEGA',
  'CONTADOR'
];

async function main() {
  const permissions = [];
  for (const [key, description] of permissionKeys) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description }
    });
    permissions.push(permission);
  }

  for (const name of roleNames) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: `Rol ${name}` } });
  }

  const superAdmin = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } });
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdmin.id, permissionId: permission.id }
    });
  }

  const gerente = await prisma.role.findUniqueOrThrow({ where: { name: 'GERENTE' } });
  for (const permission of permissions.filter((p) => !p.key.startsWith('settings.'))) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: gerente.id, permissionId: permission.id } },
      update: {},
      create: { roleId: gerente.id, permissionId: permission.id }
    });
  }

  const rolePermissionMap: Record<string, string[]> = {
    ADMINISTRADOR: [
      'dashboard.view', 'sale.create', 'sale.cancel', 'discount.apply', 'cash.open', 'cash.close',
      'product.create', 'product.update', 'reports.view', 'purchase.create', 'inventory.adjust',
      'accounts_receivable.view', 'accounts_payable.view'
    ],
    CAJERO: ['dashboard.view', 'sale.create', 'discount.apply', 'cash.open', 'cash.close', 'accounts_receivable.view'],
    MESERO: ['sale.create'],
    COCINA: ['sale.create'],
    BARRA: ['sale.create'],
    BODEGA: ['inventory.adjust', 'purchase.create'],
    CONTADOR: ['reports.view', 'accounts_receivable.view', 'accounts_payable.view', 'cash.close']
  };

  for (const [roleName, permissionKeysForRole] of Object.entries(rolePermissionMap)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    for (const permissionKey of permissionKeysForRole) {
      const permission = permissions.find((p) => p.key === permissionKey);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id }
      });
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@tintoverano.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin#2026.Tinto';
  const adminName = process.env.SEED_ADMIN_NAME || 'Administrador Tinto Verano';
  const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash, status: 'ACTIVE' },
    create: { name: adminName, email: adminEmail, passwordHash, status: 'ACTIVE' }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdmin.id }
  });

  const demoPassword = process.env.SEED_DEMO_PASSWORD || 'Demo#2026.Tinto';
  const demoPasswordHash = await argon2.hash(demoPassword, { type: argon2.argon2id });
  const demoUsers = [
    { role: 'GERENTE', email: 'gerente@tintoverano.local', name: 'Gerente General' },
    { role: 'ADMINISTRADOR', email: 'administrador@tintoverano.local', name: 'Administrador Operativo' },
    { role: 'CAJERO', email: 'cajero@tintoverano.local', name: 'Cajero Principal' },
    { role: 'MESERO', email: 'mesero@tintoverano.local', name: 'Mesero Sala 1' },
    { role: 'COCINA', email: 'cocina@tintoverano.local', name: 'Jefe de Cocina' },
    { role: 'BARRA', email: 'barra@tintoverano.local', name: 'Encargado de Barra' },
    { role: 'BODEGA', email: 'bodega@tintoverano.local', name: 'Responsable de Bodega' },
    { role: 'CONTADOR', email: 'contador@tintoverano.local', name: 'Contador General' }
  ] as const;

  for (const demo of demoUsers) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: demo.role } });
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: { name: demo.name, passwordHash: demoPasswordHash, status: 'ACTIVE', isActive: true, deletedAt: null },
      create: { name: demo.name, email: demo.email, passwordHash: demoPasswordHash, status: 'ACTIVE', isActive: true }
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id }
    });
  }

  const categories = [
    ['Entradas', 'Aperitivos y piqueos', '#D6A044'],
    ['Grill', 'Carnes, parrilla y platos fuertes', '#8A1020'],
    ['Wings', 'Alitas y combos', '#B45309'],
    ['Drinks', 'Bebidas, cocteles y vinos', '#7C2D12'],
    ['Postres', 'Dulces de la casa', '#A855F7']
  ];

  for (const [name, description, color] of categories) {
    await prisma.productCategory.upsert({
      where: { name },
      update: { description, color },
      create: { name, description, color }
    });
  }

  const grill = await prisma.productCategory.findUniqueOrThrow({ where: { name: 'Grill' } });
  const wings = await prisma.productCategory.findUniqueOrThrow({ where: { name: 'Wings' } });
  const drinks = await prisma.productCategory.findUniqueOrThrow({ where: { name: 'Drinks' } });

  const products = [
    { name: 'Hamburguesa Tinto Verano', sku: 'TV-HAMB-001', categoryId: grill.id, price: 8.99, cost: 3.8, productType: 'PLATO' },
    { name: 'Alitas BBQ Doradas', sku: 'TV-WING-001', categoryId: wings.id, price: 7.5, cost: 2.9, productType: 'PLATO' },
    { name: 'Parrillada Premium', sku: 'TV-GRILL-001', categoryId: grill.id, price: 18.9, cost: 8.2, productType: 'PLATO' },
    { name: 'Tinto Verano Signature', sku: 'TV-DRINK-001', categoryId: drinks.id, price: 5.75, cost: 1.6, productType: 'BEBIDA' }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: { ...product, description: 'Producto inicial del menú premium.' }
    });
  }

  await prisma.warehouse.upsert({
    where: { name: 'Bodega Principal' },
    update: {},
    create: { name: 'Bodega Principal', location: 'Área interna' }
  });

  const warehouse = await prisma.warehouse.findUniqueOrThrow({ where: { name: 'Bodega Principal' } });
  const inventoryItems = [
    { name: 'Carne premium', unit: 'kg', currentStock: 25, minimumStock: 5, averageCost: 6.5 },
    { name: 'Alitas de pollo', unit: 'kg', currentStock: 30, minimumStock: 8, averageCost: 3.1 },
    { name: 'Papas', unit: 'kg', currentStock: 40, minimumStock: 10, averageCost: 1.2 },
    { name: 'Vino tinto', unit: 'botella', currentStock: 18, minimumStock: 4, averageCost: 7.8 }
  ];

  for (const item of inventoryItems) {
    const existing = await prisma.inventoryItem.findFirst({ where: { name: item.name, warehouseId: warehouse.id } });
    if (!existing) await prisma.inventoryItem.create({ data: { ...item, warehouseId: warehouse.id } });
  }

  for (let i = 1; i <= 12; i++) {
    const name = `Mesa ${i.toString().padStart(2, '0')}`;
    const existing = await prisma.restaurantTable.findFirst({ where: { name } });
    if (!existing) await prisma.restaurantTable.create({ data: { name, capacity: i <= 8 ? 4 : 6, location: i <= 6 ? 'Salón principal' : 'Terraza' } });
  }

  await prisma.companySettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      businessName: 'Tinto Verano',
      ruc: '0999999999001',
      address: 'Guayaquil, Ecuador',
      phone: '+593 99 999 9999',
      email: 'contacto@tintoverano.local',
      taxRate: 15,
      serviceFeeRate: 10,
      sriEnvironment: 'TEST'
    }
  });

  console.log('Seed completado.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
