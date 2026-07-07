# DownloadVTViral

Instagram & TikTok video downloader. Free, fast, and easy to use.

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
- [x] Dashboard protected behind admin login
- [x] Public `/status` page with live API/backend health checks
- [x] Visitor IP tracking in dashboard
- [x] "Download other video" CTA between batch results
- [x] Filename sanitization based on actual video title
- [x] Hidden iframe download proxy to prevent redirect
- [x] Download progress bars
- [x] Real admin stats API
- [x] YouTube video download support
- [x] Doodstream video download support
- [x] Supported platforms section on homepage
- [x] Shortlink monetization integration (punyasahlan.my.id)
- [x] 5-second ad countdown before download
- [x] Visitor IP and network speed display under download buttons
- [x] IDM and browser compatible downloads

## Tech Stack

- Next.js 16
- React 19
- shadcn/ui
- Tailwind CSS v4
- Vercel Speed Insights
- RapidAPI-backed video info fetcher

## Security

- HTTPS enforced via Vercel
- Content security headers in `next.config.ts`
- Input sanitization + URL/hostname validation
- In-memory rate limiting per IP on `/api/download`
- No secrets exposed client-side
- Admin auth via `/api/admin/login` with env credentials
- Dashboard and admin routes protected behind auth

## Environment Variables

```
RAPIDAPI_KEY=your_key_here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=DownloadVTViral
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Local Development

1. Clone repo
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Run `npm run dev`

## License

MIT
