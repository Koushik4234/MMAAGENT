import crypto from 'node:crypto';
import { SessionTracker } from './sessionTracker.js';

/**
 * Application-level operations on sessions. Routes and the socket handler use this,
 * never the repositories directly.
 */
export class SessionService {
  constructor({ sessionRepo, transcriptRepo, config }) {
    this.sessionRepo = sessionRepo;
    this.transcriptRepo = transcriptRepo;
    this.config = config;
  }

  startSession({ personaId, provider, model }) {
    const id = crypto.randomUUID();
    const tracker = new SessionTracker({
      id,
      sessionRepo: this.sessionRepo,
      transcriptRepo: this.transcriptRepo,
      config: this.config,
    });
    this.sessionRepo.create({ id, personaId, provider, model, startedAt: tracker.startedAt });
    return tracker;
  }

  listSessions({ limit, offset }) {
    return this.sessionRepo.list({ limit, offset });
  }

  getSessionDetail(id) {
    const session = this.sessionRepo.get(id);
    if (!session) return null;
    return { session, transcript: this.transcriptRepo.listBySession(id) };
  }

  getOverview() {
    const t = this.sessionRepo.totals();
    const totalTokens =
      t.input_text_tokens + t.input_audio_tokens + t.output_text_tokens + t.output_audio_tokens;
    return {
      ...t,
      total_tokens: totalTokens,
      avg_duration_ms: t.sessions ? Math.round(t.duration_ms / t.sessions) : 0,
      avg_cost_usd: t.sessions ? t.cost_usd / t.sessions : 0,
    };
  }

  getTrends(days) {
    return this.sessionRepo.trends(days);
  }
}
