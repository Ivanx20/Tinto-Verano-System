import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150),
    email: z.string().email().max(180),
    password: z.string().min(10).max(128),
    phone: z.string().max(40).optional().nullable(),
    roleIds: z.array(z.number().int().positive()).min(1)
  })
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(150).optional(),
    email: z.string().email().max(180).optional(),
    phone: z.string().max(40).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
    isActive: z.boolean().optional(),
    roleIds: z.array(z.number().int().positive()).optional()
  })
});
