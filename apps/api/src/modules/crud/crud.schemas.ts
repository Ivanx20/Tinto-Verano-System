import { z } from 'zod';

export const idParamSchema = z.object({ params: z.object({ id: z.coerce.number().int().positive() }) });

export const listQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().max(120).optional()
  })
});

const baseAuditFields = {
  isActive: z.boolean().optional()
};

export const productSchema = z.object({
  body: z.object({
    categoryId: z.number().int().positive().nullable().optional(),
    name: z.string().min(2).max(180),
    description: z.string().max(2000).optional().nullable(),
    sku: z.string().max(80).optional().nullable(),
    price: z.coerce.number().nonnegative(),
    cost: z.coerce.number().nonnegative().optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
    imageUrl: z.string().max(255).optional().nullable(),
    productType: z.string().max(40).optional(),
    isAvailable: z.boolean().optional(),
    ...baseAuditFields
  })
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    description: z.string().max(255).optional().nullable(),
    color: z.string().max(30).optional().nullable(),
    ...baseAuditFields
  })
});

export const customerSchema = z.object({
  body: z.object({
    identificationType: z.string().max(30).optional(),
    identification: z.string().max(40).optional().nullable(),
    name: z.string().min(2).max(180),
    email: z.string().email().max(180).optional().nullable(),
    phone: z.string().max(40).optional().nullable(),
    address: z.string().max(255).optional().nullable(),
    birthday: z.coerce.date().optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
    ...baseAuditFields
  })
});

export const supplierSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(180),
    ruc: z.string().max(40).optional().nullable(),
    email: z.string().email().max(180).optional().nullable(),
    phone: z.string().max(40).optional().nullable(),
    address: z.string().max(255).optional().nullable(),
    contactPerson: z.string().max(150).optional().nullable(),
    ...baseAuditFields
  })
});

export const tableSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(80),
    capacity: z.coerce.number().int().positive().optional(),
    location: z.string().max(120).optional().nullable(),
    status: z.enum(['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'BILL_REQUESTED']).optional(),
    ...baseAuditFields
  })
});

export const inventoryItemSchema = z.object({
  body: z.object({
    ingredientId: z.number().int().positive().nullable().optional(),
    warehouseId: z.number().int().positive(),
    name: z.string().min(2).max(180),
    unit: z.string().min(1).max(20),
    currentStock: z.coerce.number().optional(),
    minimumStock: z.coerce.number().optional(),
    averageCost: z.coerce.number().optional(),
    expirationDate: z.coerce.date().optional().nullable(),
    ...baseAuditFields
  })
});

export const reservationSchema = z.object({
  body: z.object({
    customerId: z.number().int().positive().optional().nullable(),
    tableId: z.number().int().positive().optional().nullable(),
    customerName: z.string().min(2).max(180),
    phone: z.string().max(40).optional().nullable(),
    peopleCount: z.coerce.number().int().positive(),
    reservationAt: z.coerce.date(),
    occasion: z.string().max(120).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    status: z.string().max(30).optional(),
    ...baseAuditFields
  })
});

export const promotionSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    description: z.string().max(2000).optional().nullable(),
    type: z.string().max(40),
    value: z.coerce.number().nonnegative(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    isActiveNow: z.boolean().optional(),
    ...baseAuditFields
  })
});

export const roleSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    description: z.string().max(255).optional().nullable(),
    ...baseAuditFields
  })
});
