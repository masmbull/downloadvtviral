import { NextRequest } from 'next/server';

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per window

export function rateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export function validateUrl(url: string, platform: string): boolean {
  try {
    const urlObj = new URL(url);

    if (platform === 'instagram') {
      return urlObj.hostname.includes('instagram.com') ||
             urlObj.hostname.includes('instagr.am');
    }

    if (platform === 'tiktok') {
      return urlObj.hostname.includes('tiktok.com') ||
             urlObj.hostname.includes('vm.tiktok.com');
    }

    if (platform === 'youtube') {
      return urlObj.hostname.includes('youtube.com') ||
             urlObj.hostname.includes('youtu.be') ||
             urlObj.hostname.includes('youtube-nocookie.com');
    }

    if (platform === 'doodstream') {
      return urlObj.hostname.includes('doodstream.com') ||
             urlObj.hostname.includes('dood.to') ||
             urlObj.hostname.includes('doodly.com');
    }

    return false;
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}