export class TranscriptRepository {
  constructor(db) {
    this.insert = db.prepare(
      'INSERT INTO transcript_entries (session_id, ts, role, text) VALUES (@sessionId, @ts, @role, @text)',
    );
    this.bySession = db.prepare(
      'SELECT id, ts, role, text FROM transcript_entries WHERE session_id = ? ORDER BY id ASC',
    );
  }

  add({ sessionId, role, text, ts = Date.now() }) {
    this.insert.run({ sessionId, role, text, ts });
  }

  listBySession(sessionId) {
    return this.bySession.all(sessionId);
  }
}
