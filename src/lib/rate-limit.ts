import { NextRequest } from 'next/server';
import { detectPlatform, type Platform } from '@/lib/platforms';

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

/** Returns true when the URL host matches the claimed platform. */
export function validateUrl(url: string, platform: Platform): boolean {
  const detected = detectPlatform(url);
  return detected === platform;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}