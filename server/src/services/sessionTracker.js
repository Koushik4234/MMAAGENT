import { calculateCost, estimateAudioTokens } from './costService.js';

const PERSIST_INTERVAL_MS = 1000;
const INPUT_RATE = 16000; // bytes/sec = rate * 2 (16-bit mono)
const OUTPUT_RATE = 24000;

/**
 * Tracks one live conversation: duration, audio seconds, tokens, cost and transcript.
 * It owns the in-memory state and writes it to the repositories (throttled).
 */
export class SessionTracker {
  constructor({ id, sessionRepo, transcriptRepo, config }) {
    this.id = id;
    this.sessionRepo = sessionRepo;
    this.transcriptRepo = transcriptRepo;
    this.config = config;

    this.startedAt = Date.now();
    this.audioInBytes = 0;
    this.audioOutBytes = 0;
    this.reported = null; // latest usage reported by the provider
    this.pending = { user: '', assistant: '' };
    this.lastPersist = 0;
    this.finished = false;
  }

  /* ---------- audio ---------- */

  addAudioIn(byteLength) {
    this.audioInBytes += byteLength;
    this.persistThrottled();
  }

  addAudioOut(byteLength) {
    this.audioOutBytes += byteLength;
    this.persistThrottled();
  }

  /* ---------- usage ---------- */

  /** `usage` = parsed counters from the provider (see usageParser). */
  applyUsage(usage) {
    if (!usage) return;
    if (this.config.usageMode === 'delta' && this.reported) {
      this.reported = {
        inputTextTokens: this.reported.inputTextTokens + usage.inputTextTokens,
        inputAudioTokens: this.reported.inputAudioTokens + usage.inputAudioTokens,
        outputTextTokens: this.reported.outputTextTokens + usage.outputTextTokens,
        outputAudioTokens: this.reported.outputAudioTokens + usage.outputAudioTokens,
      };
    } else {
      // Cumulative counters only ever grow, so keep the max seen.
      const prev = this.reported || {};
      this.reported = {
        inputTextTokens: Math.max(prev.inputTextTokens || 0, usage.inputTextTokens),
        inputAudioTokens: Math.max(prev.inputAudioTokens || 0, usage.inputAudioTokens),
        outputTextTokens: Math.max(prev.outputTextTokens || 0, usage.outputTextTokens),
        outputAudioTokens: Math.max(prev.outputAudioTokens || 0, usage.outputAudioTokens),
      };
    }
    this.persistThrottled();
  }

  get audioInSeconds() {
    return this.audioInBytes / (INPUT_RATE * 2);
  }

  get audioOutSeconds() {
    return this.audioOutBytes / (OUTPUT_RATE * 2);
  }

  /** Reported tokens if available, otherwise an estimate from audio duration. */
  currentUsage() {
    const pricing = this.config.pricing;
    const r = this.reported;
    return {
      inputTextTokens: r?.inputTextTokens ?? 0,
      outputTextTokens: r?.outputTextTokens ?? 0,
      inputAudioTokens: r?.inputAudioTokens || estimateAudioTokens(this.audioInSeconds, pricing),
      outputAudioTokens: r?.outputAudioTokens || estimateAudioTokens(this.audioOutSeconds, pricing),
    };
  }

  /* ---------- transcript ---------- */

  addTranscriptChunk(role, text) {
    if (!text) return;
    const other = role === 'user' ? 'assistant' : 'user';
    // When the speaker changes, the previous speaker's sentence is finished.
    this.flushRole(other);
    this.pending[role] += text;
  }

  flushRole(role) {
    const text = this.pending[role].trim();
    this.pending[role] = '';
    if (text) this.transcriptRepo.add({ sessionId: this.id, role, text });
  }

  flushTranscript() {
    this.flushRole('user');
    this.flushRole('assistant');
  }

  /* ---------- persistence ---------- */

  persistThrottled() {
    const now = Date.now();
    if (now - this.lastPersist >= PERSIST_INTERVAL_MS) this.persist();
  }

  persist() {
    this.lastPersist = Date.now();
    const usage = this.currentUsage();
    this.sessionRepo.updateUsage({
      id: this.id,
      durationMs: this.lastPersist - this.startedAt,
      ...usage,
      audioInSeconds: this.audioInSeconds,
      audioOutSeconds: this.audioOutSeconds,
      costUsd: calculateCost(usage, this.config.pricing),
    });
  }

  finish(reason = 'client_ended', status = 'completed') {
    if (this.finished) return;
    this.finished = true;
    this.flushTranscript();
    this.persist();
    this.sessionRepo.finish({
      id: this.id,
      status,
      endedAt: Date.now(),
      durationMs: Date.now() - this.startedAt,
      reason,
    });
  }
}
