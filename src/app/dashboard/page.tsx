'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Download, Film, TrendingUp, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';

interface HistoryItem {
  id: string;
  platform: 'instagram' | 'tiktok';
  title: string;
  thumbnail: string;
  downloads: Array<{ quality: string; url: string }>;
  timestamp: number;
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('downloadHistory');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  const clearHistory = () => {
    localStorage.removeItem('downloadHistory');
    setHistory([]);
  };

  const platformCounts = useMemo(() => ({
    instagram: history.filter(h => h.platform === 'instagram').length,
    tiktok: history.filter(h => h.platform === 'tiktok').length,
  }), [history]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <nav className="glass-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">
                DownloadVTViral
              </span>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <TrendingUp className="w-10 h-10 text-primary" />
            Download <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            View your download history and statistics
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold gradient-text">{history.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Downloads</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">{platformCounts.instagram}</p>
                <p className="text-sm text-muted-foreground mt-1">Instagram</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-pink-500">{platformCounts.tiktok}</p>
                <p className="text-sm text-muted-foreground mt-1">TikTok</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {history.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={clearHistory}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {history.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-16 text-center">
                <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No downloads yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start downloading videos to see your history here
                </p>
                <Link href="/">
                  <Button className="gradient-primary hover:opacity-90">
                    Go to Downloader
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            history.map(item => (
              <Card key={item.id} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {item.thumbnail && (
                      <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.title || 'Untitled'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.platform === 'instagram' ? 'Instagram' : 'TikTok'} • {formatDate(item.timestamp)}
                      </p>
                    </div>
                    <div className="hidden sm:flex gap-2">
                      {item.downloads.map((dl, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(dl.url, '_blank')}
                        >
                          {dl.quality}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
