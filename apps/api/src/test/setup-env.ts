/**
 * Variables de entorno usadas solo por las pruebas automatizadas.
 * Se cargan antes de que se evalue src/config/env.ts para que la validacion
 * de Zod pase sin depender del archivo .env local ni de una base real.
 */
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.PORT = '0';
process.env.DATABASE_URL = 'postgresql://tinto_user:tinto_password@localhost:5432/tinto_verano_test?schema=public';
process.env.JWT_ACCESS_SECRET = 'secreto_de_pruebas_access_token_tinto_verano_2026';
process.env.JWT_REFRESH_SECRET = 'secreto_de_pruebas_refresh_token_tinto_verano_2026';
process.env.CORS_ORIGINS = 'http://localhost:5173';

// Costes de Argon2 reducidos: las pruebas solo verifican el comportamiento del
// hash, no su dureza criptografica, y asi el pipeline no se alarga sin motivo.
process.env.ARGON2_MEMORY_COST = '8192';
process.env.ARGON2_TIME_COST = '2';
process.env.ARGON2_PARALLELISM = '1';

// El limitador de peticiones no debe interferir con las pruebas HTTP.
process.env.RATE_LIMIT_MAX = '1000';
process.env.LOGIN_RATE_LIMIT_MAX = '1000';
