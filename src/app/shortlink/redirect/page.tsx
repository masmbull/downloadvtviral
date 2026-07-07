'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Film, Download, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ShortlinkRedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const downloadUrl = searchParams.get('url') || '';
  const filename = searchParams.get('filename') || 'video.mp4';
  const delay = parseInt(searchParams.get('delay') || '5', 10);
  const [countdown, setCountdown] = useState(delay);

  useEffect(() => {
    if (!downloadUrl) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = `/api/proxy/download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [downloadUrl, filename]);

  const handleSkip = () => {
    if (downloadUrl) {
      window.location.href = `/api/proxy/download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
            <Film className="w-10 h-10 text-white" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">Please wait...</h1>
          <p className="text-muted-foreground">
            Please give me 5 sec to process it, and to monetize this website
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-6xl font-bold gradient-text">
          <Clock className="w-12 h-12" />
          {countdown}s
        </div>

        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${((delay - countdown) / delay) * 100}%` }}
          />
        </div>

        <Button
          onClick={handleSkip}
          variant="outline"
          className="w-full"
          disabled={countdown === 0}
        >
          Skip Ad & Download
        </Button>

        <p className="text-xs text-muted-foreground">
          Your download will start automatically after the countdown
        </p>
      </div>
    </div>
  );
}

export default function ShortlinkRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
          <Film className="w-10 h-10 text-white" />
        </div>
      </div>
    }>
      <ShortlinkRedirectContent />
    </Suspense>
  );
}
