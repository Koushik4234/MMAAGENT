# Architecture

```
 Browser                                  Node server                          Google
┌──────────────────────┐   WebSocket    ┌───────────────────────────┐        ┌────────────┐
│ MicCapture (16 kHz)  │ ─ PCM16 ─────▶ │ voiceSocket               │ ─────▶ │ Gemini Live│
│ PcmPlayer  (24 kHz)  │ ◀─ PCM16 ───── │  └ provider (gemini/mock) │ ◀───── │    API     │
│ useVoiceAgent hook   │ ◀─ JSON events │  └ SessionTracker         │        └────────────┘
└──────────────────────┘                │       ├ costService       │
                                        │       └ repositories ──▶ SQLite
┌──────────────────────┐   HTTPS + JWT  │ routes (auth, dashboard)  │
│ Dashboard (React)    │ ─ polling ───▶ │                           │
└──────────────────────┘                └───────────────────────────┘
```

## Why the browser talks to *our* server, not Gemini directly

1. The API key stays secret on the server.
2. We see every message, so we can log transcripts and token usage (the main requirement).
3. We can enforce limits (max session length, allowed origins).

## Voice call flow

1. Browser asks for the microphone, opens `wss://host/ws/voice`, sends `{type:"start", personaId, systemPrompt?}`.
2. Server creates a session row, connects to Gemini Live with the persona's system prompt, replies `{type:"ready"}`.
3. Browser streams 100 ms PCM16 16 kHz mic chunks as binary frames.
4. Gemini returns audio (24 kHz PCM) + transcripts + `usageMetadata`. The server forwards audio/transcripts to the browser and records usage.
5. **Interruptions:** Gemini's built-in voice activity detection sends `interrupted` when the user talks over the AI. The server forwards it and the browser immediately clears its playback queue.
6. Call ends on `{type:"stop"}`, socket close, provider close, or `MAX_SESSION_SECONDS`.

## Logging and cost

`SessionTracker` keeps per-call state and saves it to SQLite at most once per second and on finish:

- duration, audio seconds in/out
- tokens in four buckets: text in, audio in, text out, audio out (from Gemini's per-modality `usageMetadata`)
- `cost = Σ tokens × price / 1,000,000` (prices from `.env`)
- transcript entries (consecutive chunks of one speaker are merged into one line)

`USAGE_MODE=cumulative` (default) treats `usageMetadata` as running session totals and keeps the max seen. If your logs show per-message numbers instead, set `USAGE_MODE=delta`.

## Dashboard

React + Recharts. `usePolling` fetches `/api/dashboard/{overview,trends,sessions}` every few seconds with a JWT. Weekly view is computed client-side from daily data.

## Security

- Dashboard APIs require a JWT (login with env credentials; rate-limited, timing-safe compare).
- The voice socket is public by design (it is the widget) but protected by origin checks, a per-session time cap, and prompt length cap. For stricter control add a signed short-lived token to the `start` message.
- Change `ADMIN_PASSWORD` and `JWT_SECRET` before deploying; serve over HTTPS (browsers require it for the microphone outside localhost).

## Layering rule

routes / socket → services → repositories → SQLite. Providers are isolated behind one interface so the rest of the app never imports Gemini code.
