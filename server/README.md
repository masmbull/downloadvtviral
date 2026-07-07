# yt-dlp Backend Server

Self-hosted FastAPI server that uses `yt-dlp` to extract and stream media.
Used as the **primary** download provider — RapidAPI is the fallback.

## Requirements
- Docker Desktop
- Cloudflare Tunnel (to expose locally to Vercel)

## Run locally

```bash
cd server
docker compose up --build
```

Server starts at `http://localhost:8000`.

## Expose with Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:8000
```

Copy the generated `https://xxxx.trycloudflare.com` URL.

## Set environment variables

In `.env.local` (local dev):
```
YTDLP_API_URL=https://xxxx.trycloudflare.com
YTDLP_PUBLIC_URL=https://xxxx.trycloudflare.com
```

On Vercel (production):
```bash
vercel env add YTDLP_API_URL
```

## API Endpoints

- `GET  /health` — health check
- `POST /api/extract` — extract media info `{ url: string }`
- `GET  /api/stream?url=...&format=best` — stream video bytes
