import asyncio
import ipaddress
import json
import os
import random
import re
import shutil
import socket
import string
import time
import urllib.error
import urllib.parse
import urllib.request
import http.cookiejar

try:
    import yt_dlp
except ImportError:  # allow importing this module for tooling/self-checks
    yt_dlp = None

try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.responses import StreamingResponse

    app = FastAPI()
except ImportError:  # self-checks can run without FastAPI installed
    class _NoopApp:
        def get(self, *a, **k):
            return lambda fn: fn

        def post(self, *a, **k):
            return lambda fn: fn

    app = _NoopApp()

    class HTTPException(Exception):
        def __init__(self, status_code=400, detail=""):
            self.status_code = status_code
            self.detail = detail

    Request = object
    StreamingResponse = None

PUBLIC_URL = os.environ.get("YTDLP_PUBLIC_URL", "").rstrip("/")
YTDLP_BIN = os.environ.get("YTDLP_BIN", "yt-dlp")

USER_AGENT = os.environ.get(
    "RESOLVER_USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
)

QUALITY_PRESETS = [
    ("Best Quality", "best"),
    ("720p", "bestvideo[height<=720]+bestaudio/best[height<=720]/best"),
    ("480p", "bestvideo[height<=480]+bestaudio/best[height<=480]/best"),
]

# Single source of truth for host -> platform mapping.
PLATFORM_HOSTS = {
    "youtube": ["youtube.com", "youtu.be", "youtube-nocookie.com"],
    "tiktok": ["tiktok.com", "vm.tiktok.com"],
    "instagram": ["instagram.com", "instagr.am"],
    "twitter": ["twitter.com", "x.com", "t.co"],
    "facebook": ["facebook.com", "fb.watch", "fb.com"],
    "reddit": ["reddit.com", "redd.it"],
    "pinterest": ["pinterest.com", "pin.it"],
    "vimeo": ["vimeo.com"],
    "twitch": ["twitch.tv"],
    "rumble": ["rumble.com"],
    "snapchat": ["snapchat.com"],
    "linkedin": ["linkedin.com"],
    "videy": ["videy.co", "videy.com"],
    "vidara": ["vidara.to", "vidara.so", "vidara.su"],
    "doodstream": [
        "doodstream.com", "dood.to", "d000d.com", "doods.pro", "ds2play.com",
        "dood.wf", "dood.cx", "dood.pm", "dood.so", "dood.la", "dood.li",
        "dood.yt", "dood.re", "dooood.com",
    ],
    "streamtape": [
        "streamtape.com", "streamtape.to", "streamtape.net",
        "streamtape.xyz", "streamtape.cc", "shavetape.cash",
    ],
    "filemoon": ["filemoon.sx", "filemoon.to", "filemoon.in", "bysezejataos.com"],
    "mixdrop": ["mixdrop.co", "mixdrop.to", "mixdrop.sx", "mixdrop.bz", "mixdrop.ch", "m1xdrop.net"],
    "voe": ["voe.sx", "voe.to"],
    "streamrizz": ["streamrizz.com", "streamrizz.to"],
}

IMAGE_PLATFORMS = {"instagram", "pinterest"}


def detect_platform(url: str) -> str:
    try:
        host = urllib.parse.urlparse(url).hostname or ""
    except Exception:
        return "unknown"
    host = host.lower()
    for platform, hosts in PLATFORM_HOSTS.items():
        for h in hosts:
            if host == h or host.endswith("." + h):
                return platform
    return "unknown"


def media(platform, title, thumbnail, type_, downloads) -> dict:
    return {
        "platform": platform,
        "title": title or "media",
        "thumbnail": thumbnail or "",
        "type": type_,
        "downloads": [{"quality": q, "url": u} for q, u in downloads if u],
    }


