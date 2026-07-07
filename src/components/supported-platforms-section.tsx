'use client';

import { Play, Image as ImageIcon, Film, Music } from 'lucide-react';

const supportedPlatforms = [
  {
    name: 'YouTube',
    icon: Play,
    color: 'text-red-500',
    description: 'Download videos in HD, SD, and audio-only formats.',
    supported: true,
  },
  {
    name: 'TikTok',
    icon: Music,
    color: 'text-pink-500',
    description: 'Save TikTok videos without watermark.',
    supported: true,
  },
  {
    name: 'Instagram',
    icon: ImageIcon,
    color: 'text-purple-500',
    description: 'Download Reels, Posts, and Stories images/videos.',
    supported: true,
  },
  {
    name: 'Doodstream',
    icon: Film,
    color: 'text-blue-500',
    description: 'Download Doodstream videos in high quality.',
    supported: true,
  },
];

export function SupportedPlatformsSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Supported Platforms</h2>
          <p className="text-lg text-muted-foreground">
            We support downloading from these platforms:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportedPlatforms.map((platform) => (
            <div
              key={platform.name}
              className="border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
            >
              <div className="flex justify-center mb-4">
                <platform.icon className={`w-12 h-12 ${platform.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{platform.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {platform.description}
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Supported
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
