import type { Metadata } from 'next';
import GuidedPathsSection from '@/components/marketing/GuidedPathsSection';

export const metadata: Metadata = {
  title: 'Guided Learning Paths - Brillia',
  description: 'Explore curated learning paths in Math, Data Analysis, Computer Science, and Science & Engineering.',
};

export default function HeroTwoPage() {
  return (
    <main className="min-h-screen bg-background">
      <GuidedPathsSection />
    </main>
  );
}