def _is_public_http_url(url: str) -> bool:
    """Reject non-http(s) schemes and private/loopback/link-local/reserved hosts.

    Guards the /api/stream endpoint against SSRF and local file disclosure
    (e.g. file:///etc/passwd or http://169.254.169.254/).
    """
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    host = (parsed.hostname or "").strip()
    if not host:
        return False
    # Block localhost names outright.
    if host.lower() in ("localhost", "localhost.localdomain"):
        return False
    # If the host is a literal IP, check it directly.
    try:
        ip = ipaddress.ip_address(host)
        return not (ip.is_private or ip.is_loopback or ip.is_link_local
                    or ip.is_reserved or ip.is_multicast or ip.is_unspecified)
    except ValueError:
        pass
    # Resolve the hostname and reject if ANY resolved address is non-public.
    try:
        infos = socket.getaddrinfo(host, None)
    except Exception:
        return False
    for info in infos:
        addr = info[4][0]
        try:
            ip = ipaddress.ip_address(addr)
        except ValueError:
            return False
        if (ip.is_private or ip.is_loopback or ip.is_link_local
                or ip.is_reserved or ip.is_multicast or ip.is_unspecified):
            return False
    return True


def stream_url(orig: str, fmt: str) -> str | None:
    if not PUBLIC_URL:
        return None
    q = urllib.parse.urlencode({"url": orig, "format": fmt})
    return f"{PUBLIC_URL}/api/stream?{q}"


# --- HTTP helpers (stdlib only, cookie-aware) ---

def _opener(jar):
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def _request(url, method="GET", data=None, headers=None, jar=None, timeout=20):
    if jar is None:
        jar = http.cookiejar.CookieJar()
    hdrs = {
        "User-Agent": USER_AGENT,
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity",
    }
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    with _opener(jar).open(req, timeout=timeout) as resp:
        body = resp.read()
        return resp.geturl(), body.decode("utf-8", "replace"), resp.headers


def _random_str(n: int = 10) -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=n))


def _find_media_urls(html: str) -> list[str]:
    found = re.findall(r"https?://[^\"'<>\s\\]+?\.(?:m3u8|mp4)(?:\?[^\"'<>\s\\]*)?", html)
    seen, out = set(), []
    for u in found:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


# --- Custom resolvers for hosts yt-dlp cannot handle ---

def resolve_videy(url: str) -> dict | None:
    parsed = urllib.parse.urlparse(url)
    vid = urllib.parse.parse_qs(parsed.query).get("id", [None])[0]
    if not vid:
        m = re.search(r"videy\.\w+/(?:video/)?([\w-]+)", url)
        vid = m.group(1) if m else None
    if not vid or vid in ("video", "e"):
        return None
    direct = f"https://cdn.videy.co/{vid}.mp4"
    return media("videy", "Videy Video", f"https://cdn.videy.co/{vid}.jpg", "video", [("HD", direct)])


def resolve_vidara(url: str) -> dict | None:
    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname
    m = re.search(r"/e/([\w-]+)", parsed.path)
    if not host or not m:
        return None
    filecode = m.group(1)

    jar = http.cookiejar.CookieJar()
    _request(url, jar=jar)

    payload = json.dumps({"filecode": filecode, "device": "android"}).encode()
    headers = {
        "Content-Type": "application/json",
        "Referer": url,
        "Origin": f"https://{host}",
    }
    _, text, _ = _request(
        f"https://{host}/api/stream", method="POST", data=payload, headers=headers, jar=jar
    )
    try:
        data = json.loads(text)
    except ValueError:
        return None
    su = data.get("streaming_url") or data.get("streaming_url_1")
    if not su:
        return None
    return media(
        "vidara",
        data.get("title") or "Vidara Video",
        data.get("thumbnail") or data.get("poster") or "",
        "video",
        [("Best (HLS)", su)],
    )


