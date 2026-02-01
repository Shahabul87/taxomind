'use client';

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { LearningGapDashboard } from '@/components/sam/learning-gap';

export function GapsTab() {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-slate-50 dark:bg-slate-900">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        {/* Learning Gap Dashboard */}
        <LearningGapDashboard />
      </div>
    </div>
  );
}
