import { NextRequest, NextResponse } from 'next/server';
import { visits, downloads } from '@/lib/store';

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const last5Min = visits.filter((v) => now - v.timestamp < 5 * 60 * 1000).length;
    const uniqueIps = new Set(visits.map((v) => v.ip)).size;
    const successfulDownloads = downloads.length;
    const totalRequests = visits.length;
    const successRate = totalRequests > 0 ? ((successfulDownloads / totalRequests) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      totalRequests,
      successfulDownloads,
      failedRequests: 0,
      successRate,
      averageResponseTime: 1.2,
      rateLimitWindow: 60,
      maxRequestsPerWindow: 10,
      uptime: `${((now - (global as any).__startTime || now) / 1000 / 60).toFixed(1)}m`,
      visitors: visits.slice(0, 100),
      visitorStats: {
        totalVisits: visits.length,
        uniqueVisitors: uniqueIps,
        last5Minutes: last5Min,
      },
      downloadsByPlatform: {
        instagram: downloads.filter((d) => d.platform === 'instagram').length,
        tiktok: downloads.filter((d) => d.platform === 'tiktok').length,
        youtube: downloads.filter((d) => d.platform === 'youtube').length,
        doodstream: downloads.filter((d) => d.platform === 'doodstream').length,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
