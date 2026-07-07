import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const downloadUrl = request.nextUrl.searchParams.get('url');
  const filename = request.nextUrl.searchParams.get('filename') || 'video.mp4';
  const delay = parseInt(request.nextUrl.searchParams.get('delay') || '5', 10);

  if (!downloadUrl) {
    return NextResponse.json({ error: 'Download URL is required' }, { status: 400 });
  }

  try {
    new URL(downloadUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid download URL' }, { status: 400 });
  }

  const shortlinkApiUrl = process.env.SHORTLINK_API_URL || 'https://punyasahlan.my.id/api/v1/url';
  let shortUrl: string | null = null;

  try {
    const response = await fetch(shortlinkApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: downloadUrl,
        filename,
        delay,
        userAgent: request.headers.get('user-agent') || 'unknown',
      }),
    });

    if (response.ok) {
      const result = await response.json();
      shortUrl = result.data?.shortUrl || result.shortUrl || null;
    }
  } catch (error) {
    console.error('Shortlink creation failed:', error);
  }

  if (shortUrl) {
    return NextResponse.redirect(shortUrl);
  }

  return NextResponse.redirect(new URL(`/api/proxy/download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`, request.url));
}
