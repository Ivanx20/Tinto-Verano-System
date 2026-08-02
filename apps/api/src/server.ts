import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './database/prisma.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`API Tinto Verano escuchando en puerto ${env.PORT}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`El puerto ${env.PORT} ya está en uso. Cierre procesos anteriores y reintente.`);
    process.exit(1);
  }
  logger.error(error, 'Error no controlado al iniciar el servidor');
  process.exit(1);
});

async function shutdown(signal: string) {
  logger.info(`Recibido ${signal}. Cerrando API...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
