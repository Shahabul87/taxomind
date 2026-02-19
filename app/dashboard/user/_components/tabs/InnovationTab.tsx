'use client';

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { InnovationDashboard } from '@/components/sam/innovation';

interface InnovationTabProps {
  userId?: string | null;
}

export function InnovationTab({ userId }: InnovationTabProps) {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-yellow-50/30 to-orange-50/30 dark:from-slate-900 dark:via-yellow-900/10 dark:to-orange-900/10">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        {/* Innovation Dashboard - All 4 InnovationEngine features */}
        <InnovationDashboard userId={userId ?? undefined} />
      </div>
    </div>
  );
}
