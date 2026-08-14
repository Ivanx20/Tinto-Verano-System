#!/bin/sh
# Punto de entrada de la API dentro del contenedor.
# Sincroniza el esquema de PostgreSQL y, si se pide, carga los datos
# iniciales antes de arrancar el servidor Express.
set -e

echo "[entrypoint] Sincronizando el esquema de la base de datos..."
npx prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate

if [ "${RUN_DB_SEED}" = "true" ]; then
  echo "[entrypoint] Cargando datos iniciales (roles, permisos y usuario administrador)..."
  node apps/api/dist/prisma/seed.js || echo "[entrypoint] El seed no se aplico (probablemente ya existia). Se continua."
fi

echo "[entrypoint] Iniciando la API Tinto Verano..."
exec "$@"
