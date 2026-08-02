import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../database/prisma.js';

export function audit(action: string, entity?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userAgentHeader = req.headers['user-agent'];
    const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader.join(' | ') : (typeof userAgentHeader === 'string' ? userAgentHeader : undefined);
    const entityId = typeof req.params?.id === 'string' ? req.params.id : undefined;
    const ipAddress = typeof req.ip === 'string' ? req.ip : undefined;

    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        prisma.auditLog
          .create({
            data: {
              userId: req.auth?.sub,
              action,
              entity,
              entityId,
              ipAddress,
              userAgent,
              metadata: { method: req.method, path: req.originalUrl }
            }
          })
          .catch(() => undefined);
      }
    });
    next();
  };
}
