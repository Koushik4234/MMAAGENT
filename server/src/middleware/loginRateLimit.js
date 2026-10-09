/** Tiny in-memory limiter for the login route: max 8 attempts per IP per minute. */
export function createLoginRateLimit({ max = 8, windowMs = 60_000 } = {}) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({ error: 'Too many attempts. Try again in a minute.' });
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
