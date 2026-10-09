import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber, formatUsd } from '../utils/format.js';
import { groupByWeek } from '../utils/trends.js';

const RANGES = [7, 14, 30];

/** Daily/weekly spend + token charts. `onRangeChange` lets the parent refetch for a new window. */
export default function TrendCharts({ points, days, onRangeChange }) {
  const [grain, setGrain] = useState('daily');
  const data = useMemo(() => (grain === 'weekly' ? groupByWeek(points) : points), [points, grain]);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Usage &amp; spend trends</h3>
        <div className="seg">
          {['daily', 'weekly'].map((g) => (
            <button key={g} className={grain === g ? 'on' : ''} onClick={() => setGrain(g)}>
              {g}
            </button>
          ))}
          <span className="seg-gap" />
          {RANGES.map((d) => (
            <button key={d} className={days === d ? 'on' : ''} onClick={() => onRangeChange(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="muted">No sessions in this period yet. Start a call on the Talk page.</p>
      ) : (
        <div className="charts">
          <div>
            <h4>Spend (USD)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="day" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => formatUsd(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="cost_usd" name="Cost" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4>Tokens</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="day" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} />
                <Tooltip formatter={(v) => formatNumber(v)} contentStyle={tooltipStyle} />
                <Area dataKey="tokens" name="Tokens" stroke="var(--good)" fill="var(--good)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

const tooltipStyle = { background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8 };
