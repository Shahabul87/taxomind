import type { TabKey } from '@/lib/paths/data';
import MathAngles from './illustrations/MathAngles';
import CSBlocks from './illustrations/CSBlocks';
import DataViz from './illustrations/DataViz';
import ScienceGeo from './illustrations/ScienceGeo';

interface DemoCardProps {
  type: TabKey;
  ctaLabel: string;
  ctaHref?: string;
}

const illustrations: Record<TabKey, React.ComponentType> = {
  math: MathAngles,
  cs: CSBlocks,
  data: DataViz,
  science: ScienceGeo,
};

export default function DemoCard({ type, ctaLabel, ctaHref = '#' }: DemoCardProps) {
  const Illustration = illustrations[type];

  return (
    <div className="flex flex-col">
      {/* Demo card */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 border-border bg-surface p-8 shadow-lg"
        aria-hidden="true"
      >
        {/* Illustration container with fixed aspect ratio */}
        <div className="aspect-[4/3] w-full">
          <Illustration />
        </div>
      </div>

      {/* CTA Pill */}
      <a
        href={ctaHref}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {ctaLabel}
      </a>
    </div>
  );
}