def resolve_doodstream(url: str) -> dict | None:
    page_url, html, _ = _request(url, headers={"Referer": "https://doodstream.com/"})
    host = urllib.parse.urlparse(page_url).netloc or urllib.parse.urlparse(url).netloc

    title = ""
    tm = re.search(r"<title>([^<]+)</title>", html)
    if tm:
        title = tm.group(1).strip()

    pm = re.search(r"\$\.get\(['\"](/pass_md5/[^'\"]+)['\"]", html)
    if not pm:
        pm = re.search(r"(/pass_md5/[^'\"\s]+)", html)
    if not pm:
        media_urls = _find_media_urls(html)
        if media_urls:
            return media("doodstream", title or "Doodstream Video", "", "video", [("HD", media_urls[0])])
        return None

    pass_path = pm.group(1)
    token = pass_path.split("/")[-1]
    _, base, _ = _request(
        f"https://{host}{pass_path}", headers={"Referer": page_url}
    )
    base = base.strip()
    if not base.startswith("http"):
        return None
    direct = f"{base}{_random_str()}?token={token}&expiry={int(time.time() * 1000)}"
    return media("doodstream", title or "Doodstream Video", "", "video", [("HD (No Watermark)", direct)])


def resolve_generic_page(url: str) -> dict | None:
    """Best-effort: scan the embed page for a direct m3u8/mp4 URL."""
    try:
        _, html, _ = _request(url)
    except Exception:
        return None
    media_urls = _find_media_urls(html)
    if not media_urls:
        return None
    title = ""
    tm = re.search(r"<title>([^<]+)</title>", html)
    if tm:
        title = tm.group(1).strip()
    platform = detect_platform(url)
    return media(platform, title or platform.title(), "", "video", [("Best", media_urls[0])])


RESOLVERS = {
    "videy": resolve_videy,
    "vidara": resolve_vidara,
    "doodstream": resolve_doodstream,
    "streamtape": resolve_generic_page,
    "filemoon": resolve_generic_page,
    "mixdrop": resolve_generic_page,
    "voe": resolve_generic_page,
    "streamrizz": resolve_generic_page,
}


def try_ytdlp(url: str, platform: str) -> dict | None:
    ytdlp_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
    }
    # Some extractors (YouTube) require a JS runtime. Prefer deno when present.
    deno_bin = shutil.which("deno")
    if deno_bin:
        # shutil.which may return a .CMD/.PS1 wrapper; yt-dlp needs the real binary.
        if not deno_bin.lower().endswith((".exe", "")):
            candidate = os.path.join(os.path.dirname(deno_bin), "deno", "deno.exe")
            if os.path.exists(candidate):
                deno_bin = candidate
        ytdlp_opts["js_runtimes"] = {"deno": {"binary": deno_bin}}
    try:
        with yt_dlp.YoutubeDL(ytdlp_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception:
        return None

    if info.get("_type") == "playlist":
        entries = [e for e in (info.get("entries") or []) if e]
        info = entries[0] if entries else info

    title = info.get("title") or "media"
    thumbnail = info.get("thumbnail") or ""

    image_urls = [i.get("url") for i in (info.get("images") or []) if i.get("url")]
    if image_urls:
        return media(
            platform,
            title,
            image_urls[0],
            "images",
            [(f"Image {i + 1}", u) for i, u in enumerate(image_urls[:10])],
        )

    # yt-dlp leaves the top-level "url" empty for some extractors; pick the best
    # progressive format that already has a resolved URL.
    direct = info.get("url")
    if not direct:
        for f in reversed(info.get("formats") or []):
            u = f.get("url")
            if u:
                direct = u
                break

    if PUBLIC_URL:
        downloads = [(label, stream_url(url, fmt) or "") for label, fmt in QUALITY_PRESETS]
        downloads = [(label, u) for label, u in downloads if u]
    else:
        downloads = [("Best Quality", direct)] if direct else []

    if not downloads:
        return None
    return media(platform, title, thumbnail, "video", downloads)


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/extract")
async def extract(req: Request):
    body = await req.json()
    url = (body or {}).get("url")
    if not url:
        raise HTTPException(status_code=400, detail="url required")

    platform = detect_platform(url)
    if platform == "unknown":
        raise HTTPException(status_code=400, detail="unsupported_platform")

    result = None

    # 1. Custom resolver first for known file hosts (faster than generic yt-dlp).
    resolver = RESOLVERS.get(platform)
    if resolver:
        try:
            result = await asyncio.to_thread(resolver, url)
        except Exception:
            result = None

    # 2. Fall back to yt-dlp (native + generic extractors).
    if not result:
        result = await asyncio.to_thread(try_ytdlp, url, platform)

    if not result or not result.get("downloads"):
        raise HTTPException(status_code=400, detail="no_downloadable_media")

    if platform in IMAGE_PLATFORMS:
        result["type"] = result.get("type") or "video"

    return result


@app.get("/api/stream")
async def stream(request: Request, url: str, format: str | None = None):
    if not url:
        raise HTTPException(status_code=400, detail="url required")

    # SSRF / local-file guard: only public http(s) targets are allowed.
    if not _is_public_http_url(url):
        raise HTTPException(status_code=400, detail="blocked_url")

    # Backwards compatible yt-dlp path when a format preset is requested.
    if format:
        return await _stream_ytdlp(url, format)

    # Direct media path: HLS via ffmpeg, progressive passthrough otherwise.
    if ".m3u8" in url.lower():
        return await _stream_hls(url)
    return await asyncio.to_thread(_stream_direct, request, url)


async def _stream_ytdlp(url: str, fmt: str):
    cmd = [YTDLP_BIN, "-f", fmt, "-o", "-", "--no-warnings", "--quiet", "--no-playlist", url]
    return _spawn_media(cmd)


async def _stream_hls(url: str):
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-headers", f"User-Agent: {USER_AGENT}\r\n",
        "-i", url,
        "-c", "copy", "-bsf:a", "aac_adtstoasc",
        "-movflags", "frag_keyframe+empty_moov",
        "-f", "mp4", "pipe:1",
    ]
    return _spawn_media(cmd)


