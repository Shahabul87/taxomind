import type { Metadata } from 'next';
import PathsSection from '@/components/paths/PathsSection';

export const metadata: Metadata = {
  title: 'Guided Learning Paths - Brillia',
  description: 'Explore guided learning paths in Math, Computer Science, Data Analysis, and Science.',
};

export default function HeroThreePage() {
  return (
    <main className="min-h-screen bg-background">
      <PathsSection />
    </main>
  );
}
