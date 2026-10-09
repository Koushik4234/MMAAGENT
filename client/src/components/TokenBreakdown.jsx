import { formatNumber, formatUsd } from '../utils/format.js';

/** Shows how total spend splits across the four Gemini price buckets. */
export default function TokenBreakdown({ overview }) {
  const p = overview.pricing;
  const rows = [
    ['Audio input', overview.input_audio_tokens, p.audioInput],
    ['Audio output', overview.output_audio_tokens, p.audioOutput],
    ['Text input', overview.input_text_tokens, p.textInput],
    ['Text output', overview.output_text_tokens, p.textOutput],
  ];

  return (
    <div className="panel">
      <h3>Cost breakdown</h3>
      <table className="table compact-table">
        <thead>
          <tr>
            <th>Type</th>
            <th className="num">Tokens</th>
            <th className="num">$ / 1M</th>
            <th className="num">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, tokens, price]) => (
            <tr key={label}>
              <td>{label}</td>
              <td className="num">{formatNumber(tokens)}</td>
              <td className="num">{price.toFixed(2)}</td>
              <td className="num">{formatUsd((tokens * price) / 1_000_000)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <small className="muted">
        Estimates from {overview.mode === 'mock' ? 'mock' : overview.model} usage data and the prices in your .env.
      </small>
    </div>
  );
}
