import { formatDateTime, formatDuration, formatNumber, formatUsd, totalTokens } from '../utils/format.js';
import StatusBadge from './StatusBadge.jsx';

export default function SessionsTable({ sessions, total, onSelect }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Sessions</h3>
        <small className="muted">{total} total · click a row for the transcript</small>
      </div>
      {sessions.length === 0 ? (
        <p className="muted">No sessions yet.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Started</th>
                <th>Status</th>
                <th>Persona</th>
                <th className="num">Duration</th>
                <th className="num">Tokens</th>
                <th className="num">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="clickable" onClick={() => onSelect(s.id)}>
                  <td>{formatDateTime(s.started_at)}</td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td>{s.persona_id}</td>
                  <td className="num">{formatDuration(s.duration_ms)}</td>
                  <td className="num">{formatNumber(totalTokens(s))}</td>
                  <td className="num">{formatUsd(s.cost_usd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
