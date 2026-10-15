import { Metadata } from 'next';
import Link from 'next/link';
import { Globe, Activity, ArrowLeft, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { getStatusReport, type StatusReport } from '@/lib/status';

export const metadata: Metadata = {
  title: 'Status - DownloadVTViral',
  description: 'Live API and service status for DownloadVTViral',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

async function runChecks(): Promise<StatusReport | null> {
  try {
    return await getStatusReport();
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[status] || statusColor.checking}`}>
      {serviceLabel[status] || status}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-medium">{label}</span>
      {children}
    </div>
  );
}

export default async function StatusPage() {
  const data = await runChecks();
  const updated = data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Unavailable';

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
          <p className="text-lg text-muted-foreground">Last updated: {updated}</p>
        </div>

        {!data ? (
          <Card className="border-border">
            <CardContent className="pt-6 text-center text-muted-foreground">
              Status service is currently unavailable. Please try again later.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Core API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Download API">
                  <StatusBadge status={data.services.api.status} />
                </Row>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Latency</span>
                  <span>{data.services.api.latency}ms</span>
                </div>
                <Row label="Supported platforms">
                  <span className="text-sm text-muted-foreground">{data.services.supportedPlatforms}</span>
                </Row>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" /> Extract Providers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label={`${data.services.providers.primary.name} (primary)`}>
                  <StatusBadge status={data.services.providers.primary.status} />
                </Row>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Backend latency</span>
                  <span>{data.services.backend.latency || '-'}ms</span>
                </div>
                <Row label={`${data.services.providers.fallback.name} (fallback)`}>
                  <StatusBadge status={data.services.providers.fallback.status} />
                </Row>
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