'use client';
import { HeroSection } from '@/components/hero-section';
import { HowItWorksSection } from '@/components/how-it-works-section';
import { FeaturesSection } from '@/components/features-section';
import { SupportedPlatformsSection } from '@/components/supported-platforms-section';
import { FAQSection } from '@/components/faq-section';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <SupportedPlatformsSection />
      <FAQSection />
    </div>
  );
}
