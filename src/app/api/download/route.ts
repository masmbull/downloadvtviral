import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, validateUrl, sanitizeInput } from '@/lib/rate-limit';

interface DownloadRequest {
  url: string;
  platform: 'instagram' | 'tiktok';
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

    let videoData: {
      platform: string;
      title: string;
      thumbnail: string;
      downloads: Array<{ quality: string; url: string }>;
    } | null = null;

    if (platform === 'instagram') {
      videoData = await getInstagramVideo(url);
    } else if (platform === 'tiktok') {
      videoData = await getTikTokVideo(url);
    }

    if (!videoData) {
      return NextResponse.json(
        { error: 'Could not extract video information' },
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

async function getInstagramVideo(url: string): Promise<{
  platform: string;
  title: string;
  thumbnail: string;
  downloads: Array<{ quality: string; url: string }>;
}> {
  try {
    // Using a free Instagram API service
    const apiUrl = `https://instagram-downloader-api1.p.rapidapi.com/get-media-info?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'instagram-downloader-api1.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Instagram video');
    }

    const data = await response.json();
    
    return {
      platform: 'instagram',
      title: data.title || 'Instagram Video',
      thumbnail: data.thumbnail || data.display_url || '',
      downloads: [
        {
          quality: 'HD (No Watermark)',
          url: data.video_url || data.url || '',
        },
      ],
    };
  } catch (error) {
    console.error('Instagram error:', error);
    throw error;
  }
}

async function getTikTokVideo(url: string): Promise<{
  platform: string;
  title: string;
  thumbnail: string;
  downloads: Array<{ quality: string; url: string }>;
}> {
  try {
    // Using a free TikTok API service
    const apiUrl = `https://tiktok-downloader-api1.p.rapidapi.com/get-video-info?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'tiktok-downloader-api1.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch TikTok video');
    }

    const data = await response.json();
    
    return {
      platform: 'tiktok',
      title: data.title || 'TikTok Video',
      thumbnail: data.thumbnail || data.cover || '',
      downloads: [
        {
          quality: 'HD (No Watermark)',
          url: data.video_url || data.url || '',
        },
        {
          quality: 'SD',
          url: data.sd_url || data.url || '',
        },
      ].filter(d => d.url),
    };
  } catch (error) {
    console.error('TikTok error:', error);
    throw error;
  }
}

export const runtime = 'edge';