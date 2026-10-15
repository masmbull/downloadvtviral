# Roadmap — DownloadVTViral

## Sudah selesai (current)

- [x] Scaffold Next.js 16 + TS + Tailwind v4 + shadcn/ui
- [x] Halaman unduh (multi-link maks 3)
- [x] `/api/download` + rate limit + validasi URL
- [x] Provider yt-dlp self-hosted + RapidAPI fallback
- [x] YouTube, TikTok, Instagram, Doodstream
- [x] Carousel foto Instagram
- [x] Admin login, dashboard, `/status`
- [x] Shortlink monetisasi + countdown 5s
- [x] Proxy streaming (IDM/browser friendly)
- [x] Security headers, theme light/dark

## Milestone 1 — Fondasi solid

- [ ] Persist store ke Supabase (ganti `src/lib/store.ts` in-memory)
- [ ] Rate limit ke Redis/KV (akurat lintas instance)
- [ ] Admin auth pindah ke cookie httpOnly + session (buang localStorage)
- [x] Refactor deteksi platform ke satu modul bersama (SSOT) — `src/lib/platforms.ts`
- [x] Tabel `PLATFORM_HOSTS` terpusat (mirror di `server/main.py`)
- [ ] Test unit: validasi URL, deteksi platform, sanitasi filename

## Milestone 2 — Perluas platform Tier 1

- [x] X/Twitter, Facebook, Reddit, Pinterest, LinkedIn, Snapchat, Vimeo, Twitch, Rumble
- [x] Tambah kartu platform dinamis + dokumentasi

## Milestone 3 — Video host Tier 2 (custom resolver)

- [x] Kerangka `RESOLVERS` di `server/main.py`
- [x] Videy resolver (`resolve_videy`)
- [x] Vidara resolver (`resolve_vidara`, HLS via ffmpeg)
- [x] Doodstream resolver (`resolve_doodstream`)
- [x] Streamtape / Filemoon / Mixdrop / Voe / StreamRizz (generic page scan, best-effort)
- [x] Streaming endpoint: HLS→MP4 remux + progressive passthrough (Range support)
- [ ] Health monitoring per resolver

## Milestone 4 — UX & performa

- [ ] Progress unduhan nyata (bukan animasi)
- [ ] Preview video inline sebelum unduh
- [ ] Riwayat lokal (localStorage) tanpa server
- [ ] PWA / offline shell
- [ ] Optimasi gambar thumbnail (next/image)

## Milestone 5 — Monetisasi & skala

- [ ] Tier "Pro" (batch tak terbatas) + pembayaran
- [ ] A/B test durasi countdown
- [ ] Alternatif shortlink multi-network
- [ ] Caching metadata ekstraksi (short TTL)
- [ ] Observability (log terstruktur, alert saat provider down)

## Ide masa depan

- [ ] API publik ber-key untuk developer
- [ ] Audio-only (MP3) ekstraksi
- [ ] Subtitle / caption extraction
- [ ] Ekstensi browser / bot Telegram