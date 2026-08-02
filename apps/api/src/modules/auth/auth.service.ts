import type { Response, Request } from 'express';
import { prisma } from '../../database/prisma.js';
import { AppError } from '../../middlewares/error-handler.js';
import { generateRefreshToken, hashPassword, hashToken, refreshTokenExpiresAt, signAccessToken, verifyPassword } from '../../utils/security.js';
import { env } from '../../config/env.js';

type SafeUser = {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
};

export async function getUserWithAccess(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: {
            include: { rolePermissions: { include: { permission: true } } }
          }
        }
      }
    }
  });
}

function toSafeUser(user: NonNullable<Awaited<ReturnType<typeof getUserWithAccess>>>): SafeUser {
  const roles = user.userRoles.map((ur) => ur.role.name);
  const permissions = Array.from(
    new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.key)))
  );
  return { id: user.id, name: user.name, email: user.email, roles, permissions };
}

async function issueTokens(user: SafeUser, req: Request, res: Response) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, roles: user.roles, permissions: user.permissions });
  const refreshToken = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiresAt(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']?.slice(0, 250)
    }
  });

  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, cookieOptions);

  return { user, accessToken };
}

export async function login(email: string, password: string, req: Request, res: Response) {
  const user = await getUserWithAccess(email.toLowerCase());
  if (!user || user.deletedAt || !user.isActive) throw new AppError('Credenciales inválidas', 401);

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError('Usuario bloqueado temporalmente por intentos fallidos', 423);
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    const failedLoginCount = user.failedLoginCount + 1;
    const lockedUntil = failedLoginCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount, lockedUntil } });
    throw new AppError('Credenciales inválidas', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() }
  });

  const safeUser = toSafeUser(user);
  await prisma.auditLog.create({ data: { userId: user.id, action: 'auth.login', entity: 'users', entityId: String(user.id), ipAddress: req.ip, userAgent: req.headers['user-agent'] } });
  return issueTokens(safeUser, req, res);
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) throw new AppError('Refresh token requerido', 401);

  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null, expiresAt: { gt: new Date() } },
    include: {
      user: {
        include: {
          userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } }
        }
      }
    }
  });

  if (!stored || !stored.user.isActive || stored.user.deletedAt) throw new AppError('Refresh token inválido', 401);

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const safeUser = toSafeUser(stored.user);
  return issueTokens(safeUser, req, res);
}

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
  }
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  return { loggedOut: true };
}

export async function me(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } }
  });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return toSafeUser(user as NonNullable<typeof user>);
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) throw new AppError('Contraseña actual incorrecta', 400);

  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  return { changed: true };
}
