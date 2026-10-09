/**
 * All SQL for sessions lives here. Nothing else in the app writes raw SQL for this table.
 */
export class SessionRepository {
  constructor(db) {
    this.db = db;
    this.stmts = {
      insert: db.prepare(
        `INSERT INTO sessions (id, persona_id, provider, model, status, started_at)
         VALUES (@id, @personaId, @provider, @model, 'active', @startedAt)`,
      ),
      updateUsage: db.prepare(
        `UPDATE sessions SET
           duration_ms = @durationMs,
           input_text_tokens = @inputTextTokens,
           input_audio_tokens = @inputAudioTokens,
           output_text_tokens = @outputTextTokens,
           output_audio_tokens = @outputAudioTokens,
           audio_in_seconds = @audioInSeconds,
           audio_out_seconds = @audioOutSeconds,
           cost_usd = @costUsd
         WHERE id = @id`,
      ),
      finish: db.prepare(
        `UPDATE sessions SET status = @status, ended_at = @endedAt, duration_ms = @durationMs, end_reason = @reason
         WHERE id = @id`,
      ),
      get: db.prepare('SELECT * FROM sessions WHERE id = ?'),
      list: db.prepare('SELECT * FROM sessions ORDER BY started_at DESC LIMIT @limit OFFSET @offset'),
      count: db.prepare('SELECT COUNT(*) AS n FROM sessions'),
      totals: db.prepare(
        `SELECT
           COUNT(*) AS sessions,
           COALESCE(SUM(status = 'active'), 0) AS active,
           COALESCE(SUM(status != 'active'), 0) AS completed,
           COALESCE(SUM(duration_ms), 0) AS duration_ms,
           COALESCE(SUM(input_text_tokens), 0) AS input_text_tokens,
           COALESCE(SUM(input_audio_tokens), 0) AS input_audio_tokens,
           COALESCE(SUM(output_text_tokens), 0) AS output_text_tokens,
           COALESCE(SUM(output_audio_tokens), 0) AS output_audio_tokens,
           COALESCE(SUM(cost_usd), 0) AS cost_usd
         FROM sessions`,
      ),
      trends: db.prepare(
        `SELECT
           date(started_at / 1000, 'unixepoch', 'localtime') AS day,
           COUNT(*) AS sessions,
           COALESCE(SUM(duration_ms), 0) AS duration_ms,
           COALESCE(SUM(input_text_tokens + input_audio_tokens + output_text_tokens + output_audio_tokens), 0) AS tokens,
           COALESCE(SUM(cost_usd), 0) AS cost_usd
         FROM sessions
         WHERE started_at >= @since
         GROUP BY day
         ORDER BY day ASC`,
      ),
    };
  }

  create(row) {
    this.stmts.insert.run(row);
    return this.get(row.id);
  }

  updateUsage(row) {
    this.stmts.updateUsage.run(row);
  }

  finish(row) {
    this.stmts.finish.run(row);
  }

  get(id) {
    return this.stmts.get.get(id) || null;
  }

  list({ limit = 25, offset = 0 } = {}) {
    return {
      items: this.stmts.list.all({ limit, offset }),
      total: this.stmts.count.get().n,
    };
  }

  totals() {
    return this.stmts.totals.get();
  }

  trends(days) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.stmts.trends.all({ since });
  }
}
