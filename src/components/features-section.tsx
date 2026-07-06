'use client';

import { Download, Zap, Shield, QrCode } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Fast & Free',
    description: 'Download Instagram Reels and TikTok videos at lightning speed without any cost.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'No Login Required',
    description: 'No need to create an account or log in. Just paste the link and download.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Download,
    title: 'HD Quality',
    description: 'Get videos in high definition quality without any watermarks.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: QrCode,
    title: 'Multiple Platforms',
    description: 'Support for Instagram Reels, Posts, Stories and TikTok videos.',
    color: 'from-purple-500 to-pink-500',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why Choose <span className="gradient-text">DownloadVTViral</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The fastest and most reliable social media video downloader
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
