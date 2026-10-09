import { formatDuration, formatNumber, formatUsd } from '../utils/format.js';
import StatCard from './StatCard.jsx';

export default function OverviewCards({ overview }) {
  return (
    <div className="stat-grid">
      <StatCard
        label="Sessions"
        value={formatNumber(overview.sessions)}
        hint={`${overview.active} live · ${overview.completed} completed`}
      />
      <StatCard
        label="Total talk time"
        value={formatDuration(overview.duration_ms)}
        hint={`avg ${formatDuration(overview.avg_duration_ms)} per session`}
      />
      <StatCard
        label="Total tokens"
        value={formatNumber(overview.total_tokens)}
        hint={`${formatNumber(overview.input_audio_tokens + overview.input_text_tokens)} in · ${formatNumber(
          overview.output_audio_tokens + overview.output_text_tokens,
        )} out`}
      />
      <StatCard
        label="Running total cost"
        value={formatUsd(overview.cost_usd)}
        hint={`avg ${formatUsd(overview.avg_cost_usd)} per session`}
        accent
      />
    </div>
  );
}
