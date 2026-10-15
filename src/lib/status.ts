import { PLATFORMS } from '@/lib/platforms';

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'checking';

export interface StatusReport {
  timestamp: string;
  environment?: string;
  services: {
    api: { status: ServiceStatus; latency: number };
    backend: { status: ServiceStatus; latency: number };
    providers: {
      primary: { name: string; status: ServiceStatus };
      fallback: { name: string; status: ServiceStatus };
    };
    supportedPlatforms: number;
  };
}

/**
 * Probe the extraction backend. Runs per request (no in-process cache — that
 * would be per-instance and unreliable on serverless).
 */
export async function getStatusReport(): Promise<StatusReport> {
  const apiUrl = process.env.YTDLP_API_URL;
  let backend: { status: ServiceStatus; latency: number };

  if (!apiUrl) {
    backend = { status: 'down', latency: 0 };
  } else {
    const start = Date.now();
    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      backend = { status: res.ok ? 'operational' : 'degraded', latency: Date.now() - start };
    } catch {
      backend = { status: 'down', latency: Date.now() - start };
    }
  }

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      api: { status: backend.status, latency: backend.latency },
      backend,
      providers: {
        primary: { name: 'yt-dlp', status: backend.status },
        fallback: { name: 'RapidAPI', status: process.env.RAPIDAPI_KEY ? 'operational' : 'down' },
      },
      supportedPlatforms: PLATFORMS.length,
    },
  };
}