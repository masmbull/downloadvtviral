import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { downloadUrl, filename, platform } = body;

    if (!downloadUrl) {
      return NextResponse.json({ error: 'Download URL is required' }, { status: 400 });
    }

    // Try external shortlink API first
    try {
      const shortlinkApiUrl = `https://punyasahlan.my.id/api/v1/url`;
      const response = await fetch(shortlinkApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: downloadUrl,
          platform,
          filename: filename || 'video.mp4',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.shortUrl) {
          return NextResponse.json({ shortUrl: data.data.shortUrl, source: 'external' });
        }
      }
    } catch (error) {
      console.error('External shortlink API failed, using fallback:', error);
    }

    // Fallback: create an internal shortlink using our own redirect page
    const safeFilename = (filename || 'video.mp4').replace(/[^\w\s\-_.]/g, '').trim() || 'video.mp4';

    // Build our internal redirect URL — ensure we always have a valid base
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const fallbackBase = `${protocol}://${host}`;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || fallbackBase;
    const redirectUrl = new URL('/shortlink/redirect', baseUrl);
    redirectUrl.searchParams.set('url', downloadUrl);
    redirectUrl.searchParams.set('filename', safeFilename);
    redirectUrl.searchParams.set('delay', '5');

    return NextResponse.json({
      shortUrl: redirectUrl.toString(),
      source: 'internal',
    });
  } catch (error) {
    console.error('Create shortlink error:', error);
    return NextResponse.json({ error: 'Failed to create shortlink' }, { status: 500 });
  }
}