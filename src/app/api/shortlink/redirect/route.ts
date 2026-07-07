import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const downloadUrl = request.nextUrl.searchParams.get('url');
  const filename = request.nextUrl.searchParams.get('filename') || 'video.mp4';

  if (!downloadUrl) {
    return NextResponse.json({ error: 'Download URL is required' }, { status: 400 });
  }

  try {
    new URL(downloadUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid download URL' }, { status: 400 });
  }

  const proxyUrl = new URL('/api/proxy/download', request.url);
  proxyUrl.searchParams.set('url', downloadUrl);
  proxyUrl.searchParams.set('filename', filename);

  return NextResponse.redirect(proxyUrl);
}
