# yt-dlp Backend Server

Self-hosted FastAPI server that extracts media from **20+ platforms** using a
three-layer strategy:

1. **Custom resolvers** for video hosts yt-dlp cannot handle (Videy, Vidara, Doodstream, …).
2. **yt-dlp** (native + generic extractors) for social media.
3. **FFmpeg** for HLS (`m3u8`) → MP4 remux on the streaming endpoint.

Free — no API keys required. Used as the **primary** provider; RapidAPI is the fallback.

## Requirements

- Docker Desktop (bundles `yt-dlp` + `ffmpeg`)
- Cloudflare Tunnel (to expose the local server to Vercel)

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

## Environment variables

In `.env.local` (local dev):

```env
YTDLP_API_URL=https://xxxx.trycloudflare.com
YTDLP_PUBLIC_URL=https://xxxx.trycloudflare.com
```

On Vercel (production):

```bash
vercel env add YTDLP_API_URL
vercel env add YTDLP_PUBLIC_URL
```

Optional: `RESOLVER_USER_AGENT` to override the default browser UA.

## API Endpoints

- `GET  /health` — health check `{ ok: true }`.
- `POST /api/extract` — body `{ "url": "<video url>" }` → `MediaResult`.
- `GET  /api/stream?url=...` — stream direct media (HLS via ffmpeg, else passthrough).
- `GET  /api/stream?url=...&format=best` — legacy yt-dlp format-preset stream.

### MediaResult

```json
{
  "platform": "videy",
  "title": "Video title",
  "thumbnail": "https://...",
  "type": "video",
  "downloads": [{ "quality": "HD", "url": "https://cdn.videy.co/xxxx.mp4" }]
}
```

## Supported platforms

Social (yt-dlp): YouTube, TikTok, Instagram, X/Twitter, Facebook, Reddit, Pinterest,
Vimeo, Twitch, Rumble, Snapchat, LinkedIn.

Video hosts (custom resolvers): **Videy** (`cdn.videy.co/{id}.mp4`), **Vidara**
(cookie + `POST /api/stream` → HLS), **Doodstream** (`/pass_md5` scrape), plus best-effort
generic page scanning for Streamtape, Filemoon, Mixdrop, Voe, StreamRizz.

## Adding a resolver

1. Write `def resolve_<host>(url: str) -> dict | None` returning a `MediaResult` dict.
2. Register it in the `RESOLVERS` map.
3. Add the host to `PLATFORM_HOSTS` (keep in sync with `src/lib/platforms.ts`).

Hosts frequently rotate domains — update the host lists in one place.