import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(here, '../../..');

// Load the .env that lives at the repository root.
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const list = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const mockRequested = String(process.env.MOCK_MODE).toLowerCase() === 'true';
const hasKey = Boolean(process.env.GEMINI_API_KEY);

export const config = {
  port: num(process.env.PORT, 4000),
  allowedOrigins: list(process.env.ALLOWED_ORIGINS),
  maxSessionSeconds: num(process.env.MAX_SESSION_SECONDS, 300),
  sqlitePath: path.resolve(ROOT_DIR, process.env.SQLITE_PATH || './data/voice-agent.db'),
  clientDist: path.join(ROOT_DIR, 'client', 'dist'),

  // If no key is present we fall back to mock mode instead of crashing.
  mockMode: mockRequested || !hasKey,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-live',
    voice: process.env.GEMINI_VOICE || 'Puck',
  },

  auth: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'change-me-now',
    jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  },

  pricing: {
    textInput: num(process.env.PRICE_TEXT_INPUT, 0.75),
    audioInput: num(process.env.PRICE_AUDIO_INPUT, 3.0),
    textOutput: num(process.env.PRICE_TEXT_OUTPUT, 4.5),
    audioOutput: num(process.env.PRICE_AUDIO_OUTPUT, 12.0),
    audioTokensPerSecond: num(process.env.AUDIO_TOKENS_PER_SECOND, 25),
  },
  usageMode: process.env.USAGE_MODE === 'delta' ? 'delta' : 'cumulative',
};