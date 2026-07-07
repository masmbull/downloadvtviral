import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { downloadUrl, filename, platform } = body;

    if (!downloadUrl) {
      return NextResponse.json({ error: 'Download URL is required' }, { status: 400 });
    }

    // Try external shortlink API (punyasahlan.my.id) first
    try {
      const externalApiUrl = `https://www.punyasahlan.my.id/api/v3/links`;
      const externalResponse = await fetch(externalApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: downloadUrl,
          waitTime: 5,
        }),
      });

      if (externalResponse.ok) {
        const data = await externalResponse.json();
        if (data.shortUrl) {
          return NextResponse.json({
            shortUrl: data.shortUrl,
            slug: data.slug,
            source: 'external',
          });
        }
      } else {
        const errorText = await externalResponse.text();
        console.error('External shortlink API error:', externalResponse.status, errorText);
      }
    } catch (error) {
      console.error('External shortlink API failed, using fallback:', error);
    }

    // Fallback: create an internal shortlink using our own redirect page
    const safeFilename = (filename || 'video.mp4').replace(/[^\w\s\-_.]/g, '').trim() || 'video.mp4';
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
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