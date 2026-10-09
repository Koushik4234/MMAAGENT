# AI Voice Agent + Usage/Cost Dashboard

A real-time voice agent built on **Google Gemini Live**, plus a password-protected **dashboard** that tracks sessions, duration, tokens and estimated cost.

- **Talk page** (`/`): speak to the AI, interrupt it anytime, pick a persona or write your own system prompt.
- **Embeddable widget**: one `<script>` tag puts a floating "Talk to AI" button on any website.
- **Dashboard** (`/dashboard`): live session counts, per-session duration/tokens/cost, running total, daily/weekly trends, full transcripts.

## Quick start (5 minutes)

Requirements: Node.js 22.13 or newer (uses the built-in `node:sqlite`, so nothing needs compiling; Node 24 works).

```bash
npm install
cp .env        # Windows: copy .env.example .env  (then edit .env)
npm run dev                 # server :4000 + client :5173
```

Open <http://localhost:5173>.

- **No Gemini key yet?** Leave `GEMINI_API_KEY` empty. The app runs in **mock mode** (canned replies, real tracking) so you can try everything.
- **With a key:** get one free at <https://aistudio.google.com/apikey>, put it in `.env`, restart.
- Dashboard login = `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`.

Verify everything works (server must be running):

```bash
npm run smoke -w server
```

## Production

```bash
npm run build     # builds the React app into client/dist
npm start         # one Node process serves API + WebSocket + the built site
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for cloud hosting and a Dockerfile.

## Embed the widget

```html
<script src="https://YOUR-HOST/widget.js" data-persona="support" data-label="Talk to us" defer></script>
```

Add the website that embeds it to `ALLOWED_ORIGINS` only if you call the API from that site directly; the widget itself runs inside an iframe served from your host.

## Project layout

```
server/src
  config/        env parsing, pricing, personas
  db/            SQLite schema
  repositories/  all SQL (sessions, transcripts)
  services/      sessionService, sessionTracker, costService
    providers/   geminiLiveProvider, mockLiveProvider (swap/add providers here)
  realtime/      WebSocket endpoint /ws/voice
  routes/        public, auth, dashboard HTTP routes
  middleware/    JWT auth, login rate limit
client/src
  audio/         MicCapture, PcmPlayer (browser audio)
  hooks/         useVoiceAgent, usePolling
  components/    VoiceAgentPanel, VoiceOrb, TranscriptView, charts, tables...
  pages/         Voice, Embed, Login, Dashboard
```

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Configuration

All settings are in `.env` (see `.env.example`). Important ones: `GEMINI_API_KEY`, `GEMINI_MODEL`, `MAX_SESSION_SECONDS` (cost safety cap), `ADMIN_PASSWORD`, `JWT_SECRET`, and the `PRICE_*` values.

## Extending

- **New persona:** add an entry in `server/src/config/personas.js`.
- **Another AI provider (e.g. OpenAI Realtime):** add a class with the same `connect()` interface in `server/src/services/providers/` and select it in `providers/index.js`.
- **New dashboard widget:** create a component in `client/src/components/` and add it to `DashboardPage.jsx`; add a query in `SessionRepository` and a route in `dashboardRoutes.js` if you need new data.
- **Price changes:** update `PRICE_*` in `.env`, no code change.

## Known limitations / honest notes

- Cost is an **estimate** from Gemini's reported token usage and the prices in `.env`; compare against your Google Cloud / AI Studio billing.
- If Gemini does not report audio tokens, audio duration × `AUDIO_TOKENS_PER_SECOND` is used instead.
- The dashboard refreshes by polling every 3 seconds (near real time). Swap `usePolling` for Server-Sent Events if you need instant updates.
- SQLite is perfect for one server instance. For multiple instances, move to Postgres (only the `repositories/` folder changes).
