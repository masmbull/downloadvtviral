'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, Film, TrendingUp, ArrowLeft, Globe, MapPin, Users, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAdminAuth } from '@/components/admin-auth-provider';

interface StatsData {
  totalRequests: number;
  successfulDownloads: number;
  failedRequests: number;
  successRate: string;
  averageResponseTime: number;
  visitorStats: { totalVisits: number; uniqueVisitors: number; last5Minutes: number };
  downloadsByPlatform: { instagram: number; tiktok: number; youtube: number; doodstream: number };
  visitors: Array<{ ip: string; userAgent: string; timestamp: number }>;
}

export default function DashboardPage() {
  const { isAuthenticated } = useAdminAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch {
      // keep previous stats
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const platforms = [
    { key: 'instagram', label: 'Instagram', color: 'text-pink-500' },
    { key: 'tiktok', label: 'TikTok', color: 'text-blue-500' },
    { key: 'youtube', label: 'YouTube', color: 'text-red-500' },
    { key: 'doodstream', label: 'Doodstream', color: 'text-orange-500' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="glass-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">DownloadVTViral</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading} className="gap-1">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <ThemeToggle />
              <Link href="/">
                <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <TrendingUp className="w-10 h-10 text-primary" />
            Download <span className="gradient-text">Dashboard</span>
          </h1>
          {lastRefresh && (
            <p className="text-sm text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()}</p>
          )}
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <Download className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold gradient-text">{stats?.successfulDownloads ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Downloads</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-blue-500">{stats?.visitorStats.uniqueVisitors ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Unique Visitors</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <Clock className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-500">{stats?.visitorStats.last5Minutes ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Active (5 min)</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-purple-500">{stats?.successRate ?? '—'}%</p>
              <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Downloads by platform */}
        <Card className="border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" /> Downloads by Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {platforms.map(({ key, label, color }) => (
                <div key={key} className="text-center p-4 rounded-xl bg-muted/50">
                  <p className={`text-2xl font-bold ${color}`}>
                    {stats?.downloadsByPlatform[key] ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Visitor IPs */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Recent Visitors
              <span className="text-sm font-normal text-muted-foreground">
                ({stats?.visitorStats.totalVisits ?? 0} total)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats || stats.visitors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visitors tracked yet.</p>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {stats.visitors.map((visitor, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono">{visitor.ip}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(visitor.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
