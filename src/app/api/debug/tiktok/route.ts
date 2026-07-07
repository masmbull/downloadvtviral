import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const testUrl = request.nextUrl.searchParams.get('url') || 'https://www.tiktok.com/@teatrikaf/video/7647187848557490';
  
  const providers = [
    { host: 'tiktok-downloader-api1.p.rapidapi.com', path: '/get-video-info' },
    { host: 'tiktok-all-in-one.p.rapidapi.com', path: '/viral-video' },
    { host: 'tiktok-video-downloader-api.p.rapidapi.com', path: '/get-video' },
  ];

  const results: any = {};
  
  for (const provider of providers) {
    try {
      console.log(`[Debug] Testing ${provider.host}${provider.path}...`);
      const start = Date.now();
      const response = await fetch(`https://${provider.host}${provider.path}?url=${encodeURIComponent(testUrl)}`, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': provider.host,
        },
      });
      const elapsed = Date.now() - start;
      const text = await response.text();
      
      results[provider.host] = {
        status: response.status,
        elapsed: `${elapsed}ms`,
        body: text.substring(0, 500),
      };
    } catch (error: any) {
      results[provider.host] = {
        error: error.message,
      };
    }
  }

  return NextResponse.json({
    testUrl,
    hasApiKey: !!process.env.RAPIDAPI_KEY,
    results,
  });
}
