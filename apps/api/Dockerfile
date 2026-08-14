# =============================================================
# API Tinto Verano - Express + Prisma + PostgreSQL
# El contexto de construccion es la raiz del monorepo, porque
# npm workspaces necesita el package-lock.json compartido.
#   docker build -f apps/api/Dockerfile -t tinto-verano-api:1.0 .
# =============================================================

# ---------- Etapa 1: compilacion de TypeScript ----------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# openssl lo requieren los motores de consulta de Prisma
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Primero los manifiestos: si no cambian, Docker reutiliza la capa de npm ci
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm ci

COPY apps/api ./apps/api
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build -w @tinto/api

# ---------- Etapa 2: imagen final de ejecucion ----------
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=4100

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY apps/api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# El proceso no corre como root. Se cambia de usuario ANTES de instalar para
# no necesitar un chown -R final, que duplicaria toda la capa de node_modules.
RUN mkdir -p /app && chown node:node /app
WORKDIR /app
USER node

# Solo dependencias de produccion: la imagen no lleva compilador ni pruebas
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node apps/api/package.json ./apps/api/
COPY --chown=node:node apps/web/package.json ./apps/web/
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --chown=node:node apps/api/prisma ./apps/api/prisma
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist

EXPOSE 4100

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=6 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4100)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "apps/api/dist/src/server.js"]
