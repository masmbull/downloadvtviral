# DownloadVTViral

Instagram & TikTok video downloader. Free, fast, and easy to use.

## Live

- Production: https://downloadvtviral.vercel.app

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
- [ ] Connect reliable Instagram/TikTok provider endpoint and handle failures
- [ ] Add loading skeleton and better empty/error states
- [ ] Add about / contact / privacy pages
- [ ] Add basic analytics dashboard for usage
- [ ] Monetization placeholders (ads / affiliate links)

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

## Environment Variables

```
RAPIDAPI_KEY=your_key_here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=DownloadVTViral
```

## Local Development

1. Clone repo
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Run `npm run dev`

## License

MIT
