import type { Metadata } from 'next';
import VibrantHeroSection from '@/components/marketing/hero-preview/VibrantHeroSection';

export const metadata: Metadata = {
  title: 'Hero Preview - Taxomind',
  description:
    'Preview the vibrant hero section with animated Bloom&apos;s Taxonomy pyramid.',
};

export default function HeroPreviewPage() {
  return (
    <main className="min-h-screen">
      <VibrantHeroSection />
    </main>
  );
}
