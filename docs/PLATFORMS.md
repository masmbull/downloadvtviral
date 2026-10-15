# Platforms — DownloadVTViral

Daftar host, status dukungan, dan strategi ekstraksi.

## Legenda

- **Native** — extractor yt-dlp resmi, andal.
- **Generic** — yt-dlp generic extractor (embed scrape), bisa berubah.
- **Custom** — perlu resolver khusus (belum ada).
- **Fallback** — via RapidAPI.
- **Planned** — direncanakan.

## Tier 1 — Social media

| Platform | Host | Status | Metode |
|----------|------|--------|--------|
| YouTube | youtube.com, youtu.be, shorts | ✅ Native | yt-dlp |
| TikTok | tiktok.com, vm.tiktok.com | ✅ Native | yt-dlp (+ RapidAPI fallback) |
| Instagram | instagram.com, instagr.am | ✅ Native | yt-dlp (+ RapidAPI, carousel → images) |
| X / Twitter | x.com, twitter.com | 🟡 Generic | yt-dlp |
| Facebook | facebook.com, fb.watch | 🟡 Generic | yt-dlp (reel) |
| Reddit | reddit.com, redd.it | 🟡 Generic | yt-dlp |
| Pinterest | pinterest.com, pin.it | 🟡 Generic | yt-dlp |
| LinkedIn | linkedin.com | 🟡 Generic | yt-dlp |
| Vimeo | vimeo.com | ✅ Native | yt-dlp |
| Snapchat | snapchat.com | 🟡 Generic | yt-dlp (spotlight) |
| Twitch | twitch.tv | ✅ Native | yt-dlp (clips/VOD) |
| Rumble | rumble.com | ✅ Native | yt-dlp |

## Tier 2 — Video host (custom resolvers)

Implementasi di `server/main.py` (`RESOLVERS`).

| Host | Domain umum | Resolver | Status |
|------|-------------|----------|--------|
| Videy | videy.co, videy.com | `resolve_videy` → `cdn.videy.co/{id}.mp4` | ✅ Implemented |
| Vidara | vidara.to, vidara.so, vidara.su | `resolve_vidara` → cookie + `POST /api/stream` → HLS | ✅ Implemented |
| Doodstream | doodstream.com, dood.to, d000d.com, + | `resolve_doodstream` → scrape `/pass_md5` | ✅ Implemented |
| Streamtape | streamtape.com, .to, .net, + | `resolve_generic_page` (scan m3u8/mp4) | 🟡 Best-effort |
| Filemoon | filemoon.sx, .to, bysezejataos.com | `resolve_generic_page` | 🟡 Best-effort |
| Mixdrop | mixdrop.co, .to, .sx, + | `resolve_generic_page` | 🟡 Best-effort |
| Voe | voe.sx, voe.to | `resolve_generic_page` | 🟡 Best-effort |
| StreamRizz | streamrizz.com, .to | `resolve_generic_page` | 🟡 Best-effort |

> Best-effort resolver = scan halaman embed untuk URL `m3u8`/`mp4`. Kerja bila host tidak
> meng-obfuscate; kalau gagal, `/api/extract` jatuh ke yt-dlp generic lalu error.

> Nama domain host ini **sering berpindah**. Jaga daftar domain di satu konstanta agar
> mudah diperbarui (`PLATFORM_HOSTS` di `src/lib/rate-limit.ts` + `detect_platform` di
> `server/main.py`).

## Menambah platform baru

1. Tambah deteksi host di:
   - `src/components/download-form.tsx` → `detectPlatform`
   - `src/app/api/download/route.ts` → deteksi platform
   - `src/lib/rate-limit.ts` → `validateUrl`
   - `server/main.py` → `detect_platform`
2. Tambah kartu di `src/components/supported-platforms-section.tsx`.
3. Bila yt-dlp native: selesai. Bila tidak: tulis resolver di `server/` dan daftarkan
   di `RESOLVERS`.
4. Tambah entri di `docs/PLATFORMS.md`.
5. Uji dengan link nyata; catat di `/status` bila perlu.

## Catatan hukum

Hanya untuk konten publik dan penggunaan pribadi. Hormati ToS tiap platform dan hak
cipta. Sediakan mekanisme takedown bila diminta.