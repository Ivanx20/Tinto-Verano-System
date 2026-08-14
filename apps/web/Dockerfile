# =============================================================
# Frontend Tinto Verano - React 19 + Vite servido por Nginx
# El contexto de construccion es la raiz del monorepo.
#   docker build -f apps/web/Dockerfile -t tinto-verano-web:1.0 .
# =============================================================

# ---------- Etapa 1: build de Vite ----------
FROM node:22-bookworm-slim AS builder

# La URL de la API se resuelve en tiempo de compilacion (Vite la incrusta
# en el bundle). Por defecto usa la ruta relativa /api que publica Nginx.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm ci --ignore-scripts

COPY apps/web ./apps/web
RUN npm run build -w @tinto/web

# ---------- Etapa 2: servidor estatico ----------
FROM nginx:1.27-alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -q --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
