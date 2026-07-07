import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      api: { status: 'operational', latency: 0 },
      providers: {
        instagram: { status: 'checking', latency: 0 },
        tiktok: { status: 'checking', latency: 0 },
      },
    },
    uptime: 0,
  };

  const apiStart = Date.now();
  try {
    const apiPromise = fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.tiktok.com/@teatrikaf/video/7647187848557490', platform: 'tiktok' }),
    });

    const apiResponse = await apiPromise;
    checks.services.api.latency = Date.now() - apiStart;
    checks.services.api.status = apiResponse.ok ? 'operational' : 'degraded';
  } catch {
    checks.services.api.status = 'down';
    checks.services.api.latency = Date.now() - apiStart;
  }

  const igStart = Date.now();
  try {
    const igPromise = fetch(`https://instagram-downloader-api1.p.rapidapi.com/get-media-info?url=${encodeURIComponent('https://www.instagram.com/p/ABC123/')}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'instagram-downloader-api1.p.rapidapi.com',
      },
    });
    const igResponse = await igPromise;
    checks.services.providers.instagram.latency = Date.now() - igStart;
    checks.services.providers.instagram.status = igResponse.ok ? 'operational' : 'degraded';
  } catch {
    checks.services.providers.instagram.status = 'down';
    checks.services.providers.instagram.latency = Date.now() - igStart;
  }

  const ttStart = Date.now();
  try {
    const ttPromise = fetch(`https://tiktok-downloader-api1.p.rapidapi.com/get-video-info?url=${encodeURIComponent('https://www.tiktok.com/@teatrikaf/video/7647187848557490')}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'tiktok-downloader-api1.p.rapidapi.com',
      },
    });
    const ttResponse = await ttPromise;
    checks.services.providers.tiktok.latency = Date.now() - ttStart;
    checks.services.providers.tiktok.status = ttResponse.ok ? 'operational' : 'degraded';
  } catch {
    checks.services.providers.tiktok.status = 'down';
    checks.services.providers.tiktok.latency = Date.now() - ttStart;
  }

  return NextResponse.json(checks, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}
