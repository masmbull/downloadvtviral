'use client';

import { Zap } from 'lucide-react';
import { DownloadForm } from '@/components/download-form';

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-5 dark:opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6 animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>Free • Fast • No Login Required</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Download Instagram & <br className="hidden sm:block" />
            <span className="gradient-text">TikTok Videos</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            The fastest way to save Reels, Posts, and TikTok videos in HD quality.
            No watermark, no registration, completely free.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Supports Instagram Reels
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Supports TikTok videos
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              HD Quality without Watermark
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <DownloadForm />
        </div>
      </div>
    </section>
  );
}
