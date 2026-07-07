import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { downloadUrl, filename, platform } = body;

    if (!downloadUrl) {
      return NextResponse.json({ error: 'Download URL is required' }, { status: 400 });
    }

    const shortlinkApiUrl = `https://punyasahlan.my.id/api/v1/url`;
    const response = await fetch(shortlinkApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: downloadUrl,
        platform,
        filename,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shortlink API error:', errorText);
      return NextResponse.json({ error: 'Failed to create shortlink' }, { status: 500 });
    }

    const data = await response.json();
    
    if (data.data?.shortUrl) {
      return NextResponse.json({ shortUrl: data.data.shortUrl });
    }

    return NextResponse.json({ error: 'Invalid shortlink response' }, { status: 500 });
  } catch (error) {
    console.error('Create shortlink error:', error);
    return NextResponse.json({ error: 'Failed to create shortlink' }, { status: 500 });
  }
}
