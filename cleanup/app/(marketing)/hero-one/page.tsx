import type { Metadata } from 'next';
import MotivationSection from '@/components/marketing/MotivationSection';

export const metadata: Metadata = {
  title: 'Stay Motivated - Brillia',
  description: 'Reach your daily learning goals and stay motivated with interactive progress tracking.',
};

export default function HeroOnePage() {
  return (
    <main className="min-h-screen">
      <MotivationSection />
    </main>
  );
}
