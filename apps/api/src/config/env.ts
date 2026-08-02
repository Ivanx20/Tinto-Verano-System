import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4100),
  API_URL: z.string().url().default('http://localhost:4100'),
  WEB_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  TRUST_PROXY: z.string().default('false'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().default(7),
  ARGON2_MEMORY_COST: z.coerce.number().default(19456),
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(1),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(15),
  RATE_LIMIT_MAX: z.coerce.number().default(250),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(8)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
  trustProxy: parsed.data.TRUST_PROXY === 'true'
};
