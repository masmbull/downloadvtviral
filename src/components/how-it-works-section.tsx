'use client';

import { Link2, Download, Share2 } from 'lucide-react';

const steps = [
  {
    icon: Link2,
    step: '1',
    title: 'Copy the Link',
    description: 'Copy the video URL from Instagram or TikTok and paste it into our downloader.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Download,
    step: '2',
    title: 'Paste & Process',
    description: 'Paste the link into the input field and click the download button to fetch the video.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Share2,
    step: '3',
    title: 'Download',
    description: 'Choose the quality and click download. The video will be saved to your device.',
    color: 'from-orange-500 to-amber-500',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Download social media videos in 3 easy steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative text-center group animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-primary/20" />
                )}
                <div className="relative w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                  <div className="relative w-16 h-16 rounded-full bg-card border-2 border-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
