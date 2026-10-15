import { NextResponse } from 'next/server';
import { visits, downloads, countDownloadsByPlatform, visitorStats } from '@/lib/store';

declare global {
  var __startTime: number | undefined;
}

export async function GET() {
  try {
    const now = Date.now();
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
      uptime: `${((now - (globalThis.__startTime || now)) / 1000 / 60).toFixed(1)}m`,
      visitors: visits.slice(0, 100),
      visitorStats: visitorStats(),
      downloadsByPlatform: countDownloadsByPlatform(),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}