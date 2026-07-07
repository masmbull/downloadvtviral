import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, validateUrl, sanitizeInput } from '@/lib/rate-limit';
import { recordVisit, recordDownload } from '@/lib/store';

interface DownloadRequest {
  url: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'doodstream';
}

type MediaType = 'video' | 'images';

interface DownloadItem {
  quality: string;
  url: string;
}

interface MediaResult {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'doodstream';
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
    {
      host: 'tiktok-video-downloader-api.p.rapidapi.com',
      path: '/get-video',
      transform: (data: any) => {
        const direct = data.video_url || data.url || data.play_url || data.sd_url || '';
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

async function safeGetYouTubeVideo(url: string): Promise<MediaResult | null> {
  try {
    const apiUrl = `https://youtube-downloader-api.p.rapidapi.com/get-video-info?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'youtube-downloader-api.p.rapidapi.com',
      },
    });
    if (!response.ok) return null;

    const data = await response.json();
    const direct = data.video_url || data.url || data.download_url || '';
    if (!direct) return null;

    return {
      platform: 'youtube',
      title: data.title || 'YouTube Video',
      thumbnail: data.thumbnail || data.thumbnail_url || '',
      type: 'video',
      downloads: [
        { quality: 'HD', url: data.video_url || data.url || '' },
        { quality: 'SD', url: data.sd_url || '' },
      ].filter((d: any) => d.url),
    };
  } catch (error) {
    console.error('YouTube provider error:', error);
    return null;
  }
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

async function safeGetDoodstreamVideo(url: string): Promise<MediaResult | null> {
  try {
    const apiUrl = `https://doodstream-downloader.p.rapidapi.com/get-video?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'doodstream-downloader.p.rapidapi.com',
      },
    });
    if (!response.ok) return null;

    const data = await response.json();
    const direct = data.video_url || data.url || data.download_url || '';
    if (!direct) return null;

    return {
      platform: 'doodstream',
      title: data.title || 'Doodstream Video',
      thumbnail: data.thumbnail || data.thumbnail_url || '',
      type: 'video',
      downloads: [
        { quality: 'HD (No Watermark)', url: direct },
      ],
    };
  } catch (error) {
    console.error('Doodstream provider error:', error);
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
    const { url } = body;

    const sanitizedUrl = sanitizeInput(url || '');

    if (!sanitizedUrl) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let platform: DownloadRequest['platform'] = 'instagram';
    if (sanitizedUrl.includes('youtube.com') || sanitizedUrl.includes('youtu.be')) {
      platform = 'youtube';
    } else if (sanitizedUrl.includes('doodstream.com') || sanitizedUrl.includes('dood.to')) {
      platform = 'doodstream';
    } else if (sanitizedUrl.includes('tiktok.com') || sanitizedUrl.includes('vm.tiktok.com')) {
      platform = 'tiktok';
    } else if (sanitizedUrl.includes('instagram.com') || sanitizedUrl.includes('instagr.am')) {
      platform = 'instagram';
    } else {
      return NextResponse.json(
        { error: 'Unsupported platform. Please use Instagram, TikTok, YouTube, or Doodstream links.' },
        { status: 400 }
      );
    }

    if (!validateUrl(sanitizedUrl, platform)) {
      return NextResponse.json(
        { error: 'Invalid URL for the specified platform' },
        { status: 400 }
      );
    }

    let videoData: MediaResult | null = null;

    videoData = await safeGetFromYtDlp(sanitizedUrl);

    if (!videoData) {
      if (platform === 'instagram') {
        videoData = await safeGetInstagramMedia(sanitizedUrl);
      } else if (platform === 'tiktok') {
        videoData = await safeGetTikTokVideo(sanitizedUrl);
      } else if (platform === 'youtube') {
        videoData = await safeGetYouTubeVideo(sanitizedUrl);
      } else if (platform === 'doodstream') {
        videoData = await safeGetDoodstreamVideo(sanitizedUrl);
      }
    }

    if (!videoData || videoData.downloads.length === 0) {
      return NextResponse.json(
        {
          error: 'Unable to extract media. The post may be private, region-locked, or unsupported. Please try another link or try again later.',
        },
        { status: 400 }
      );
    }

    // Track the successful download
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


