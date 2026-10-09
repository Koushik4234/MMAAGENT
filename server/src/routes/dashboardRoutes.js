import { Router } from 'express';

const clampInt = (value, min, max, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Protected routes that feed the dashboard. */
export function createDashboardRoutes({ sessionService, config }) {
  const router = Router();

  router.get('/overview', (_req, res) => {
    res.json({
      ...sessionService.getOverview(),
      pricing: config.pricing,
      mode: config.mockMode ? 'mock' : 'gemini',
      model: config.mockMode ? 'mock' : config.gemini.model,
    });
  });

  router.get('/trends', (req, res) => {
    const days = clampInt(req.query.days, 1, 90, 14);
    res.json({ days, points: sessionService.getTrends(days) });
  });

  router.get('/sessions', (req, res) => {
    const limit = clampInt(req.query.limit, 1, 100, 25);
    const offset = clampInt(req.query.offset, 0, 1_000_000, 0);
    res.json(sessionService.listSessions({ limit, offset }));
  });

  router.get('/sessions/:id', (req, res) => {
    const detail = sessionService.getSessionDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: 'Session not found' });
    res.json(detail);
  });

  return router;
}
