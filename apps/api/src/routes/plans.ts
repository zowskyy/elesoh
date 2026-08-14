import { listPlans } from '@lso/domain';
import type { Hono } from 'hono';
import type { AppEnv } from '../env.js';

export function registerPlanRoutes(app: Hono<AppEnv>): void {
  app.get('/plans', (c) => c.json(listPlans()));
}
