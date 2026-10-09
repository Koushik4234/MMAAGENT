import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite'; // built into Node 22.13+, no native compile needed
import { config } from '../config/env.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'active',      -- active | completed | error
  started_at INTEGER NOT NULL,                -- epoch ms
  ended_at INTEGER,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  input_text_tokens INTEGER NOT NULL DEFAULT 0,
  input_audio_tokens INTEGER NOT NULL DEFAULT 0,
  output_text_tokens INTEGER NOT NULL DEFAULT 0,
  output_audio_tokens INTEGER NOT NULL DEFAULT 0,
  audio_in_seconds REAL NOT NULL DEFAULT 0,
  audio_out_seconds REAL NOT NULL DEFAULT 0,
  cost_usd REAL NOT NULL DEFAULT 0,
  end_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at);

CREATE TABLE IF NOT EXISTS transcript_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  ts INTEGER NOT NULL,                        -- epoch ms
  role TEXT NOT NULL,                         -- user | assistant | system
  text TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transcript_session ON transcript_entries(session_id, id);
`;

export function createDatabase() {
  fs.mkdirSync(path.dirname(config.sqlitePath), { recursive: true });
  const db = new DatabaseSync(config.sqlitePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);

  // Any session left "active" from a previous run can never finish; close it out.
  db.prepare(
    `UPDATE sessions SET status = 'error', end_reason = 'server_restart', ended_at = started_at + duration_ms
     WHERE status = 'active'`,
  ).run();

  return db;
}
