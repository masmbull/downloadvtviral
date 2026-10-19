# Deploy Guide

Frontend (Next.js) → Vercel. Backend (yt-dlp + ffmpeg) → VPS/Railway/Fly + Cloudflare named tunnel.

## 1. Backend hosting (required for video extraction)

The backend is **Docker + ffmpeg** and does **not** run on Vercel. Pick one:

| Host | Setup |
| --- | --- |
| Railway | `server/Dockerfile` ready; `railway deploy` from `server/`. Free tier. |
| Fly.io | `fly launch` from `server/`; add `machines.processes.cmd = ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`. |
| Any VPS | `docker compose -f server/docker-compose.yml up -d`. |

### Cloudflare named tunnel (stable URL)

Quick-tunnel URLs rotate on restart. Use a **named tunnel**:

```bash
# 1. Login
cloudflare login

# 2. Create tunnel (once)
cloudflare tunnel create ytdlp-api

# 3. Print tunnel id + origin cert
cloudflare tunnel info ytdlp-api

# 4. Run on the backend host (inside container or host)
cloudflare tunnel run --url http://localhost:8000 ytdlp-api
# or with origin cert for production:
cloudflare tunnel run --url http://localhost:8000 --origincert /path/to/cert.pem ytdlp-api

# 5. DNS (Cloudflare dashboard, CNAME → <tunnel-id>.cfargotunnel.com)
#    hostname: api.downloadvtviral.com  →  <tunnel-id>.cfargotunnel.com
```

Result: a stable public URL, e.g. `https://api.downloadvtviral.com`.

### Environment on backend

```
YTDLP_PUBLIC_URL=https://api.downloadvtviral.com
YTDLP_BIN=yt-dlp
# Optional: RESOLVER_USER_AGENT=Mozilla/5.0 ...
```

Verify:
```
curl https://api.downloadvtviral.com/health
# {"status":"ok",...}
```

## 2. Vercel env vars

Add in the Vercel dashboard (Project → Settings → Environment Variables):

| Key | Value | Required |
| --- | --- | --- |
| `YTDLP_API_URL` | backend stable URL (https://api.downloadvtviral.com) | yes |
| `NEXT_PUBLIC_SITE_URL` | your domain (https://downloadvtviral.com) | yes |
| `ADMIN_USERNAME` | admin login | yes |
| `ADMIN_PASSWORD` | admin password | yes |
| `RAPIDAPI_KEY` | optional fallback provider | no |
| `SHORTLINK_API_URL` / `SHORTLINK_AD_DELAY` | optional shortlink monetization | no |

`.env.example` is the source of truth for all keys.

> `NEXT_PUBLIC_SITE_URL` is **inlined at build time**. Set it before triggering a build or `/status` silently falls back to `localhost:3000`.

## 3. Deploy frontend

```bash
# local
vercel --prod

# or Vercel dashboard: Deploy → Production
```

## 4. Verify

```
curl https://downloadvtviral.com/api/status/check
# backend: "healthy" | "unreachable"

curl https://downloadvtviral.com/api/download?url=https://youtu.be/VIDEO_ID
# {"ok":true,"platform":"youtube",...}
```

If `/api/download` returns `503` with `reason: "no_provider_configured"`, then neither `YTDLP_API_URL` nor `RAPIDAPI_KEY` is set — add one.

## 5. Optional: self-hosted proxy route

`/api/proxy/download` runs on Vercel's Node.js runtime (HLS → backend remux). No extra config needed once the backend URL is set.

## 6. Admin

`/admin` (login with `ADMIN_USERNAME` / `ADMIN_PASSWORD`). Stats, visitors, and platform list are now generic.