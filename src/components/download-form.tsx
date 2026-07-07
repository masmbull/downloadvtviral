'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Film, Sparkles, Loader2 } from 'lucide-react';

interface DownloadOption {
  quality: string;
  url: string;
}

interface VideoInfo {
  platform: 'instagram' | 'tiktok';
  title: string;
  thumbnail: string;
  downloads: DownloadOption[];
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9\s\-_.]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function triggerDownload(downloadUrl: string, filename: string) {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `/api/proxy/download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`;
  document.body.appendChild(iframe);
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 5000);
}

export function DownloadForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const detectPlatform = (url: string): 'instagram' | 'tiktok' | null => {
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
    return null;
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError('');
    } catch {
      setError('Could not access clipboard. Please paste manually.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVideoInfo(null);

    const platform = detectPlatform(url);
    if (!platform) {
      setError('Please enter a valid Instagram or TikTok URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video');
      }
      setVideoInfo(data);
      saveToHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = (data: VideoInfo) => {
    try {
      const history = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
      const entry = {
        id: Date.now().toString(),
        ...data,
        timestamp: Date.now(),
      };
      history.unshift(entry);
      localStorage.setItem('downloadHistory', JSON.stringify(history.slice(0, 100)));
    } catch {
      // Ignore history errors
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl border-border/50 animate-scale-in">
      <CardContent className="pt-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Paste video link here
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.instagram.com/... or https://www.tiktok.com/..."
                  required
                  className="pr-32"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePasteFromClipboard}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-xs h-7"
                >
                  Paste
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm animate-slide-up">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full gap-2 gradient-primary hover:opacity-90 transition-opacity"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Film className="w-5 h-5" />
                Download Video
              </>
            )}
          </Button>
        </form>

        {videoInfo && (
          <div className="mt-8 space-y-6 animate-slide-up">
            <div className="border-t border-border pt-6">
              <h2 className="text-2xl font-semibold mb-4">
                {videoInfo.title || 'Video Found'}
              </h2>

              {videoInfo.thumbnail && (
                <div className="mb-4 rounded-xl overflow-hidden aspect-video bg-muted">
                  <img
                    src={videoInfo.thumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Download Options:
                </h3>
                {videoInfo.downloads.map((download, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-between group hover:border-primary/50 transition-colors"
                    disabled={downloadingIndex === index}
                    onClick={() => {
                      setDownloadingIndex(index);
                      const rawTitle = videoInfo.title || 'video';
                      const sanitizedTitle = sanitizeFilename(rawTitle);
                      const filename = `${sanitizedTitle}-${download.quality.replace(/\s+/g, '-').toLowerCase()}.mp4`;
                      triggerDownload(download.url, filename);
                      setTimeout(() => setDownloadingIndex(null), 3000);
                    }}
                  >
                    <span>{download.quality}</span>
                    {downloadingIndex === index ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
