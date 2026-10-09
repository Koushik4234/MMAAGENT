# Deployment guide

The app is **one Node process** (API + WebSocket + static React build) with a SQLite file. That makes hosting simple, but it needs a host that supports **long-lived WebSocket connections and a persistent disk**.

## Recommended hosts

| Option | Good for | Notes |
|---|---|---|
| **Render / Railway / Fly.io** (container or Node service) | Easiest | Attach a persistent volume for the SQLite file; WebSockets work out of the box |
| **VPS** (DigitalOcean, Hetzner, AWS Lightsail) + Caddy/Nginx | Cheapest, full control | Use Caddy for automatic HTTPS |
| **Google Cloud Run** | Google-native | Set min instances 1, request timeout up to 60 min, and use Postgres/Cloud SQL instead of local SQLite (disk is ephemeral) |

Avoid serverless functions (Vercel/Netlify functions): they do not hold WebSockets.

**HTTPS is mandatory** in production, otherwise browsers block the microphone.

## Environment setup

Set these on the host (copy from `.env`):

```
GEMINI_API_KEY=...            # required
GEMINI_MODEL=gemini-3.8-live  # confirm current name at ai.google.dev/gemini-api/docs/pricing
ADMIN_USERNAME=...
ADMIN_PASSWORD=...            # strong
JWT_SECRET=...                # openssl rand -hex 32
ALLOWED_ORIGINS=https://your-domain.com
MAX_SESSION_SECONDS=300
SQLITE_PATH=/data/voice-agent.db   # on a persistent volume
```

## Build and run (any host)

```bash
npm ci
npm run build
npm start
```

## Docker

```bash
docker build -t voice-agent .
docker run -p 4000:4000 -v voice-data:/data --env-file .env -e SQLITE_PATH=/data/voice-agent.db voice-agent
```

## Reverse proxy (Nginx) WebSocket snippet

```
location /ws/ {
  proxy_pass http://127.0.0.1:4000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_read_timeout 3600s;
}
```

(Caddy needs no special config: `your-domain.com { reverse_proxy localhost:4000 }`.)

## Cost safety checklist

- Keep `MAX_SESSION_SECONDS` low.
- Set a budget alert in Google Cloud / AI Studio.
- Restrict `ALLOWED_ORIGINS`.
- Compare the dashboard total with Google's billing page weekly while tuning prices.

## Backups

Copy the SQLite file (`SQLITE_PATH`) on a schedule, or move to a managed Postgres.
