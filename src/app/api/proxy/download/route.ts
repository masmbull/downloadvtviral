import { NextRequest, NextResponse } from 'next/server';
import { isPublicHttpUrl } from '@/lib/url-safety';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const MAX_REDIRECTS = 5;

function safeFilename(filename: string): string {
  return filename.replace(/[^\w\s\-_.]/g, '').trim() || 'video.mp4';
}

/** Fetch following redirects manually so every hop is re-validated. */
async function safeFetch(
  url: string,
  headers: Record<string, string>
): Promise<Response | null> {
  let current = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    if (!(await isPublicHttpUrl(current))) return null;
    const response = await fetch(current, { headers, redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return response;
      current = new URL(location, current).toString();
      continue;
    }
    return response;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get('url');
  const filename = safeFilename(request.nextUrl.searchParams.get('filename') || 'video.mp4');

  if (!sourceUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  if (!(await isPublicHttpUrl(sourceUrl))) {
    return NextResponse.json({ error: 'Blocked or invalid URL' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // HLS playlists must be remuxed to MP4 by the backend (ffmpeg).
  const isHls = sourceUrl.toLowerCase().includes('.m3u8');
  const backend = process.env.YTDLP_API_URL?.replace(/\/$/, '');
  if (isHls) {
    if (!backend) {
      return NextResponse.json(
        { error: 'HLS streams require the extraction backend to be configured.' },
        { status: 503 }
      );
    }
    const upstream = await fetch(`${backend}/api/stream?url=${encodeURIComponent(sourceUrl)}`);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Failed to process HLS media' }, { status: 502 });
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename.replace(/\.\w+$/, '')}.mp4"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }

  // Progressive media (mp4/webm/...): stream with Range passthrough.
  const range = request.headers.get('range');
  const headers: Record<string, string> = {
    'User-Agent': UA,
    Accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*',
    'Accept-Encoding': 'identity',
    Referer: `${parsed.protocol}//${parsed.host}/`,
  };
  if (range) headers.Range = range;

  try {
    const response = await safeFetch(sourceUrl, headers);
    if (!response) {
      return NextResponse.json({ error: 'Blocked or invalid URL' }, { status: 400 });
    }

    if (!response.ok && response.status !== 206) {
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    if (contentType.includes('text/html')) {
      return NextResponse.json({ error: 'Link did not resolve to a media file.' }, { status: 400 });
    }

    const outHeaders = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Accept-Ranges': response.headers.get('accept-ranges') || 'bytes',
    });
    const contentLength = response.headers.get('content-length');
    if (contentLength) outHeaders.set('Content-Length', contentLength);
    const contentRange = response.headers.get('content-range');
    if (contentRange) outHeaders.set('Content-Range', contentRange);

    return new NextResponse(response.body, { status: response.status, headers: outHeaders });
  } catch (error) {
    console.error('Proxy download error:', error);
    return NextResponse.json({ error: 'Failed to process media' }, { status: 500 });
  }
}