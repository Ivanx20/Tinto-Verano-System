import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';
import { signAccessToken } from '../utils/security.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('Health check de la API', () => {
  it('responde 200 en GET /api/health', async () => {
    const respuesta = await fetch(`${baseUrl}/api/health`);
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(200);
    expect(cuerpo.success).toBe(true);
    expect(typeof cuerpo.data.uptime).toBe('number');
  });

  it('no expone la tecnologia del servidor en las cabeceras', async () => {
    const respuesta = await fetch(`${baseUrl}/api/health`);

    expect(respuesta.headers.get('x-powered-by')).toBeNull();
    expect(respuesta.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('Rutas inexistentes', () => {
  it('devuelve 404 con el formato de error del sistema', async () => {
    const respuesta = await fetch(`${baseUrl}/api/modulo-que-no-existe`);
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(404);
    expect(cuerpo.success).toBe(false);
    expect(cuerpo.message).toContain('Ruta no encontrada');
  });
});

describe('Proteccion de los modulos del negocio', () => {
  it('bloquea /api/sales cuando no se envia token', async () => {
    const respuesta = await fetch(`${baseUrl}/api/sales`);
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(401);
    expect(cuerpo.message).toBe('No autenticado');
  });

  it('bloquea /api/sales cuando el token es invalido', async () => {
    const respuesta = await fetch(`${baseUrl}/api/sales`, {
      headers: { Authorization: 'Bearer token-falsificado' }
    });

    expect(respuesta.status).toBe(401);
  });

  it('devuelve 403 cuando el token es valido pero no tiene el permiso sale.create', async () => {
    const token = signAccessToken({
      sub: 99,
      email: 'mesero@tintoverano.local',
      permissions: ['order.create'],
      roles: ['MESERO']
    });

    const respuesta = await fetch(`${baseUrl}/api/sales`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const cuerpo = await respuesta.json();

    expect(respuesta.status).toBe(403);
    expect(cuerpo.message).toBe('No autorizado');
  });
});
