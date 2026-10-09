/**
 * End-to-end smoke test. Start the server first (ideally with MOCK_MODE=true), then:
 *   npm run smoke -w server
 * It logs in, runs a fake voice call over the WebSocket, and checks the dashboard API saw it.
 */
import WebSocket from 'ws';

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const USER = process.env.ADMIN_USERNAME || 'admin';
const PASS = process.env.ADMIN_PASSWORD || 'change-me-now';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const check = (ok, label) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) process.exitCode = 1;
};

// 100 ms of loud 440 Hz tone at 16 kHz PCM16 (looks like speech energy to the mock provider)
const loud = Buffer.alloc(3200);
for (let i = 0; i < 1600; i++) loud.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / 16000) * 12000), i * 2);
const quiet = Buffer.alloc(3200);

async function main() {
  // auth is enforced
  const noAuth = await fetch(`${BASE}/api/dashboard/overview`);
  check(noAuth.status === 401, 'dashboard rejects unauthenticated requests');

  const bad = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: 'wrong' }),
  });
  check(bad.status === 401, 'wrong password rejected');

  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const { token } = await login.json();
  check(Boolean(token), 'login returns a token');
  const auth = { Authorization: `Bearer ${token}` };

  // fake voice call
  const ws = new WebSocket(BASE.replace('http', 'ws') + '/ws/voice');
  const events = [];
  let audioBytes = 0;
  let sessionId = null;
  ws.on('message', (data, isBinary) => {
    if (isBinary) audioBytes += data.length;
    else {
      const msg = JSON.parse(data.toString());
      events.push(msg);
      if (msg.type === 'ready') sessionId = msg.sessionId;
    }
  });
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });
  ws.send(JSON.stringify({ type: 'start', personaId: 'support' }));
  while (!sessionId) await sleep(50);
  check(true, 'session ready');

  for (let i = 0; i < 15; i++) {
    ws.send(loud);
    await sleep(100);
  }
  for (let i = 0; i < 30; i++) {
    ws.send(quiet);
    await sleep(100);
  } // silence -> mock AI replies
  await sleep(1500);

  check(events.some((e) => e.type === 'transcript' && e.role === 'user'), 'user transcript received');
  check(events.some((e) => e.type === 'transcript' && e.role === 'assistant'), 'assistant transcript received');
  check(audioBytes > 0, `AI audio received (${audioBytes} bytes)`);

  const live = await (await fetch(`${BASE}/api/dashboard/overview`, { headers: auth })).json();
  check(live.active >= 1, 'dashboard shows an active session mid-call');

  ws.send(JSON.stringify({ type: 'stop' }));
  await sleep(500);

  const overview = await (await fetch(`${BASE}/api/dashboard/overview`, { headers: auth })).json();
  check(overview.sessions >= 1, `overview counts sessions (${overview.sessions})`);
  check(overview.total_tokens > 0, `tokens tracked (${overview.total_tokens})`);
  check(overview.cost_usd > 0, `cost estimated ($${overview.cost_usd.toFixed(6)})`);

  const detail = await (await fetch(`${BASE}/api/dashboard/sessions/${sessionId}`, { headers: auth })).json();
  check(detail.session.status === 'completed', 'session marked completed');
  check(detail.session.duration_ms > 3000, `duration recorded (${detail.session.duration_ms} ms)`);
  check(detail.transcript.length >= 2, `transcript saved (${detail.transcript.length} entries)`);

  const trends = await (await fetch(`${BASE}/api/dashboard/trends?days=7`, { headers: auth })).json();
  check(trends.points.length >= 1, 'daily trends available');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
