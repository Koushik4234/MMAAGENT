import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { createRequireAuth } from './middleware/requireAuth.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createDashboardRoutes } from './routes/dashboardRoutes.js';
import { createPublicRoutes } from './routes/publicRoutes.js';

/** Builds the Express app. Kept separate from index.js so it is easy to test. */
export function createApp({ config, sessionService }) {
  const app = express();
  const requireAuth = createRequireAuth(config);

  app.set('trust proxy', 1);
  app.use(
    cors({
      origin: config.allowedOrigins.length ? config.allowedOrigins : true,
    }),
  );
  app.use(express.json({ limit: '50kb' }));

  app.use('/api', createPublicRoutes({ config }));
  app.use('/api/auth', createAuthRoutes({ config, requireAuth }));
  app.use('/api/dashboard', requireAuth, createDashboardRoutes({ sessionService, config }));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // In production the built React app is served from the same server.
  if (fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[http]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
