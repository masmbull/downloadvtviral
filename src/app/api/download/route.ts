import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, validateUrl, sanitizeInput } from '@/lib/rate-limit';

interface DownloadRequest {
  url: string;
  platform: 'instagram' | 'tiktok';
}

async function safeGetInstagramVideo(url: string) {
  try {
    const apiUrl = `https://instagram-downloader-api1.p.rapidapi.com/get-media-info?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'instagram-downloader-api1.p.rapidapi.com',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const direct = data.video_url || data.url || data.display_url || '';
    if (!direct) return null;
    return {
      platform: 'instagram' as const,
      title: data.title || 'Instagram Video',
      thumbnail: data.thumbnail || data.display_url || '',
      downloads: [{ quality: 'HD (No Watermark)', url: direct }],
    };
  } catch (error) {
    console.error('Instagram provider error:', error);
    return null;
  }
}

async function safeGetTikTokVideo(url: string) {
  try {
    const apiUrl = `https://tiktok-downloader-api1.p.rapidapi.com/get-video-info?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'tiktok-downloader-api1.p.rapidapi.com',
      },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const direct = data.video_url || data.url || '';
    if (!direct) return null;
    return {
      platform: 'tiktok' as const,
      title: data.title || 'TikTok Video',
      thumbnail: data.thumbnail || data.cover || '',
      downloads: [
        { quality: 'HD (No Watermark)', url: data.video_url || data.url || '' },
        { quality: 'SD', url: data.sd_url || '' },
      ].filter((d) => d.url),
    };
  } catch (error) {
    console.error('TikTok provider error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(request)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: DownloadRequest = await request.json();
    let { url, platform } = body;

    url = sanitizeInput(url);
    platform = sanitizeInput(platform) as 'instagram' | 'tiktok';

    if (!url || !platform) {
      return NextResponse.json(
        { error: 'URL and platform are required' },
        { status: 400 }
      );
    }

    if (!validateUrl(url, platform)) {
      return NextResponse.json(
        { error: 'Invalid URL for the specified platform' },
        { status: 400 }
      );
    }

    const videoData =
      platform === 'instagram'
        ? await safeGetInstagramVideo(url)
        : await safeGetTikTokVideo(url);

    if (!videoData || videoData.downloads.length === 0) {
      return NextResponse.json(
        {
          error: 'Unable to extract a downloadable video. The provider may have failed. Please try again later.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(videoData);
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to process video. Please try again.' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
