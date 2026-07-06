'use client';
import { useState } from 'react';

interface VideoInfo {
  platform: 'instagram' | 'tiktok';
  title: string;
  thumbnail: string;
  downloads: Array<{ quality: string; url: string }>;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  const detectPlatform = (url: string): 'instagram' | 'tiktok' | null => {
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
    return null;
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 font-sans min-h-screen">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            DownloadVTViral
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Download Instagram & TikTok videos for free
          </p>
        </div>

        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste video link here
              </label>
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.instagram.com/... or https://www.tiktok.com/..."
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Download Video'}
            </button>
          </form>

          {videoInfo && (
            <div className="mt-8 space-y-6">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  {videoInfo.title || 'Video Found'}
                </h2>
                
                {videoInfo.thumbnail && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img src={videoInfo.thumbnail} alt="Video thumbnail" className="w-full h-auto" />
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Download Options:
                  </h3>
                  {videoInfo.downloads.map((download, index) => (
                    <a
                      key={index}
                      href={download.url}
                      download
                      className="flex items-center justify-between w-full bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      <span>{download.quality}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            Supports Instagram Reels, Posts, and TikTok videos
          </p>
        </div>
      </main>
    </div>
  );
}