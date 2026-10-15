# PRD — DownloadVTViral

> Product Requirements Document
> Versi: 1.0 · Status: Draft · Pemilik: masmbull

## 1. Ringkasan

**DownloadVTViral** adalah web app gratis untuk mengunduh video dari banyak platform
(social media + video hosting) hanya dengan menempel sebuah URL. Target: cepat, tanpa
login, mobile-friendly, mendukung batch, dan monetisasi via shortlink.

Kalimat posisi: *"Paste one link, download from anywhere."*

## 2. Latar Belakang & Masalah

Konten viral tersebar di banyak host: YouTube, TikTok, Instagram, X/Twitter, Facebook,
dan host video seperti Doodstream, Vidara, Videy, StreamRizz. Pengguna kesulitan:

- Harus buka situs downloader berbeda untuk tiap host.
- Banyak situs downloader penuh iklan, popup, dan malware.
- Hasil watermark / kualitas rendah.
- Tidak bisa batch (banyak link sekaligus).

## 3. Tujuan (Goals)

| # | Goal | Metrik |
|---|------|--------|
| G1 | Satu antarmuka untuk semua host populer | ≥ 12 platform didukung |
| G2 | Kecepatan ekstrak < 5s (p50) | p50 latency `/api/download` |
| G3 | Tingkat sukses tinggi | success rate ≥ 90% |
| G4 | Monetisasi | CTR shortlink, ad impressions |
| G5 | Operasional transparan | halaman `/status` live |

### Non-Goals (v1)

- Tidak menyimpan media di server (streaming/proxy saja).
- Tidak ada akun pengguna / login publik.
- Tidak menyimpan riwayat unduhan user.
- Tidak membuat re-upload / hosting konten.

## 4. Pengguna

- **Pengguna umum / mobile**: mau simpan video viral cepat.
- **Content curator / admin sosmed**: batch ambil banyak video.
- **Admin operator**: monitor status & provider.

## 5. Cakupan Platform

### 5.1 Tier 1 — Social (didukung yt-dlp native)

| Platform | Host | Catatan |
|----------|------|---------|
| YouTube | youtube.com, youtu.be, shorts | video, shorts, audio |
| TikTok | tiktok.com, vm.tiktok.com | no watermark |
| Instagram | instagram.com, instagr.am | reels, post, carousel (foto) |
| X / Twitter | x.com, twitter.com | video & gif |
| Facebook | facebook.com, fb.watch | reels, video |
| Reddit | redd.it, reddit.com | v.redd.it |
| Pinterest | pinterest.com, pin.it | video & image |
| LinkedIn | linkedin.com | post video |
| Vimeo | vimeo.com | video |
| Snapchat | snapchat.com | spotlight |
| Twitch | twitch.tv | clips, VOD |
| Rumble | rumble.com | video |

### 5.2 Tier 2 — Video host (butuh custom extractor)

yt-dlp **tidak** punya extractor native untuk mayoritas host ini → backend harus
memakai **generic extractor + custom resolver** (scrape halaman, ambil `m3u8`/`mp4`).

| Host | Strategi |
|------|----------|
| Doodstream | doodstream.com, dood.to, d000d.com, *dood.* mirrors → scrape `/e/<id>`, unpack `eval`, ambil `/pass_md5/` |
| Vidara | vidara.to, vidara.so → scrape player config → `m3u8`/`mp4` |
| Videy | videy.co, videy.com → API `cdn` langsung dari id |
| StreamRizz | streamrizz.com → scrape player embed |
| Streamtape | streamtape.com, streamtape.to → scrape `get_video` |
| Filemoon | filemoon.sx, bysezejataos.com → unpack embed |
| Mixdrop | mixdrop.* → scrape player |
| Voe | voe.sx, voe.to → unpack |

> **Risiko**: host-host ini anti-bot (Cloudflare, JS eval, rotating domain). Strategi
> berlapis: (1) yt-dlp generic, (2) custom resolver Python, (3) RapidAPI fallback,
> (4) graceful error. Detail di `docs/PLATFORMS.md`.

