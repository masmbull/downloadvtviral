# DownloadVTViral

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Paste one link, download from anywhere.** Downloader video viral dari 20+ platform —
YouTube, TikTok, Instagram, X/Twitter, Facebook, Reddit, Vimeo, sampai video host seperti
Videy, Vidara, Doodstream. Gratis, cepat, tanpa login.

Production: **https://downloadvtviral.web.id**

## Fitur

- **Multi-platform** — social media + video hosting.
- **Multi-link / batch** — tempel hingga 3 link sekaligus.
- **Tanpa watermark** — kualitas terbaik yang tersedia.
- **Carousel foto** — Instagram / Pinterest, unduh gambar satu per satu.
- **Tanpa login** — langsung pakai.
- **Streaming proxy** — kompatibel IDM & browser, tanpa buffering.
- **Monetisasi shortlink** — countdown ad 5 detik (bisa dikonfigurasi).
- **Admin & dashboard** — stat realtime, visitor IP, unduhan per platform.
- **Halaman `/status`** — health check API + provider.
- **Light / dark theme**.

## Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, lucide-react |
| Extract engine | FastAPI + **yt-dlp** + custom resolvers (`server/`) |
| Fallback | RapidAPI |
| Deploy | Vercel + Cloudflare Tunnel |
| Telemetry | Vercel Speed Insights / Analytics |

## Arsitektur

```
Browser (Next.js 16)
   │  POST /api/download
   ▼
Next.js Route Handler ── rate limit + validasi URL
   │
   ├─ 1. yt-dlp backend (server/, FastAPI + Docker)   ← PRIMARY
   │        └─ generic + custom host resolvers
   ├─ 2. RapidAPI provider                            ← FALLBACK
   └─ 3. error ramah pengguna
   │
   ▼
GET /api/proxy/download  ──► stream bytes → file
```

## Platform didukung

| Platform | Status |
|----------|--------|
| YouTube, TikTok, Instagram, Vimeo, Twitch, Rumble | ✅ |
| X/Twitter, Facebook, Reddit, Pinterest, LinkedIn, Snapchat | ✅ |
| Videy, Vidara, Doodstream | ✅ (custom resolvers) |
| Streamtape, Filemoon, Mixdrop, Voe, StreamRizz | 🟡 best-effort |

Detail lengkap + cara menambah platform: [`docs/PLATFORMS.md`](docs/PLATFORMS.md).

## Mulai cepat

### 1. Web app (Next.js)

```bash
git clone https://github.com/masmbull/downloadvtviral.git
cd downloadvtviral

npm install

cp .env.example .env.local
# isi nilai di .env.local

npm run dev
```

Buka http://localhost:3000

### 2. Backend yt-dlp (opsional tapi disarankan)

```bash
cd server
docker compose up --build -d
# backend di http://localhost:8000

# expose ke internet (Vercel perlu URL publik)
cloudflared tunnel --url http://localhost:8000
# salin URL https://xxxx.trycloudflare.com ke YTDLP_API_URL
```

Panduan backend: [`server/README.md`](server/README.md).

## Environment Variables

| Variabel | Wajib | Deskripsi |
|----------|-------|-----------|
| `YTDLP_API_URL` | disarankan | URL publik backend yt-dlp (primary provider) |
| `YTDLP_PUBLIC_URL` | opsional | Dipakai backend untuk membangun URL stream |
| `RAPIDAPI_KEY` | opsional | Fallback provider — https://rapidapi.com |
| `NEXT_PUBLIC_SITE_URL` | ya | URL publik situs |
| `NEXT_PUBLIC_SITE_NAME` | tidak | Nama tampilan situs |
| `SHORTLINK_API_URL` | opsional | Endpoint shortlink monetisasi |
| `SHORTLINK_AD_DELAY` | tidak | Detik countdown ad (default 5) |
| `ADMIN_USERNAME` | ya | Login admin |
| `ADMIN_PASSWORD` | ya | Password admin |

Salin [`.env.example`](.env.example) → `.env.local`.

### Vercel

```bash
vercel env add YTDLP_API_URL
vercel env add RAPIDAPI_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
```

## Struktur proyek

```
src/
  app/
    page.tsx                     # landing (hero + form + seksi)
    admin/                       # login + panel admin
    dashboard/                   # statistik
    status/                      # health check publik
    shortlink/redirect/          # gate monetisasi (countdown)
    api/
      download/                  # endpoint ekstraksi utama
      proxy/download/            # streaming proxy
      shortlink/…                # create + redirect
      admin/…                    # login + stats
      status/check/              # health provider
      visitor/info, visitors/track
  components/                    # navbar, hero, form, seksi, ui/
  lib/                           # rate-limit, store, utils
server/
  main.py                        # FastAPI + yt-dlp
  Dockerfile, docker-compose.yml
docs/
  PRD.md, ARCHITECTURE.md, PLATFORMS.md, ROADMAP.md
```

## Dokumentasi

- [PRD](docs/PRD.md) — kebutuhan produk, tujuan, metrik, risiko.
- [Architecture](docs/ARCHITECTURE.md) — stack, alur, kontrak data, batasan.
- [Platforms](docs/PLATFORMS.md) — host didukung + cara menambah.
- [Roadmap](docs/ROADMAP.md) — milestone & rencana.
- [Server](server/README.md) — backend yt-dlp.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # jalankan build
npm run lint    # eslint
```

## Keamanan

- HTTPS via Vercel; security headers di `next.config.ts`.
- Validasi hostname per platform + sanitasi input.
- Rate limit per IP pada `/api/download`.
- Tidak ada secret yang bocor ke client.
- Admin auth berbasis env (rencana: cookie httpOnly + session).

## Batasan

- Store statistik in-memory → reset saat cold start (rencana: Supabase/Redis).
- Rate limit in-memory (rencana: Redis/KV).
- Provider video host (Tier 2) butuh custom resolver — sedang dikerjakan.

## Kontribusi

1. Fork & buat branch.
2. Ikuti konvensi yang ada (baca `AGENTS.md`).
3. Jalankan `npm run lint` sebelum PR.

## Lisensi

MIT. Lihat [LICENSE](LICENSE).

> **Disklaimer**: hanya untuk konten publik dan penggunaan pribadi. Hormati ToS tiap
> platform dan hak cipta. Konten yang melanggar akan dihapus atas permintaan.