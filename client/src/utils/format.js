export function formatDuration(ms) {
  const total = Math.round((ms || 0) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatUsd(value) {
  const n = value || 0;
  if (n === 0) return '$0.00';
  return n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

export const formatNumber = (n) => (n || 0).toLocaleString();

export const formatDateTime = (ms) =>
  new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const formatTime = (ms) => new Date(ms).toLocaleTimeString();

export const totalTokens = (s) =>
  s.input_text_tokens + s.input_audio_tokens + s.output_text_tokens + s.output_audio_tokens;
