import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import { globalRateLimit } from './middlewares/rate-limit.js';
import { notFound } from './middlewares/not-found.js';
import { logger } from './utils/logger.js';

export const app = express();

if (env.trustProxy) app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...env.corsOrigins]
      }
    }
  })
);

app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(globalRateLimit);
app.use(pinoHttp({ logger }));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
