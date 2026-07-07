import { NextRequest, NextResponse } from 'next/server';
import { visits, downloads } from '@/app/api/visitors/track/route';

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    const last5Min = visits.filter((v) => now - v.timestamp < 5 * 60 * 1000).length;
    const uniqueIps = new Set(visits.map((v) => v.ip)).size;
    const successfulDownloads = downloads.length;
    const failedRequests = visits.filter((v) => v.userAgent.includes('error')).length;
    const totalRequests = Math.max(visits.length, successfulDownloads + failedRequests);
    const successRate = totalRequests > 0 ? ((successfulDownloads / totalRequests) * 100).toFixed(1) : '0.0';
    const averageResponseTime = 1.2;

    return NextResponse.json({
      totalRequests,
      successfulDownloads,
      failedRequests,
      successRate,
      averageResponseTime,
      rateLimitWindow: 60,
      maxRequestsPerWindow: 10,
      uptime: '0.5m',
      visitors: visits.slice(0, 100),
      visitorStats: {
        totalVisits: visits.length,
        uniqueVisitors: uniqueIps,
        last5Minutes: last5Min,
      },
      downloadsByPlatform: {
        instagram: downloads.filter((d) => d.platform === 'instagram').length,
        tiktok: downloads.filter((d) => d.platform === 'tiktok').length,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
