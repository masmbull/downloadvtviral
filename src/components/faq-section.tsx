'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Is DownloadVTViral free to use?',
    answer: 'Yes! DownloadVTViral is completely free to use. There are no hidden charges or subscription fees. You can download as many videos as you want without any limits.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No account is required. Simply paste the video URL and download your content instantly. We value your privacy and don\'t require any personal information.',
  },
  {
    question: 'What platforms are supported?',
    answer: 'We currently support Instagram (Reels, Posts, Stories) and TikTok videos. We regularly add support for more platforms, so stay tuned!',
  },
  {
    question: 'Are there any download limits?',
    answer: 'We have reasonable rate limits to ensure fair usage for all users. The limit ensures the service remains fast and reliable for everyone.',
  },
  {
    question: 'Is it safe to use?',
    answer: 'Absolutely. DownloadVTViral doesn\'t store any personal data or downloaded videos. All processing happens securely on our servers.',
  },
  {
    question: 'Can I download videos in HD quality?',
    answer: 'Yes! We provide downloads in the highest available quality, including HD. The exact quality depends on the uploader\'s original video quality.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about DownloadVTViral
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200 group"
              >
                <span className="text-left font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5 pt-0 text-muted-foreground leading-relaxed animate-slide-up">
                  {faq.answer}
                </div>
              )}
              {openIndex !== index && (
                <div className="px-5 pb-5 pt-0 text-muted-foreground leading-relaxed hidden">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
