import { useState } from 'react';
import { api } from '../api/endpoints.js';
import OverviewCards from '../components/OverviewCards.jsx';
import SessionDetailModal from '../components/SessionDetailModal.jsx';
import SessionsTable from '../components/SessionsTable.jsx';
import TokenBreakdown from '../components/TokenBreakdown.jsx';
import TrendCharts from '../components/TrendCharts.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePolling } from '../hooks/usePolling.js';

const REFRESH_MS = 3000;

export default function DashboardPage() {
  const { logout } = useAuth();
  const [days, setDays] = useState(14);
  const [selectedId, setSelectedId] = useState(null);

  const overview = usePolling(api.overview, REFRESH_MS, [], logout);
  const trends = usePolling(() => api.trends(days), REFRESH_MS * 2, [days], logout);
  const sessions = usePolling(() => api.sessions(25, 0), REFRESH_MS, [], logout);

  const error = overview.error || trends.error || sessions.error;

  return (
    <div>
      <div className="panel-head">
        <h1>Usage &amp; cost</h1>
        <small className="muted">
          <span className="dot" /> Auto-refreshing every {REFRESH_MS / 1000}s
          {overview.data && ` · ${overview.data.mode === 'mock' ? 'MOCK data source' : overview.data.model}`}
        </small>
      </div>

      {error && <div className="error">{error}</div>}

      {overview.data && (
        <>
          <OverviewCards overview={overview.data} />
          <div className="grid-2">
            <TrendCharts points={trends.data?.points || []} days={days} onRangeChange={setDays} />
            <TokenBreakdown overview={overview.data} />
          </div>
        </>
      )}

      {sessions.data && (
        <SessionsTable sessions={sessions.data.items} total={sessions.data.total} onSelect={setSelectedId} />
      )}

      {selectedId && <SessionDetailModal sessionId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
