import { Router } from 'express';
import { authenticate, requirePermission } from '../../middlewares/auth.js';
import { asyncHandler } from '../../middlewares/async-handler.js';
import * as c from './reports.controller.js';

export const reportsRoutes = Router();

reportsRoutes.get('/dashboard', authenticate, requirePermission('dashboard.view'), asyncHandler(c.dashboard));
reportsRoutes.get('/sales', authenticate, requirePermission('reports.view'), asyncHandler(c.sales));
reportsRoutes.get('/products', authenticate, requirePermission('reports.view'), asyncHandler(c.dashboard));
reportsRoutes.get('/inventory', authenticate, requirePermission('reports.view'), asyncHandler(c.dashboard));
reportsRoutes.get('/cash', authenticate, requirePermission('reports.view'), asyncHandler(c.dashboard));
reportsRoutes.get('/accounts-receivable', authenticate, requirePermission('reports.view'), asyncHandler(c.dashboard));
reportsRoutes.get('/accounts-payable', authenticate, requirePermission('reports.view'), asyncHandler(c.dashboard));
