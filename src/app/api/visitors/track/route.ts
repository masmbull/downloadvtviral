import { NextRequest, NextResponse } from 'next/server';

const visits: Array<{ ip: string; userAgent: string; timestamp: number }> = [];
const MAX_VISITS = 1000;

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    visits.unshift({ ip, userAgent, timestamp: Date.now() });
    if (visits.length > MAX_VISITS) visits.length = MAX_VISITS;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Visitor track error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ visits: visits.slice(0, 100) });
}
