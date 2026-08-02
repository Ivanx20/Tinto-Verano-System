import { z } from 'zod';

export const createSaleSchema = z.object({
  body: z.object({
    customerId: z.number().int().positive().optional().nullable(),
    saleType: z.string().max(40).default('DINE_IN'),
    discount: z.coerce.number().nonnegative().default(0),
    serviceFee: z.coerce.number().nonnegative().default(0),
    notes: z.string().max(2000).optional().nullable(),
    items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.coerce.number().positive(), unitPrice: z.coerce.number().nonnegative().optional(), discount: z.coerce.number().nonnegative().default(0), notes: z.string().max(255).optional().nullable() })).min(1),
    payments: z.array(z.object({ method: z.enum(['CASH','CREDIT_CARD','DEBIT_CARD','TRANSFER','DEPOSIT','MIXED','CREDIT','COURTESY','INTERNAL_CONSUMPTION']), amount: z.coerce.number().nonnegative(), reference: z.string().max(120).optional().nullable(), bank: z.string().max(120).optional().nullable() })).default([])
  })
});
