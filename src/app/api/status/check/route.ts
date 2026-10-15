import { NextResponse } from 'next/server';
import { getStatusReport } from '@/lib/status';

export const dynamic = 'force-dynamic';

export async function GET() {
  const report = await getStatusReport();
  return NextResponse.json(report, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}