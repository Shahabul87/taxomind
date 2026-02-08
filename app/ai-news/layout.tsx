import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI News Intelligence | Taxomind',
  description:
    'Stay ahead with curated AI insights from top sources worldwide. Real-time updates on breakthroughs, research, and industry developments.',
};

export default function AINewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
