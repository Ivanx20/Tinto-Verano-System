import { describe, expect, it } from 'vitest';
import {
  generateRefreshToken,
  hashPassword,
  hashToken,
  refreshTokenExpiresAt,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
  type TokenPayload
} from './security.js';

const payload: TokenPayload = {
  sub: 7,
  email: 'cajero@tintoverano.local',
  permissions: ['sale.create', 'cash.open'],
  roles: ['CAJERO']
};

describe('Hash de contrasenas con Argon2id', () => {
  it('nunca guarda la contrasena en texto plano', async () => {
    const hash = await hashPassword('Admin#2026.Tinto');

    expect(hash).not.toContain('Admin#2026.Tinto');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('genera hashes distintos para la misma contrasena', async () => {
    const primero = await hashPassword('Admin#2026.Tinto');
    const segundo = await hashPassword('Admin#2026.Tinto');

    expect(primero).not.toBe(segundo);
  });

  it('acepta la contrasena correcta y rechaza la incorrecta', async () => {
    const hash = await hashPassword('Admin#2026.Tinto');

    await expect(verifyPassword(hash, 'Admin#2026.Tinto')).resolves.toBe(true);
    await expect(verifyPassword(hash, 'admin#2026.tinto')).resolves.toBe(false);
  });
});

describe('Access token JWT', () => {
  it('devuelve el mismo contenido despues de firmar y verificar', () => {
    const token = signAccessToken(payload);
    const verificado = verifyAccessToken(token);

    expect(verificado.sub).toBe(payload.sub);
    expect(verificado.email).toBe(payload.email);
    expect(verificado.permissions).toEqual(payload.permissions);
    expect(verificado.roles).toEqual(payload.roles);
  });

  it('rechaza un token manipulado', () => {
    const token = signAccessToken(payload);
    const manipulado = `${token.slice(0, -3)}abc`;

    expect(() => verifyAccessToken(manipulado)).toThrow();
  });

  it('rechaza un texto que no es un token', () => {
    expect(() => verifyAccessToken('token-inventado')).toThrow();
  });
});

describe('Refresh token', () => {
  it('genera valores unicos en cada llamada', () => {
    const tokens = new Set(Array.from({ length: 25 }, () => generateRefreshToken()));

    expect(tokens.size).toBe(25);
  });

  it('guarda el token hasheado y no el valor original', () => {
    const token = generateRefreshToken();
    const hash = hashToken(token);

    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(token);
    expect(hashToken(token)).toBe(hash);
  });

  it('calcula la fecha de expiracion segun REFRESH_TOKEN_DAYS', () => {
    const dias = Number(process.env.REFRESH_TOKEN_DAYS ?? 7);
    const expira = refreshTokenExpiresAt();
    const diferencia = (expira.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

    expect(diferencia).toBeGreaterThan(dias - 0.1);
    expect(diferencia).toBeLessThan(dias + 0.1);
  });
});