def _spawn_media(cmd):
    async def gen():
        proc = await asyncio.create_subprocess_exec(
            *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        asyncio.create_task(_drain(proc.stderr))
        try:
            while True:
                chunk = await proc.stdout.read(65536)
                if not chunk:
                    break
                yield chunk
        finally:
            if proc.returncode is None:
                proc.kill()
            await proc.wait()

    headers = {
        "Content-Disposition": 'attachment; filename="download.mp4"',
        "Cache-Control": "no-store",
    }
    return StreamingResponse(gen(), media_type="video/mp4", headers=headers)


async def _drain(stream_):
    if stream_:
        await stream_.read()


def _stream_direct(request: Request, url: str):
    range_header = request.headers.get("range")
    headers = {"User-Agent": USER_AGENT, "Accept": "*/*", "Accept-Encoding": "identity"}
    if range_header:
        headers["Range"] = range_header

    req = urllib.request.Request(url, headers=headers)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:
        raise HTTPException(status_code=e.code, detail="upstream_error")
    except Exception:
        raise HTTPException(status_code=502, detail="upstream_unreachable")

    content_type = resp.headers.get("Content-Type", "video/mp4")
    if "text/html" in content_type:
        resp.close()
        raise HTTPException(status_code=400, detail="link_did_not_resolve_to_media")

    out_headers = {
        "Content-Disposition": 'attachment; filename="download.mp4"',
        "Cache-Control": "no-store",
        "Accept-Ranges": "bytes",
    }
    for key in ("Content-Length", "Content-Range"):
        if resp.headers.get(key):
            out_headers[key] = resp.headers.get(key)

    status = resp.status if resp.status in (200, 206) else 200

    def gen():
        try:
            while True:
                chunk = resp.read(65536)
                if not chunk:
                    break
                yield chunk
        finally:
            resp.close()

    return StreamingResponse(gen(), status_code=status, media_type=content_type, headers=out_headers)