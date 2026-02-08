import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Research Intelligence | Taxomind',
  description:
    'Explore cutting-edge AI research papers, discover breakthrough innovations, and stay at the forefront of artificial intelligence advancement.',
};

export default function AIResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
