import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, validateUrl, sanitizeInput } from '@/lib/rate-limit';

interface DownloadRequest {
  url: string;
  platform: 'instagram' | 'tiktok';
}

type MediaType = 'video' | 'images';

interface DownloadItem {
  quality: string;
  url: string;
}

interface MediaResult {
  platform: 'instagram' | 'tiktok';
  title: string;
  thumbnail: string;
  type: MediaType;
  downloads: DownloadItem[];
}

async function safeGetInstagramMedia(url: string): Promise<MediaResult | null> {
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
    
    const imageUrls: string[] = [];
    if (Array.isArray(data.display_resources)) {
      imageUrls.push(...data.display_resources.map((r: any) => r.src || r.url).filter(Boolean));
    }
    if (data.carousel_media && Array.isArray(data.carousel_media)) {
      for (const item of data.carousel_media) {
        if (item.image_versions2?.candidates?.[0]?.url) {
          imageUrls.push(item.image_versions2.candidates[0].url);
        } else if (item.thumbnail_url) {
          imageUrls.push(item.thumbnail_url);
        }
      }
    }
    if (data.image_versions2?.candidates?.[0]?.url && !imageUrls.includes(data.image_versions2.candidates[0].url)) {
      imageUrls.unshift(data.image_versions2.candidates[0].url);
    }
    if (data.thumbnail_url && !imageUrls.includes(data.thumbnail_url)) {
      imageUrls.push(data.thumbnail_url);
    }

    const videoData = data.video_url || data.url || '';
    const downloads: DownloadItem[] = [];
    const type: MediaType = imageUrls.length > 0 && !videoData ? 'images' : 'video';

    if (videoData) {
      downloads.push({ quality: 'HD (No Watermark)', url: videoData });
    }
    for (const imageUrl of imageUrls) {
      if (!downloads.some(d => d.url === imageUrl)) {
        downloads.push({ quality: `Image ${downloads.length + 1}`, url: imageUrl });
      }
    }

    if (downloads.length === 0) return null;

    return {
      platform: 'instagram',
      title: data.title || data.caption?.slice(0, 80) || 'Instagram Post',
      thumbnail: downloads[0]?.url || '',
      type,
      downloads,
    };
  } catch (error) {
    console.error('Instagram provider error:', error);
    return null;
  }
}

async function safeGetTikTokVideo(url: string): Promise<MediaResult | null> {
  const providers = [
    {
      host: 'tiktok-downloader-api1.p.rapidapi.com',
      path: '/get-video-info',
      transform: (data: any) => ({
        title: data.title || 'TikTok Video',
        thumbnail: data.thumbnail || data.cover || '',
        downloads: [
          { quality: 'HD (No Watermark)', url: data.video_url || data.url || '' },
          { quality: 'SD', url: data.sd_url || '' },
        ].filter((d: any) => d.url),
      }),
    },
    {
      host: 'tiktok-all-in-one.p.rapidapi.com',
      path: '/viral-video',
      transform: (data: any) => {
        const direct = data.video_url || data.url || data.play_url || '';
        return {
          title: data.title || data.desc || 'TikTok Video',
          thumbnail: data.thumbnail || data.cover || data.origin_cover || '',
          downloads: direct
            ? [{ quality: 'HD (No Watermark)', url: direct }]
            : [],
        };
      },
    },
  ];

  for (const provider of providers) {
    try {
      const apiUrl = `https://${provider.host}${provider.path}?url=${encodeURIComponent(url)}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': provider.host,
        },
      });
      if (!response.ok) continue;

      const data = await response.json();
      const transformed = provider.transform(data);
      const direct = transformed.downloads[0]?.url || '';
      if (!direct) continue;

      return {
        platform: 'tiktok',
        title: transformed.title,
        thumbnail: transformed.thumbnail,
        type: 'video',
        downloads: transformed.downloads,
      };
    } catch (error) {
      console.error(`TikTok provider ${provider.host} error:`, error);
      continue;
    }
  }

  return null;
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
    const { url } = body;

    const sanitizedUrl = sanitizeInput(url || '');
    const platform = sanitizedUrl.includes('tiktok.com') || sanitizedUrl.includes('vm.tiktok.com') ? 'tiktok' : 'instagram';

    if (!sanitizedUrl) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!validateUrl(sanitizedUrl, platform)) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    const videoData =
      platform === 'instagram'
        ? await safeGetInstagramMedia(sanitizedUrl)
        : await safeGetTikTokVideo(sanitizedUrl);

    if (!videoData || videoData.downloads.length === 0) {
      return NextResponse.json(
        {
          error: 'Unable to extract media. The post may be private or unsupported. Please try another link.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(videoData);
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to process media. Please try again.' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
