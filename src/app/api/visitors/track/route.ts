import { NextRequest, NextResponse } from 'next/server';
import { visits, downloads, recordVisit, visitorStats, countDownloadsByPlatform } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    recordVisit(ip, userAgent);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Visitor track error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    visits: visits.slice(0, 100),
    stats: {
      ...visitorStats(),
      totalDownloads: downloads.length,
      recentDownloads: downloads.slice(0, 10),
      downloadsByPlatform: countDownloadsByPlatform(),
    },
  });
}
