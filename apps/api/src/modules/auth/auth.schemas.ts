import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(180),
    password: z.string().min(8).max(128)
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8).max(128),
    newPassword: z
      .string()
      .min(10)
      .max(128)
      .regex(/[A-Z]/, 'Debe incluir una mayúscula')
      .regex(/[a-z]/, 'Debe incluir una minúscula')
      .regex(/[0-9]/, 'Debe incluir un número')
      .regex(/[^A-Za-z0-9]/, 'Debe incluir un símbolo')
  })
});
