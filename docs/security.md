# Seguridad del sistema Tinto Verano

## Controles implementados

- Hash de contraseñas con Argon2id.
- Tokens de acceso JWT de corta duración.
- Refresh tokens rotativos almacenados con hash.
- Cookies HttpOnly, Secure en producción y SameSite Strict.
- Helmet con Content Security Policy.
- CORS por allowlist.
- Rate limiting global y específico para login.
- Validación de entrada con Zod.
- Rechazo de payloads grandes.
- Prisma ORM y consultas parametrizadas.
- Control de roles y permisos.
- Auditoría de eventos sensibles.
- Eliminación lógica en entidades críticas.
- Manejo centralizado de errores sin stack trace en producción.
- Configuración por variables de entorno validadas.

## Recomendaciones para producción

1. Usar HTTPS obligatorio.
2. Configurar Nginx o proxy reverso con TLS moderno.
3. Usar usuario PostgreSQL con privilegios mínimos.
4. No usar el superusuario `postgres` para la aplicación.
5. Rotar secretos y guardarlos en gestor seguro.
6. Activar backups automáticos de PostgreSQL (`pg_dump`).
7. Ejecutar pruebas de seguridad SAST/DAST.
8. Configurar logs y alertas.
9. Revisar permisos antes de habilitar usuarios finales.
10. Separar ambientes: desarrollo, pruebas y producción.
