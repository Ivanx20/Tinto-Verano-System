# Tinto Verano System

Sistema profesional para comedor/restaurante elegante: **POS + facturación preparada + mesas + comandas + inventario + compras + caja + reportes + auditoría + seguridad**.

## Stack

- Frontend: React 19+, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, Zod, Recharts, Lucide.
- Backend: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL.
- Seguridad: JWT access token corto, refresh token rotativo con hash, cookies HttpOnly, Helmet, CSP, CORS allowlist, rate limit, validación Zod, Argon2id, auditoría, soft delete, permisos por rol.

## Estructura

```txt
tinto-verano-system/
├── apps/web     # React + Vite
├── apps/api     # Express + Prisma + PostgreSQL
└── docs         # Documentación técnica
```

## Instalación rápida

```bash
npm install
cp .env.example apps/api/.env
```

Edita `apps/api/.env` y configura tu conexión PostgreSQL:

```env
DATABASE_URL="postgresql://tinto_user:tinto_password@localhost:5432/tinto_verano_db?schema=public"
```

Crea la base y el usuario en PostgreSQL (o usa el script `scripts/create_postgresql_database.sql`):

```bash
psql -U postgres -f scripts/create_postgresql_database.sql
```

```sql
CREATE USER tinto_user WITH PASSWORD 'tinto_password';
CREATE DATABASE tinto_verano_db OWNER tinto_user;
GRANT ALL PRIVILEGES ON DATABASE tinto_verano_db TO tinto_user;
```

Genera cliente Prisma, migra y carga datos iniciales:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Ejecuta API y frontend:

```bash
npm run dev
```

URLs:

- API: `http://localhost:4100/api/health`
- Frontend: `http://localhost:5173`

Usuario inicial:

```txt
Email: admin@tintoverano.local
Clave: Admin#2026.Tinto
```

## Módulos incluidos

- Login seguro con roles y permisos.
- Dashboard gerencial.
- POS visual.
- Mesas y comandas.
- Pantalla de cocina.
- Productos, categorías, clientes, proveedores.
- Inventario y movimientos.
- Compras.
- Caja.
- Ventas.
- Cuentas por cobrar y pagar.
- Reservas.
- Promociones.
- Configuración.
- Auditoría.

## Fases ejecutadas en este repositorio

- Fase 1: estructura monorepo, auth segura, hardening base backend/frontend, layout principal.
- Fase 2: POS operativo, ventas, mesas, productos y clientes con CRUD real.
- Fase 3: inventario, compras, caja y pagos mediante endpoints y pantallas administrativas.
- Fase 4: reportes, reservas, promociones, auditoría y configuración central.
- Fase 5: lint/build estables, documentación API/seguridad/despliegue y mejoras de robustez.

## Documentación

- [API](docs/api.md)
- [Base de datos](docs/database.md)
- [Despliegue](docs/deployment.md)
- [Seguridad](docs/security.md)

## Nota importante de seguridad

Este proyecto implementa controles fuertes de base, pero ningún sistema queda “blindado al 100%”. Para producción se debe ejecutar revisión de código, pruebas SAST/DAST, pentest, HTTPS real, secretos robustos, hardening de servidor, backups y monitoreo.
