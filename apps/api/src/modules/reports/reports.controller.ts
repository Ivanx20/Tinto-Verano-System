import type { Request, Response } from 'express';
import { ok } from '../../utils/api-response.js';
import * as service from './reports.service.js';

export async function dashboard(_req: Request, res: Response) { return ok(res, await service.dashboard()); }
export async function sales(_req: Request, res: Response) { return ok(res, await service.sales()); }
