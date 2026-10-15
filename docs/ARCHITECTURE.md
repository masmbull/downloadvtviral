# Architecture — DownloadVTViral

## Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, lucide-react |
| API | Next.js Route Handlers (`src/app/api/*`) |
| Extract engine | FastAPI + yt-dlp (`server/`), Docker |
| Fallback | RapidAPI provider |
| Deploy | Vercel (web) + Cloudflare Tunnel (backend) |
| Telemetry | Vercel Speed Insights, Analytics |

## Alur request

```
Browser
  └─ POST /api/download { url, platform }
        ├─ rateLimit(request)            # src/lib/rate-limit.ts
        ├─ sanitizeInput + validateUrl
        ├─ detectPlatform
        ├─ safeGetFromYtDlp(url)         # PRIMARY  → server/main.py /api/extract
        │     └─ (fallback) safeGet<Platform>Video(url)   # RAPIDAPI
        ├─ recordVisit + recordDownload  # src/lib/store.ts
        └─ 200 MediaResult
```

Unduhan:

```
GET /api/proxy/download?url&filename
   └─ stream response.body + Content-Disposition
```

Monetisasi:

```
Klik download → /shortlink/redirect?url&filename&delay=5 (countdown)
   → /api/proxy/download → file
```

## Kontrak data

`MediaResult`:

```ts
type MediaResult = {
  platform: Platform;
  title: string;
  thumbnail: string;
  type: 'video' | 'images';
  downloads: { quality: string; url: string }[];
};
```

Backend yt-dlp (`POST /api/extract`) mengembalikan bentuk yang sama, sehingga Next.js
bisa meneruskan respons langsung.

## Backend yt-dlp (`server/`)

- `GET /health` — health check.
- `POST /api/extract` — `{ url }` → `MediaResult`.
- `GET /api/stream?url&format` — stream bytes via `yt-dlp -o -`.

Quality preset: Best / 720p / 480p (`QUALITY_PRESETS` di `server/main.py`).
Bila `YTDLP_PUBLIC_URL` diset, hasil `downloads[].url` menunjuk ke `/api/stream`
(proxy milik backend), bukan URL mentah — menghindari URL expiring.

### Penambahan custom host resolver (rencana)

`server/main.py` akan memakai tabel resolver:

```python
RESOLVERS = {
    "doodstream": resolve_doodstream,   # scrape /e/<id>, pass_md5
    "vidara":     resolve_vidara,       # player config → m3u8
    "videy":      resolve_videy,        # id → cdn url
    "streamrizz": resolve_streamrizz,
    ...
}
```

Ekstraksi dicoba: yt-dlp generic → resolver host → fallback RapidAPI → error.

## Store

`src/lib/store.ts` = array in-memory (cap 1000), reset saat cold start. Untuk produksi
nyata pindah ke Supabase (dependency sudah ada) atau Redis/KV.

## Keamanan

- Security headers di `next.config.ts`.
- Validasi hostname per platform (`validateUrl`).
- Rate limit per IP (in-memory).
- Tidak ada secret client-side selain `NEXT_PUBLIC_*`.
- Admin auth env-based (lihat catatan hardening di ROADMAP).

## Batasan saat ini

- Store hilang saat cold start / multiple serverless instance.
- Rate limit tidak akurat lintas instance.
- Admin auth hanya localStorage (bukan session server).
- Provider Tier 2 (host video) belum ada resolver → butuh kerja lanjutan.