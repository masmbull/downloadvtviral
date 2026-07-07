'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Film, Sparkles, Loader2, Plus, Image as ImageIcon, Crown, ExternalLink } from 'lucide-react';
import { VisitorInfo } from '@/components/visitor-info';

interface DownloadItem {
  quality: string;
  url: string;
}

interface MediaResult {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'doodstream';
  title: string;
  thumbnail: string;
  type: 'video' | 'images';
  downloads: DownloadItem[];
}

type ResultEntry = MediaResult & { sourceUrl: string };

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9\s\-_.]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function triggerDownloadViaShortlink(downloadUrl: string, filename: string) {
  // Navigate to shortlink redirect page for monetization (countdown)
  const params = new URLSearchParams({
    url: downloadUrl,
    filename: filename,
    delay: '5',
  });
  window.location.href = `/shortlink/redirect?${params.toString()}`;
}

export function DownloadForm() {
  const [urls, setUrls] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addUrl = () => {
    if (urls.length < 3) setUrls([...urls, '']);
  };

  const updateUrl = (index: number, value: string) => {
    const next = [...urls];
    next[index] = value;
    setUrls(next);
  };

  const detectPlatform = (url: string): 'instagram' | 'tiktok' | 'youtube' | 'doodstream' | null => {
    if (!url) return null;
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('doodstream.com') || url.includes('dood.to')) return 'doodstream';
    return null;
  };

  const handlePaste = async (index: number) => {
    try {
      const text = await navigator.clipboard.readText();
      updateUrl(index, text);
      setError('');
    } catch {
      setError('Could not access clipboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults([]);

    const filled = urls.filter((u) => detectPlatform(u));
    const toProcess = filled.slice(0, 3);

    if (toProcess.length === 0) {
      setError('Paste at least one Instagram, TikTok, YouTube, or Doodstream URL');
      return;
    }

    if (filled.length > 3) {
      setError('Demo supports 3 links max. Purchase pro for unlimited batch.');
      return;
    }

    setLoading(true);

    try {
      const entries = await Promise.all(
        toProcess.map(async (url) => {
          const platform = detectPlatform(url)!;
          const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, platform }),
          });
          const data = (await response.json()) as MediaResult;
          if (!response.ok) {
            return { ...data, error: true, sourceUrl: url } as any;
          }
          return { ...data, sourceUrl: url } as ResultEntry;
        })
      );
      setResults(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (result: ResultEntry, download: DownloadItem) => {
    const key = `${result.sourceUrl}-${download.url}`;
    setDownloading(key);
    const ext = result.type === 'images' ? 'jpg' : 'mp4';
    const filename = `${sanitizeFilename(result.title || 'video')}-${download.quality.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
    
    // Navigate to shortlink redirect page for monetization
    triggerDownloadViaShortlink(download.url, filename);
    
    // Reset downloading state after a moment (the page will navigate away)
    setTimeout(() => {
      setDownloading(null);
    }, 2000);
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl border-border/50 animate-scale-in">
      <CardContent className="pt-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Paste video or post link here
            </label>
            <p className="text-xs text-muted-foreground">Supported: YouTube, TikTok, Instagram, Doodstream</p>
            <div className="flex flex-col gap-2">
              {urls.map((url, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      value={url}
                      onChange={(e) => updateUrl(idx, e.target.value)}
                      placeholder={`Link ${idx + 1}: https://www.instagram.com/... or https://www.tiktok.com/...`}
                      required={idx === 0}
                      className="pr-32"
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => handlePaste(idx)} className="absolute right-1 top-1/2 -translate-y-1/2 text-xs h-7">
                      Paste
                    </Button>
                  </div>
                </div>
              ))}
              {urls.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addUrl} className="gap-2">
                  <Plus className="w-4 h-4" /> Add link
                </Button>
              )}
              {urls.length >= 3 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Crown className="w-3 h-3" />
                  <span>Demo limit reached. Purchase pro for unlimited batch downloads.</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm animate-slide-up">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full gap-2 gradient-primary hover:opacity-90 transition-opacity" size="lg">
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

        {results.length > 0 && (
          <div className="mt-8 space-y-8 animate-slide-up">
            {results.map((result, idx) => (
              <div key={idx} className={`border-t border-border pt-6 ${idx > 0 ? 'mt-6' : ''}`} id={`batch-result-${idx}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">{(result as any).error ? 'Failed' : (result.title || 'Media Found')}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setResults(results.filter((_, i) => i !== idx))}>
                    Dismiss
                  </Button>
                </div>

                {!(result as any).error && result.thumbnail && (
                  <div className="mb-4 rounded-xl overflow-hidden aspect-video bg-muted">
                    <img src={result.thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {!(result as any).error ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      {result.type === 'images' ? (
                        <ImageIcon className="w-5 h-5 text-primary" />
                      ) : (
                        <Download className="w-5 h-5 text-primary" />
                      )}
                      <h3 className="text-lg font-medium">
                        {result.type === 'images' ? `Download Photos (${result.downloads.length})` : 'Download Options'}:
                      </h3>
                      <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Redirect with 5s countdown
                      </span>
                    </div>
                    <div className="space-y-2">
                      {result.downloads.map((download, index) => (
                        <div key={index} className="space-y-1">
                          <Button
                            variant="outline"
                            className="w-full justify-between group hover:border-primary/50 transition-colors"
                            disabled={downloading === `${result.sourceUrl}-${download.url}`}
                            onClick={() => handleDownload(result, download)}
                          >
                            <span>{download.quality}</span>
                            {downloading === `${result.sourceUrl}-${download.url}` ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            )}
                          </Button>
                          {downloading === `${result.sourceUrl}-${download.url}` && (
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full animate-progress" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                      <div className="mt-4 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full gap-2"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/shortlink/create', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                downloadUrl: result.downloads[0]?.url || '',
                                filename: `${sanitizeFilename(result.title || 'video')}-${result.downloads[0]?.quality?.replace(/\s+/g, '-').toLowerCase() || 'download'}.${result.type === 'images' ? 'jpg' : 'mp4'}`,
                                platform: result.platform,
                              }),
                            });
                            const data = await res.json();
                            if (data.shortUrl) {
                              await navigator.clipboard.writeText(data.shortUrl);
                              alert('Shortlink copied to clipboard! Share this link with others.');
                            }
                          } catch {
                            alert('Failed to create shortlink. Please try again.');
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Copy Shortlink to Share
                      </Button>
                      <VisitorInfo />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{(result as any).message || (result as any).error || 'Failed to extract media'}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setResults(results.filter((_, i) => i !== idx));
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                {results.length > idx + 1 && (
                  <div className="mt-6">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => document.getElementById(`batch-result-${idx + 1}`)?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Download other video
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}