## 6. Alur Pengguna Utama

```
Paste URL → deteksi platform → POST /api/download
  → coba yt-dlp backend (extract)
    → gagal? coba custom host resolver
      → gagal? coba RapidAPI fallback
  → tampilkan hasil (thumbnail, judul, opsi kualitas)
  → klik Download → /shortlink/redirect (countdown 5s) → /api/proxy/download → file
```

## 7. Kebutuhan Fungsional

### F1 — Input multi-link (batch)
- 1–3 link per batch (gratis). Lebih dari itu → upsell "Pro" (belum diimplementasi).
- Deteksi platform otomatis dari URL.
- Tombol Paste dari clipboard per field.

### F2 — Ekstraksi media
- Output seragam: `{ platform, title, thumbnail, type: video|images, downloads[] }`.
- Video: beberapa opsi kualitas (Best / 720p / 480p, atau dari host).
- Gambar: carousel Instagram / Pinterest, unduh satu per satu.

### F3 — Unduhan
- Semua unduhan lewat `/shortlink/redirect` (gate monetisasi 5 detik).
- Proxy streaming agar kompatibel IDM & browser, tanpa buffering.
- Nama file disanitasi dari judul + label kualitas.

### F4 — Admin & monitor
- Login admin (env-based).
- `/dashboard`: total unduhan, visitor unik, aktif 5 menit, downloads per platform.
- `/admin`: total request, success rate, rate limit.
- `/status`: health check API + provider.

### F5 — Rate limit & keamanan
- Limit per IP (in-memory, siap diganti Redis).
- Validasi hostname per platform.
- Security headers (lihat `next.config.ts`).

### F6 — Monetisasi
- Shortlink eksternal (punyasahlan.my.id) + fallback internal.
- Countdown ad 5 detik sebelum file.

## 8. Non-Fungsional

| Kategori | Target |
|----------|--------|
| Performa | Ekstrak p50 < 5s, p95 < 15s |
| Ketersediaan | 99% (Vercel + tunnel) |
| Skalabilitas | Stateless Next.js; store sementara → DB bila perlu |
| Keamanan | HTTPS, validasi input, rate limit, tak ada secret di client |
| Privasi | Tidak simpan media; hanya IP/UA agregat sementara |
| Mobile | Responsif penuh, target Lighthouse ≥ 90 |

## 9. Arsitektur (ringkas)

```
Browser (Next.js 16 / React 19)
   │  POST /api/download
   ▼
Next.js Route Handler  ── rate limit + validasi ────┐
   │                                                │
   ├─ 1. yt-dlp backend (FastAPI, server/)  ◄── Docker + Cloudflare Tunnel
   │        └─ generic + custom host resolvers
   ├─ 2. RapidAPI provider (fallback)
   └─ 3. error user-friendly
   │
   ▼
GET /api/proxy/download  ──► stream bytes (IDM friendly)
```

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Host ganti domain / anti-bot | Ekstraksi gagal | Resolver modular per host, mudah update; fallback berlapis |
| yt-dlp usang | Platform utama rusak | Update image Docker otomatis (pin `yt-dlp` nightly) |
| Tunnel down | Provider utama mati | Fallback RapidAPI + status page |
| Rate limit in-memory reset | Abaikan limit | Pindah ke Redis/KV |
| Legal/ToS | Takedown | Disklaimer, hanya konten publik, hapus atas permintaan |

## 11. Roadmap

Lihat `docs/ROADMAP.md`.

## 12. Metrik Sukses

- Success rate ≥ 90% jangka 30 hari.
- ≥ 12 platform aktif.
- p50 ekstrak < 5s.
- Pertumbuhan unduhan bulanan.

## 13. Pertanyaan Terbuka

1. Store persisted pakai Supabase (sudah ada dependency) atau Redis?
2. Auth admin: pindah dari localStorage ke cookie httpOnly + session?
3. Batas Pro: aktifkan pembayaran atau cukup gate shortlink?
4. Daftar final host Tier 2 yang diprioritaskan?