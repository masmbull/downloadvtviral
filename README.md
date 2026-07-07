# DownloadVTViral

Instagram, TikTok, YouTube & Doodstream video downloader. Free, fast, and easy to use.

## Live

- Production: https://downloadvtviral.web.id

## Progress Checklist

- [x] Project scaffold with Next.js 16 + TypeScript + Tailwind v4
- [x] GitHub repo linked at https://github.com/masmbull/downloadvtviral
- [x] Vercel production deployment
- [x] Basic download page with Instagram / TikTok URL input
- [x] `/api/download` API with rate limiting and URL validation
- [x] shadcn/ui setup (`input`, `button`, `card`)
- [x] Theme provider with light/dark toggle
- [x] SpeedInsights enabled
- [x] Security headers configured (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`)
- [x] Multi-link downloader (up to 3 links in demo mode)
- [x] Photo collage support for Instagram (download images one by one)
- [x] Admin login page with env-based auth
- [x] Dashboard protected behind admin login (persists across page refresh)
- [x] Public `/status` page with live API/backend health checks
- [x] Visitor IP tracking in dashboard
- [x] "Download other video" CTA between batch results
- [x] Filename sanitization based on actual video title
- [x] Download progress bars
- [x] Real admin stats API
- [x] YouTube video download support
- [x] Doodstream video download support
- [x] Supported platforms section on homepage
- [x] Shortlink monetization integration (punyasahlan.my.id)
- [x] 5-second ad countdown before download
- [x] Visitor IP and network speed display under download buttons
- [x] IDM and browser compatible downloads (anchor tag, no popup)
- [x] Streaming proxy (no buffering, handles large files)
- [x] Self-hosted yt-dlp backend (`server/`) as primary provider
- [x] RapidAPI as fallback provider

## Tech Stack

- Next.js 16
- React 19
- shadcn/ui
- Tailwind CSS v4
- Vercel Speed Insights
- yt-dlp (self-hosted FastAPI backend)
- RapidAPI (fallback)

## Architecture

```
Browser → Next.js /api/download
              ↓ try first
         yt-dlp backend (server/)  ← Docker + Cloudflare Tunnel
              ↓ fallback
         RapidAPI providers
```

## Security

- HTTPS enforced via Vercel
- Content security headers in `next.config.ts`
- Input sanitization + URL/hostname validation
- In-memory rate limiting per IP on `/api/download`
- No secrets exposed client-side
- Admin auth via `/api/admin/login` with env credentials
- Dashboard and admin routes protected behind auth (localStorage persistence)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Primary provider — self-hosted yt-dlp (see server/README.md)
YTDLP_API_URL=https://your-tunnel-url.trycloudflare.com

# Fallback provider — get free key at https://rapidapi.com
RAPIDAPI_KEY=your_rapidapi_key_here

# Site
NEXT_PUBLIC_SITE_URL=https://downloadvtviral.web.id
NEXT_PUBLIC_SITE_NAME=DownloadVTViral

# Admin panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### Vercel (production)

```bash
vercel env add YTDLP_API_URL
vercel env add RAPIDAPI_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
```

## Local Development

```bash
# 1. Clone repo
git clone https://github.com/masmbull/downloadvtviral.git
cd downloadvtviral

# 2. Install dependencies
npm install

# 3. Set up env
cp .env.example .env.local
# Edit .env.local with your values

# 4. (Optional) Start yt-dlp backend
cd server && docker compose up --build -d && cd ..

# 5. (Optional) Expose backend via Cloudflare Tunnel
cloudflared tunnel --url http://localhost:8000
# Copy the URL into YTDLP_API_URL in .env.local

# 6. Start dev server
npm run dev
```

## yt-dlp Backend (server/)

See [`server/README.md`](server/README.md) for full setup instructions.

The backend is a FastAPI + yt-dlp Docker container that handles all platforms
(Instagram, TikTok, YouTube, Doodstream, and more) without needing a paid API key.

## License

MIT
