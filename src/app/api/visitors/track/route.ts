import { NextRequest, NextResponse } from 'next/server';
import { visits, downloads, recordVisit } from '@/lib/store';

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
  const now = Date.now();
  const last5Min = visits.filter((v) => now - v.timestamp < 5 * 60 * 1000).length;
  const uniqueIps = new Set(visits.map((v) => v.ip)).size;

  return NextResponse.json({
    visits: visits.slice(0, 100),
    stats: {
      totalVisits: visits.length,
      uniqueVisitors: uniqueIps,
      last5Minutes: last5Min,
      totalDownloads: downloads.length,
      recentDownloads: downloads.slice(0, 10),
      downloadsByPlatform: {
        instagram: downloads.filter((d) => d.platform === 'instagram').length,
        tiktok: downloads.filter((d) => d.platform === 'tiktok').length,
        youtube: downloads.filter((d) => d.platform === 'youtube').length,
        doodstream: downloads.filter((d) => d.platform === 'doodstream').length,
      },
    },
  });
}
