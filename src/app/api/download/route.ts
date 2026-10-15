import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, validateUrl, sanitizeInput } from '@/lib/rate-limit';
import { detectPlatform, type MediaResult, type Platform } from '@/lib/platforms';
import { recordVisit, recordDownload } from '@/lib/store';

interface DownloadRequest {
  url: string;
  platform?: Platform;
}

async function safeGetFromYtDlp(url: string): Promise<MediaResult | null> {
  const apiUrl = process.env.YTDLP_API_URL;
  if (!apiUrl) return null;
  try {
    const base = apiUrl.replace(/\/$/, '');
    const response = await fetch(`${base}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.downloads?.length) return null;
    return data as MediaResult;
  } catch (error) {
    console.error('yt-dlp backend error:', error);
    return null;
  }
}

/**
 * Optional last-resort fallback via RapidAPI for TikTok/Instagram when the
 * self-hosted backend is unavailable and RAPIDAPI_KEY is configured.
 */
async function safeGetFromRapidApi(url: string, platform: Platform): Promise<MediaResult | null> {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return null;

  const providers: Record<string, { host: string; path: string; pick: (d: Record<string, unknown>) => MediaResult | null }> = {
    instagram: {
      host: 'instagram-downloader-api1.p.rapidapi.com',
      path: '/get-media-info',
      pick: (d) => {
        const video = (d.video_url || d.url || '') as string;
        const images: string[] = [];
        if (Array.isArray(d.display_resources)) {
          images.push(...(d.display_resources as { src?: string; url?: string }[]).map((r) => r.src || r.url || '').filter(Boolean));
        }
        if (Array.isArray(d.carousel_media)) {
          for (const item of d.carousel_media as { image_versions2?: { candidates?: { url?: string }[] } }[]) {
            const u = item.image_versions2?.candidates?.[0]?.url;
            if (u) images.push(u);
          }
        }
        const downloads = [
          ...(video ? [{ quality: 'HD (No Watermark)', url: video }] : []),
          ...images.map((u, i) => ({ quality: `Image ${i + 1}`, url: u })),
        ];
        if (!downloads.length) return null;
        return {
          platform: 'instagram',
          title: (d.title as string) || 'Instagram Post',
          thumbnail: video || images[0] || '',
          type: video ? 'video' : 'images',
          downloads,
        };
      },
    },
    tiktok: {
      host: 'tiktok-downloader-api1.p.rapidapi.com',
      path: '/get-video-info',
      pick: (d) => {
        const url = (d.video_url || d.url || d.play_url || '') as string;
        if (!url) return null;
        return {
          platform: 'tiktok',
          title: (d.title as string) || (d.desc as string) || 'TikTok Video',
          thumbnail: (d.thumbnail as string) || (d.cover as string) || '',
          type: 'video',
          downloads: [{ quality: 'HD (No Watermark)', url }],
        };
      },
    },
  };

  const provider = providers[platform];
  if (!provider) return null;

  try {
    const response = await fetch(
      `https://${provider.host}${provider.path}?url=${encodeURIComponent(url)}`,
      {
        headers: { 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': provider.host },
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!response.ok) return null;
    return provider.pick(await response.json());
  } catch (error) {
    console.error(`RapidAPI ${platform} fallback error:`, error);
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
    const sanitizedUrl = sanitizeInput(body.url || '');

    if (!sanitizedUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const platform = detectPlatform(sanitizedUrl);
    if (!platform) {
      return NextResponse.json(
        { error: 'Unsupported platform. Paste a link from a supported site.' },
        { status: 400 }
      );
    }

    if (!validateUrl(sanitizedUrl, platform)) {
      return NextResponse.json(
        { error: 'Invalid URL for the specified platform' },
        { status: 400 }
      );
    }

    const backendConfigured = Boolean(process.env.YTDLP_API_URL);
    const fallbackConfigured = Boolean(process.env.RAPIDAPI_KEY);
    if (!backendConfigured && !fallbackConfigured) {
      console.error('No extraction provider configured (set YTDLP_API_URL or RAPIDAPI_KEY)');
      return NextResponse.json(
        { error: 'Extraction backend is not configured. Please try again later.' },
        { status: 503 }
      );
    }

    let videoData = backendConfigured ? await safeGetFromYtDlp(sanitizedUrl) : null;
    if (!videoData && fallbackConfigured) {
      videoData = await safeGetFromRapidApi(sanitizedUrl, platform);
    }

    if (!videoData || videoData.downloads.length === 0) {
      return NextResponse.json(
        {
          error:
            'Unable to extract media. The post may be private, region-locked, or unsupported. Please try another link or try again later.',
        },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown';
    recordVisit(ip, request.headers.get('user-agent') || 'unknown');
    recordDownload(platform, videoData.title);

    return NextResponse.json(videoData);
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to process media. Please try again.' },
      { status: 500 }
    );
  }
}