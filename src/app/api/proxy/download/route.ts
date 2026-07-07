import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

async function resolveMediaUrl(initialUrl: string): Promise<string> {
  const maxRedirects = 10;
  let current = initialUrl;
  const visited = new Set<string>();

  for (let i = 0; i < maxRedirects; i++) {
    if (visited.has(current)) break;
    visited.add(current);

    const response = await fetch(current, {
      method: 'GET',
      headers: {
        accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      redirect: 'manual',
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('video') || contentType.includes('octet-stream')) {
      return current;
    }

    const location = response.headers.get('location');
    if (!location || response.status < 300 || response.status >= 400) {
      return current;
    }

    try {
      current = new URL(location, current).toString();
    } catch {
      current = location;
    }
  }

  return current;
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get('url');

  if (!sourceUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const targetUrl = await resolveMediaUrl(sourceUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch media' },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get('content-type') || 'video/mp4';

    if (contentType.includes('text/html')) {
      return NextResponse.json(
        { error: 'The download link did not resolve to a media file.' },
        { status: 400 }
      );
    }

    const contentLength = response.headers.get('content-length');
    const arrayBuffer = await response.arrayBuffer();
    const filename =
      request.nextUrl.searchParams.get('filename') || 'video.mp4';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
        'Content-Length': contentLength || String(arrayBuffer.byteLength),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Proxy download error:', error);
    return NextResponse.json(
      { error: 'Failed to process media' },
      { status: 500 }
    );
  }
}
