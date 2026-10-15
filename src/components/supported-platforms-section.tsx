'use client';

import { Play, Music, Image as ImageIcon, Film, Video, Link2 } from 'lucide-react';
import { PLATFORMS, PLATFORM_NAMES, type Platform } from '@/lib/platforms';

const META: Partial<Record<Platform, { icon: typeof Play; color: string; description: string }>> = {
  youtube: { icon: Play, color: 'text-red-500', description: 'Videos, Shorts, and audio in HD.' },
  tiktok: { icon: Music, color: 'text-pink-500', description: 'Save TikTok videos without watermark.' },
  instagram: { icon: ImageIcon, color: 'text-purple-500', description: 'Reels, Posts, and carousels.' },
  twitter: { icon: Video, color: 'text-sky-500', description: 'Videos and GIFs from X / Twitter.' },
  facebook: { icon: Film, color: 'text-blue-600', description: 'Facebook videos and Reels.' },
  vimeo: { icon: Video, color: 'text-cyan-500', description: 'Vimeo videos in original quality.' },
  doodstream: { icon: Film, color: 'text-orange-500', description: 'Direct Doodstream downloads.' },
  videy: { icon: Film, color: 'text-emerald-500', description: 'Fast Videy CDN downloads.' },
  vidara: { icon: Film, color: 'text-indigo-500', description: 'Ad-free HLS streams from Vidara.' },
};

function metaFor(platform: Platform) {
  return META[platform] ?? { icon: Link2, color: 'text-muted-foreground', description: 'Supported via extractor engine.' };
}

export function SupportedPlatformsSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Supported Platforms</h2>
          <p className="text-lg text-muted-foreground">
            {PLATFORMS.length}+ platforms — social media and video hosts.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PLATFORMS.map((platform) => {
            const { icon: Icon, color, description } = metaFor(platform);
            return (
              <div
                key={platform}
                className="border rounded-xl p-5 text-center hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-center mb-3">
                  <Icon className={`w-9 h-9 ${color}`} />
                </div>
                <h3 className="font-semibold mb-1">{PLATFORM_NAMES[platform]}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}