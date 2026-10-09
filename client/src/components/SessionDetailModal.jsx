import { api } from '../api/endpoints.js';
import { usePolling } from '../hooks/usePolling.js';
import { formatDateTime, formatDuration, formatNumber, formatTime, formatUsd } from '../utils/format.js';
import StatusBadge from './StatusBadge.jsx';
import TranscriptView from './TranscriptView.jsx';

export default function SessionDetailModal({ sessionId, onClose }) {
  // Poll so a live session's transcript and numbers keep updating while the modal is open.
  const { data, error } = usePolling(() => api.sessionDetail(sessionId), 3000, [sessionId]);
  const s = data?.session;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>Session details</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {error && <div className="error">{error}</div>}
        {s && (
          <>
            <dl className="facts">
              <div><dt>Status</dt><dd><StatusBadge status={s.status} /></dd></div>
              <div><dt>Started</dt><dd>{formatDateTime(s.started_at)}</dd></div>
              <div><dt>Duration</dt><dd>{formatDuration(s.duration_ms)}</dd></div>
              <div><dt>Persona</dt><dd>{s.persona_id}</dd></div>
              <div><dt>Model</dt><dd>{s.model}</dd></div>
              <div><dt>Ended because</dt><dd>{s.end_reason || '—'}</dd></div>
              <div><dt>Audio in / out</dt><dd>{s.audio_in_seconds.toFixed(1)}s / {s.audio_out_seconds.toFixed(1)}s</dd></div>
              <div><dt>Input tokens</dt><dd>{formatNumber(s.input_audio_tokens)} audio + {formatNumber(s.input_text_tokens)} text</dd></div>
              <div><dt>Output tokens</dt><dd>{formatNumber(s.output_audio_tokens)} audio + {formatNumber(s.output_text_tokens)} text</dd></div>
              <div><dt>Estimated cost</dt><dd>{formatUsd(s.cost_usd)}</dd></div>
            </dl>
            <h4>Transcript</h4>
            <TranscriptView
              entries={data.transcript.map((t) => ({ ...t, text: `${t.text}  · ${formatTime(t.ts)}` }))}
              emptyText="No transcript was captured for this session."
            />
          </>
        )}
      </div>
    </div>
  );
}
