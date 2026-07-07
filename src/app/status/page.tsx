import { Metadata } from 'next';
import Link from 'next/link';
import { Film, Globe, Server, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'Status - DownloadVTViral',
  description: 'Live API and service status for DownloadVTViral',
  robots: 'noindex, nofollow',
};

async function getStatus() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/status/check`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error('failed');
    return await res.json();
  } catch {
    return null;
  }
}

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
  const data = await getStatus();
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

        {!data && (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Status Unavailable</h3>
              <p className="text-muted-foreground">Unable to fetch live status. Please try again later.</p>
            </CardContent>
          </Card>
        )}

        {data && (
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
        )}
      </main>
    </div>
  );
}
