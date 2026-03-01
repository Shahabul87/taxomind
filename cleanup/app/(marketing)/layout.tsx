import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Brillia - Learn by Doing',
  description: 'Interactive problem solving that&apos;s effective and fun. Get smarter in 15 minutes a day.',
};

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      {children}
    </div>
  );
}
