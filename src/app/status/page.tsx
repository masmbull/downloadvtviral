import { Metadata } from 'next';
import Link from 'next/link';
import { Film, Globe, Server, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

async function runChecks() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      api: { status: 'operational' as 'operational' | 'degraded' | 'down' | 'checking', latency: 0 },
      providers: {
        instagram: { status: 'checking' as 'operational' | 'degraded' | 'down' | 'checking', latency: 0 },
        tiktok: { status: 'checking' as 'operational' | 'degraded' | 'down' | 'checking', latency: 0 },
      },
    },
    uptime: 0,
  };

  const apiStart = Date.now();
  try {
    const apiPromise = fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://downloadvtviral.web.id'}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.tiktok.com/@teatrikaf/video/7647187848557490', platform: 'tiktok' }),
    });
    const apiResponse = await apiPromise;
    checks.services.api.latency = Date.now() - apiStart;
    checks.services.api.status = apiResponse.ok ? 'operational' : 'degraded';
  } catch {
    checks.services.api.status = 'down';
    checks.services.api.latency = Date.now() - apiStart;
  }

  const igStart = Date.now();
  try {
    const igPromise = fetch(`https://instagram-downloader-api1.p.rapidapi.com/get-media-info?url=${encodeURIComponent('https://www.instagram.com/p/ABC123/')}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'instagram-downloader-api1.p.rapidapi.com',
      },
    });
    const igResponse = await igPromise;
    checks.services.providers.instagram.latency = Date.now() - igStart;
    checks.services.providers.instagram.status = igResponse.ok ? 'operational' : 'degraded';
  } catch {
    checks.services.providers.instagram.status = 'down';
    checks.services.providers.instagram.latency = Date.now() - igStart;
  }

  const ttStart = Date.now();
  try {
    const ttPromise = fetch(`https://tiktok-downloader-api1.p.rapidapi.com/get-video-info?url=${encodeURIComponent('https://www.tiktok.com/@teatrikaf/video/7647187848557490')}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
        'X-RapidAPI-Host': 'tiktok-downloader-api1.p.rapidapi.com',
      },
    });
    const ttResponse = await ttPromise;
    checks.services.providers.tiktok.latency = Date.now() - ttStart;
    checks.services.providers.tiktok.status = ttResponse.ok ? 'operational' : 'degraded';
  } catch {
    checks.services.providers.tiktok.status = 'down';
    checks.services.providers.tiktok.latency = Date.now() - ttStart;
  }

  return checks;
}

export const metadata: Metadata = {
  title: 'Status - DownloadVTViral',
  description: 'Live API and service status for DownloadVTViral',
  robots: 'noindex, nofollow',
};

const serviceLabel: Record<string, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  checking: 'Checking',
};

const statusColor: Record<string, string> = {
  operational: 'text-green-500 bg-green-500/10',
  degraded: 'text-yellow-600 bg-yellow-600/10',
  down: 'text-red-500 bg-red-500/10',
  checking: 'text-blue-500 bg-blue-500/10',
};

export default async function StatusPage() {
  const data = await runChecks();
  const updated = data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Unknown';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="glass-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">DownloadVTViral</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Activity className="w-10 h-10 text-primary" />
            Service <span className="gradient-text">Status</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {updated}
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Core API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Download API</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[data.services.api.status] || statusColor.checking}`}>
                  {serviceLabel[data.services.api.status] || data.services.api.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Latency</span>
                <span>{data.services.api.latency}ms</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Providers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Instagram</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[data.services.providers.instagram.status] || statusColor.checking}`}>
                  {serviceLabel[data.services.providers.instagram.status] || data.services.providers.instagram.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Latency</span>
                <span>{data.services.providers.instagram.latency || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">TikTok</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[data.services.providers.tiktok.status] || statusColor.checking}`}>
                  {serviceLabel[data.services.providers.tiktok.status] || data.services.providers.tiktok.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Latency</span>
                <span>{data.services.providers.tiktok.latency || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Environment</span>
                <span className="font-medium">{data.environment}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-medium">{updated}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
