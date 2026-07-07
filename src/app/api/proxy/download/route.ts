import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get('url');
  const filename = request.nextUrl.searchParams.get('filename') || 'video.mp4';

  if (!sourceUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'video/mp4,video/webm,video/*,application/octet-stream,*/*',
        Referer: 'https://www.instagram.com/',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    if (contentType.includes('text/html')) {
      return NextResponse.json({ error: 'Link did not resolve to a media file.' }, { status: 400 });
    }

    const safeFilename = filename.replace(/[^\w\s\-_.]/g, '').trim() || 'video.mp4';
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });

    const contentLength = response.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);

    return new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    console.error('Proxy download error:', error);
    return NextResponse.json({ error: 'Failed to process media' }, { status: 500 });
  }
}
