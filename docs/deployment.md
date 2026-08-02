# Despliegue recomendado

## Producción

1. Compilar API y web.
2. Servir frontend con Nginx.
3. Ejecutar backend con PM2 o systemd.
4. Configurar HTTPS.
5. Configurar variables `.env` seguras.
6. Usar usuario PostgreSQL dedicado.
7. Activar backups.
8. Monitorear logs.

## Comandos

```bash
npm run build
npm run db:migrate
npm run db:seed
npm run start -w @tinto/api
```
