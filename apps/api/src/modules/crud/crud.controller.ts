import type { Request, Response } from 'express';
import { created, ok } from '../../utils/api-response.js';
import * as service from './crud.service.js';

type ModelName = Parameters<typeof service.list>[0];

export function crudController(modelName: ModelName) {
  return {
    list: async (req: Request, res: Response) => ok(res, await service.list(modelName, req.query)),
    find: async (req: Request, res: Response) => ok(res, await service.findById(modelName, Number(req.params.id))),
    create: async (req: Request, res: Response) => created(res, await service.create(modelName, req.body, req.auth?.sub)),
    update: async (req: Request, res: Response) => ok(res, await service.update(modelName, Number(req.params.id), req.body, req.auth?.sub), 'Registro actualizado correctamente'),
    remove: async (req: Request, res: Response) => ok(res, await service.softDelete(modelName, Number(req.params.id), req.auth?.sub), 'Registro eliminado correctamente')
  };
}
