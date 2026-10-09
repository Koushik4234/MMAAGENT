/** Groups daily points ({day:'YYYY-MM-DD', ...}) into weeks starting on Monday. */
export function groupByWeek(points) {
  const weeks = new Map();
  for (const p of points) {
    const d = new Date(`${p.day}T00:00:00`);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const w = weeks.get(key) || { day: key, sessions: 0, duration_ms: 0, tokens: 0, cost_usd: 0 };
    w.sessions += p.sessions;
    w.duration_ms += p.duration_ms;
    w.tokens += p.tokens;
    w.cost_usd += p.cost_usd;
    weeks.set(key, w);
  }
  return [...weeks.values()].sort((a, b) => a.day.localeCompare(b.day));
}
