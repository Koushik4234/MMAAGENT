import http from 'node:http';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { createDatabase } from './db/database.js';
import { attachVoiceSocket } from './realtime/voiceSocket.js';
import { SessionRepository } from './repositories/sessionRepository.js';
import { TranscriptRepository } from './repositories/transcriptRepository.js';
import { createProvider } from './services/providers/index.js';
import { SessionService } from './services/sessionService.js';

// ---- composition root: wire everything together in one place ----
const db = createDatabase();
const sessionService = new SessionService({
  sessionRepo: new SessionRepository(db),
  transcriptRepo: new TranscriptRepository(db),
  config,
});
const provider = createProvider(config);

const app = createApp({ config, sessionService });
const server = http.createServer(app);
attachVoiceSocket({ server, provider, sessionService, config });

server.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
  console.log(`Voice provider: ${provider.name}${config.mockMode ? '  (MOCK MODE - no Gemini key in use)' : ` (${provider.model})`}`);
  if (config.auth.password === 'change-me-now') {
    console.warn('WARNING: using the default ADMIN_PASSWORD. Change it in .env before deploying.');
  }
});

const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
