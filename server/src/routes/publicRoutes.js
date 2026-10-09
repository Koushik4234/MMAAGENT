import { Router } from 'express';
import { personas } from '../config/personas.js';

/** Routes the voice widget needs without logging in. Never expose secrets here. */
export function createPublicRoutes({ config }) {
  const router = Router();

  router.get('/health', (_req, res) => res.json({ ok: true, mode: config.mockMode ? 'mock' : 'gemini' }));

  router.get('/personas', (_req, res) =>
    res.json(personas.map(({ id, name, description }) => ({ id, name, description }))),
  );

  return router;
}
