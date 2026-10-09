import crypto from 'node:crypto';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { createLoginRateLimit } from '../middleware/loginRateLimit.js';

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export function createAuthRoutes({ config, requireAuth }) {
  const router = Router();

  router.post('/login', createLoginRateLimit(), (req, res) => {
    const { username, password } = req.body || {};
    const ok =
      safeEqual(username ?? '', config.auth.username) && safeEqual(password ?? '', config.auth.password);
    if (!ok) return res.status(401).json({ error: 'Wrong username or password' });

    const token = jwt.sign({ sub: config.auth.username }, config.auth.jwtSecret, {
      expiresIn: config.auth.expiresIn,
    });
    res.json({ token, username: config.auth.username });
  });

  router.get('/me', requireAuth, (req, res) => res.json({ username: req.user.sub }));

  return router;
}
