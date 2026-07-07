import asyncio
import os
import urllib.parse

import yt_dlp
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse

app = FastAPI()

PUBLIC_URL = os.environ.get("YTDLP_PUBLIC_URL", "").rstrip("/")
YTDLP_BIN = os.environ.get("YTDLP_BIN", "yt-dlp")

QUALITY_PRESETS = [
    ("Best Quality", "best"),
    ("720p", "bestvideo[height<=720]+bestaudio/best[height<=720]/best"),
    ("480p", "bestvideo[height<=480]+bestaudio/best[height<=480]/best"),
]


def stream_url(orig: str, fmt: str) -> str | None:
    if not PUBLIC_URL:
        return None
    q = urllib.parse.urlencode({"url": orig, "format": fmt})
    return f"{PUBLIC_URL}/api/stream?{q}"


def detect_platform(url: str) -> str:
    u = url.lower()
    if "instagram.com" in u or "instagr.am" in u:
        return "instagram"
    if "tiktok.com" in u or "vm.tiktok.com" in u:
        return "tiktok"
    if "youtube.com" in u or "youtu.be" in u:
        return "youtube"
    if "doodstream.com" in u or "dood.to" in u:
        return "doodstream"
    return "generic"


@app.get("/health")
async def health():
    return {"ok": True}


@app.post("/api/extract")
async def extract(req: Request):
    body = await req.json()
    url = body.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="url required")

    platform = detect_platform(url)

    try:
        with yt_dlp.YoutubeDL(
            {"quiet": True, "no_warnings": True, "skip_download": True, "format": "best"}
        ) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"extract_failed: {e}")

    if info.get("_type") == "playlist":
        entries = [e for e in (info.get("entries") or []) if e]
        info = entries[0] if entries else info

    title = info.get("title") or "media"
    thumbnail = info.get("thumbnail") or ""

    image_urls: list[str] = []
    if info.get("images"):
        image_urls = [i.get("url") for i in info["images"] if i.get("url")]
    if not image_urls and info.get("_type") == "images":
        image_urls = [e.get("url") for e in (info.get("entries") or []) if e.get("url")]

    if image_urls:
        downloads = [
            {"quality": f"Image {i + 1}", "url": u}
            for i, u in enumerate(image_urls[:10])
        ]
        return {
            "platform": platform,
            "title": title,
            "thumbnail": image_urls[0],
            "type": "images",
            "downloads": downloads,
        }

    if PUBLIC_URL:
        downloads = [
            {"quality": label, "url": stream_url(url, fmt)}
            for label, fmt in QUALITY_PRESETS
        ]
    else:
        direct = info.get("url")
        downloads = [{"quality": "Best Quality", "url": direct}] if direct else []

    if not downloads:
        raise HTTPException(status_code=400, detail="no_downloadable_media")

    return {
        "platform": platform,
        "title": title,
        "thumbnail": thumbnail,
        "type": "video",
        "downloads": downloads,
    }


@app.get("/api/stream")
async def stream(url: str, format: str = "best"):
    if not url:
        raise HTTPException(status_code=400, detail="url required")

    cmd = [
        YTDLP_BIN,
        "-f",
        format,
        "-o",
        "-",
        "--no-warnings",
        "--quiet",
        "--no-playlist",
        url,
    ]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"spawn_failed: {e}")

    async def err_drain():
        if proc.stderr:
            await proc.stderr.read()

    asyncio.create_task(err_drain())

    async def gen():
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
