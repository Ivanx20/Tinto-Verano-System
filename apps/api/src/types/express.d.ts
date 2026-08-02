import type { TokenPayload } from '../utils/security.js';

declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}
