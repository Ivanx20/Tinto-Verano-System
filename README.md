# Tinto Verano System

[![CI Tinto Verano System](https://github.com/Ivanx20/Tinto-Verano-System/actions/workflows/ci.yml/badge.svg)](https://github.com/Ivanx20/Tinto-Verano-System/actions/workflows/ci.yml)

Sistema integral para un comedor/restaurante: **POS + facturación preparada + mesas + comandas + inventario + compras + caja + reportes + auditoría + seguridad**.

El proyecto está organizado como monorepo con npm workspaces: `apps/api` expone la API REST (Express + Prisma sobre PostgreSQL) y `apps/web` la interfaz de operación (React 19 + Vite). Desde la Fase 2 del proyecto integrador DevOps el repositorio incorpora pruebas automatizadas con Vitest, imágenes Docker para los dos servicios, orquestación con Docker Compose y un pipeline de integración continua en GitHub Actions.

---

## Tabla de contenido

- [Stack](#stack)
- [Estructura](#estructura)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución en local](#instalación-y-ejecución-en-local)
- [Pruebas automatizadas](#pruebas-automatizadas)
- [Contenedores Docker](#contenedores-docker)
- [Docker Compose](#docker-compose)
- [Pipeline de integración continua](#pipeline-de-integración-continua)
- [Automatización con Jenkins](#automatización-con-jenkins)
- [Flujo de trabajo con Git](#flujo-de-trabajo-con-git)
- [Módulos incluidos](#módulos-incluidos)
- [Documentación](#documentación)
- [Errores conocidos y aspectos de mejora](#errores-conocidos-y-aspectos-de-mejora)
- [Nota de seguridad](#nota-de-seguridad)

---

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, React Hook Form, Zod, Recharts, Lucide.
- **Backend:** Node.js 22, Express, TypeScript, Prisma ORM, PostgreSQL 17.
- **Pruebas:** Vitest.
- **Contenedores:** Docker multi-etapa, Nginx como servidor estático y proxy inverso, Docker Compose.
- **CI:** GitHub Actions.
- **Seguridad:** JWT de vida corta, refresh token rotativo almacenado como hash, cookies HttpOnly, Helmet con CSP, CORS por lista blanca, rate limit, validación con Zod, Argon2id, auditoría, borrado lógico y permisos por rol.

## Estructura

```txt
tinto-verano-system/
├── apps/
│   ├── api/                     # Express + Prisma + PostgreSQL
│   │   ├── Dockerfile           # Imagen de la API (build + runtime)
│   │   ├── docker-entrypoint.sh # Sincroniza el esquema y siembra datos
│   │   ├── vitest.config.ts     # Configuración de las pruebas
│   │   ├── prisma/              # schema.prisma y seed
│   │   └── src/
│   │       ├── modules/         # auth, sales, orders, inventory, cash, ...
│   │       ├── middlewares/     # auth, rate limit, auditoría, errores
│   │       └── test/            # Variables de entorno de las pruebas
│   └── web/                     # React 19 + Vite
│       ├── Dockerfile           # Imagen del frontend (build + Nginx)
│       └── nginx.conf           # SPA + proxy /api hacia el backend
├── .github/workflows/ci.yml     # Pipeline de integración continua
├── Jenkinsfile                  # Pipeline declarativo de entrega (Jenkins)
├── docker-compose.yml           # PostgreSQL + API + frontend
├── .env.docker.example          # Plantilla de variables (sin secretos reales)
└── docs/                        # Documentación técnica
```

---

## Requisitos previos

| Herramienta | Versión mínima | Para qué se necesita |
|---|---|---|
| Node.js | 22 LTS | Ejecutar el monorepo, las pruebas y los builds |
| npm | 10 | Gestión de workspaces |
| PostgreSQL | 17 | Solo si se ejecuta sin contenedores |
| Docker Desktop | 27 | Construir imágenes y levantar el stack |
| Docker Compose | v2 | Orquestar los tres servicios |
| Git | 2.40 | Control de versiones |

Para el camino con contenedores basta con **Docker Desktop y Git**: Node y PostgreSQL viajan dentro de las imágenes.

---

## Instalación y ejecución en local

```bash
git clone https://github.com/Ivanx20/Tinto-Verano-System.git
cd Tinto-Verano-System
npm install
```

Copie la plantilla de variables de la API y ajuste la cadena de conexión:

```bash
cp .env.example apps/api/.env      # en Windows: copy .env.example apps\api\.env
```

```env
DATABASE_URL="postgresql://tinto_user:tinto_password@localhost:5432/tinto_verano_db?schema=public"
```

Cree la base y el usuario en PostgreSQL (o use `scripts/create_postgresql_database.sql`):

```sql
CREATE USER tinto_user WITH PASSWORD 'tinto_password';
CREATE DATABASE tinto_verano_db OWNER tinto_user;
GRANT ALL PRIVILEGES ON DATABASE tinto_verano_db TO tinto_user;
```

Genere el cliente de Prisma, migre y cargue los datos iniciales:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Levante API y frontend:

```bash
npm run dev
```

| Servicio | URL |
|---|---|
| API | `http://localhost:4100/api/health` |
| Frontend | `http://localhost:5173` |

Usuario inicial creado por el seed:

```txt
Email: admin@tintoverano.local
Clave: Admin#2026.Tinto
```

---

## Pruebas automatizadas

Las pruebas están escritas con **Vitest** y se ejecutan enteramente desde línea de comandos. No requieren PostgreSQL: el acceso a datos se sustituye por dobles de prueba, de modo que el pipeline puede correrlas en cualquier runner limpio.

```bash
npm test
```

Equivalentes útiles durante el desarrollo:

```bash
npm run test -w @tinto/api          # solo el workspace de la API
npm run test -w @tinto/api -- --watch
```

Qué se cubre:

| Archivo | Qué valida |
|---|---|
| `apps/api/src/modules/sales/sales.service.test.ts` | Cálculo de una venta del POS: subtotal, descuento por línea, descuento global, servicio, IVA del 15 % y total. Validaciones que protegen la caja (venta sin productos, producto inexistente o no disponible, pago que no cuadra, crédito sin cliente) y anulación de ventas. |
| `apps/api/src/utils/security.test.ts` | Hash Argon2id de contraseñas, firma y verificación de access tokens JWT, unicidad del refresh token y su almacenamiento hasheado. |
| `apps/api/src/routes/routes.test.ts` | La aplicación Express real levantada en un puerto efímero: `GET /api/health`, respuesta 404 con el formato del sistema, cabeceras de Helmet y bloqueo de `/api/sales` sin token (401) o sin permiso (403). |

---

## Contenedores Docker

Cada aplicación tiene su propio `Dockerfile` multi-etapa. **El contexto de construcción es siempre la raíz del repositorio**, porque npm workspaces necesita el `package-lock.json` compartido.

### Construir las imágenes

```bash
docker build -f apps/api/Dockerfile -t tinto-verano-api:1.0 .
docker build -f apps/web/Dockerfile -t tinto-verano-web:1.0 .
docker images --filter "reference=tinto-verano-*"
```

### Ejecutar un contenedor suelto

```bash
docker run --rm -p 8080:8080 --name tinto_web_solo tinto-verano-web:1.0
```

La API necesita PostgreSQL, así que en la práctica se levanta con Compose. Para ejecutarla suelta contra una base ya existente:

```bash
docker run --rm -p 4100:4100 \
  -e DATABASE_URL="postgresql://usuario:clave@host.docker.internal:5432/tinto_verano_db?schema=public" \
  -e JWT_ACCESS_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")" \
  -e JWT_REFRESH_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")" \
  --name tinto_api_solo tinto-verano-api:1.0
```

### Decisiones de las imágenes

- **API:** etapa `builder` sobre `node:22-bookworm-slim` que instala dependencias, genera el cliente de Prisma y compila TypeScript; etapa `runtime` que instala solo dependencias de producción y copia el `dist`. El proceso corre con el usuario `node`, nunca como root, y la imagen declara un `HEALTHCHECK` contra `/api/health`.
- **Frontend:** etapa `builder` que ejecuta el build de Vite y etapa `runtime` sobre `nginx:1.27-alpine` que sirve los archivos estáticos en el puerto 8080. Nginx resuelve las rutas de React Router con `try_files` y publica `/api` como proxy inverso hacia el contenedor de la API, de modo que el navegador ve un solo origen.

---

## Docker Compose

`docker-compose.yml` levanta los tres servicios: `db` (PostgreSQL 17), `api` y `web`. Las dependencias están encadenadas por *healthcheck*, así que la API no arranca hasta que la base responde y el frontend no arranca hasta que la API contesta el health check.

### Preparar las variables

Los secretos **no están en el repositorio**. Copie la plantilla y reemplace los valores:

```bash
cp .env.docker.example .env        # en Windows: copy .env.docker.example .env
```

```bash
# Genere secretos nuevos con:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

El archivo `.env` está declarado en `.gitignore`; lo único versionado es la plantilla `.env.docker.example`.

### Levantar y verificar

```bash
docker compose config          # valida la definición
docker compose up -d --build   # construye y levanta los tres servicios
docker compose ps              # estado y puertos publicados
docker compose logs -f api     # seguimiento de la API
```

| Servicio | Contenedor | Puerto del anfitrión |
|---|---|---|
| Frontend (Nginx) | `tinto_web` | `5173` |
| API (Express) | `tinto_api` | `4100` |
| PostgreSQL | `tinto_postgres` | `5433` |

Comprobación rápida:

```bash
curl http://localhost:4100/api/health
curl http://localhost:5173/api/health   # el mismo health check a través del proxy
```

Apagar el entorno:

```bash
docker compose down       # conserva los datos en el volumen
docker compose down -v    # elimina también el volumen de PostgreSQL
```

Al arrancar, el contenedor de la API ejecuta `apps/api/docker-entrypoint.sh`, que sincroniza el esquema con `prisma db push` y, si `RUN_DB_SEED=true`, carga roles, permisos y el usuario administrador antes de iniciar Express.

---

## Pipeline de integración continua

El workflow vive en `.github/workflows/ci.yml` y se dispara en cada `push` a `main` o a ramas `feat/**`, en cada *pull request* hacia `main` y de forma manual. La configuración de `concurrency` cancela la ejecución anterior de la misma rama cuando llega un push nuevo.

Está dividido en dos *jobs* encadenados, siguiendo el flujo **código → dependencias → compilación → pruebas → imagen Docker**:

**1. `calidad` — Código (dependencias, lint, pruebas y build)**

| Paso | Comando |
|---|---|
| Instalar dependencias | `npm ci` |
| Generar cliente Prisma | `npx prisma generate --schema=apps/api/prisma/schema.prisma` |
| Análisis estático | `npm run lint` |
| Pruebas automatizadas | `npm test` |
| Compilar API y frontend | `npm run build` |

**2. `contenedores` — Docker (imágenes y stack de Compose)**, que solo corre si el anterior terminó en verde:

| Paso | Comando |
|---|---|
| Validar la definición | `docker compose config` |
| Construir imagen de la API | `docker build -f apps/api/Dockerfile -t tinto-verano-api:1.0 .` |
| Construir imagen del frontend | `docker build -f apps/web/Dockerfile -t tinto-verano-web:1.0 .` |
| Levantar el stack | `docker compose up -d --wait` |
| Prueba de humo | `curl` a `/api/health` directo y a través del proxy de Nginx |
| Limpieza | `docker compose down -v` |

Los secretos que necesita el stack durante la ejecución se generan de forma aleatoria dentro del runner con `openssl rand` y viven solo mientras dura el job. Si un paso falla, se publican los últimos 200 renglones de log de los contenedores para facilitar el diagnóstico.

---

## Automatización con Jenkins

Además del workflow de GitHub Actions, el repositorio incluye un `Jenkinsfile` declarativo en la raíz. GitHub Actions se encarga de la verificación continua en cada push y pull request; Jenkins es el pipeline de entrega, el que construye y publica las imágenes etiquetadas.

El job se configura en Jenkins como **Pipeline script from SCM** apuntando a este repositorio, con `Script Path = Jenkinsfile`, de modo que el pipeline se versiona junto al código y cualquier cambio queda en el historial de Git.

| Etapa | Qué hace | Evidencia que deja |
|---|---|---|
| 1. Preparación / Checkout | Limpia el workspace, descarga el commit que disparó la ejecución y calcula si es la punta de `main` | `reports/build-metadata.txt` |
| 2. Dependencias / Build | `npm ci`, `prisma generate` y compilación de API y frontend | Log de la etapa |
| 3. Pruebas | ESLint y Vitest con reporte JUnit | `reports/junit-api.xml`, `reports/test-output.txt`, `reports/lint-output.txt` |
| 4. Construcción | Valida `docker-compose.yml` y construye las dos imágenes | `reports/docker-images.txt`, `reports/*-image-inspect.json` |
| 5. Publicación | Solo en `main`: envía las imágenes a Docker Hub | `reports/docker-publish-metadata.txt` |

### Credenciales

El `Jenkinsfile` no contiene usuarios, tokens ni contraseñas: únicamente el identificador `dockerhub-tinto-verano` de una credencial *Username with password* registrada en Jenkins. El valor real es un *access token* de Docker Hub con permiso limitado a lectura y escritura de repositorios, y se inyecta con `withCredentials` solo durante la etapa 5. La sesión de Docker usa un `DOCKER_CONFIG` temporal que se borra al terminar el paso, de manera que el token no queda escrito en el disco del agente.

### Versionado de las imágenes

Cada imagen se publica con tres etiquetas apuntando al mismo *digest*:

```txt
usuario/tinto-verano-api:latest
usuario/tinto-verano-api:<número de build>
usuario/tinto-verano-api:<número de build>-<commit corto>
```

La tercera es la que da trazabilidad real: con solo leer el nombre se sabe qué ejecución de Jenkins la produjo y qué commit contiene.

### Requisitos del agente

- Node.js declarado como herramienta global de Jenkins (`NodeJS-24` en `Manage Jenkins → Tools`).
- Acceso al demonio de Docker desde el agente para poder construir y publicar las imágenes.

---

## Flujo de trabajo con Git

- `main` es la rama estable y protegida por el pipeline: nunca recibe código sin pasar por CI.
- El trabajo se hace en ramas `feat/**` con commits pequeños y descriptivos.
- La integración a `main` se realiza mediante *pull request*, después de que los checks aparezcan en verde.

```bash
git switch -c feat/mi-cambio
git add <archivos>
git commit -m "feat: descripción corta del cambio"
git push -u origin feat/mi-cambio
# abrir el pull request en GitHub y esperar los checks
```

---

## Módulos incluidos

Login seguro con roles y permisos · Dashboard gerencial · POS visual · Mesas y comandas · Pantalla de cocina · Productos, categorías, clientes y proveedores · Inventario y movimientos · Compras · Caja · Ventas · Cuentas por cobrar y pagar · Reservas · Promociones · Configuración · Auditoría.

## Documentación

- [API](docs/api.md)
- [Base de datos](docs/database.md)
- [Despliegue](docs/deployment.md)
- [Seguridad](docs/security.md)

---

## Errores conocidos y aspectos de mejora

**Limitaciones actuales**

1. **El esquema se sincroniza con `prisma db push`, no con migraciones versionadas.** La carpeta `apps/api/prisma/migrations` todavía no contiene el histórico de migraciones, por lo que el contenedor ajusta el esquema por diferencia. Sirve para desarrollo y para el laboratorio, pero antes de producción hay que generar migraciones reales y pasar a `prisma migrate deploy`.
2. **La cobertura de pruebas es parcial.** Están cubiertos el cálculo de ventas, la capa de seguridad y las rutas principales; faltan inventario, caja, compras y todo el frontend.
3. **El bundle del frontend supera los 500 kB.** Vite lo advierte en cada build. Falta dividirlo con `import()` dinámico o `manualChunks`.
4. **El pipeline no publica las imágenes.** Se construyen y se validan, pero no se suben a un registro ni existe una etapa de despliegue: el ciclo cubre CI, no todavía CD.
5. **Sin análisis de dependencias ni escaneo de secretos en CI.** Estaba previsto en el plan de 90 días de la Fase 1 y sigue pendiente.
6. **Observabilidad mínima.** Existe `/api/health` y logs con Pino, pero no hay métricas ni alertas centralizadas.

**Próximos pasos**

- Generar el histórico de migraciones de Prisma y cambiar el arranque del contenedor a `prisma migrate deploy`.
- Añadir pruebas al frontend y una medición de cobertura con un umbral mínimo en CI.
- Publicar las imágenes en GitHub Container Registry etiquetadas a partir de los tags de Git.
- Incorporar `npm audit` y escaneo de secretos como pasos del pipeline.
- Registrar las métricas DORA definidas en la Fase 1 a partir de las ejecuciones del propio pipeline.

---

## Nota de seguridad

Este proyecto implementa controles fuertes de base, pero ningún sistema queda blindado al 100 %. Para producción se debe ejecutar revisión de código, pruebas SAST/DAST, pentest, HTTPS real, secretos robustos, hardening del servidor, backups y monitoreo.
