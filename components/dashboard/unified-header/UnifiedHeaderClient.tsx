'use client';

import dynamic from 'next/dynamic';

// Dynamic import to prevent hydration mismatch with Framer Motion
const UnifiedDashboardHeader = dynamic(
  () => import('./UnifiedDashboardHeader').then((mod) => mod.UnifiedDashboardHeader),
  {
    ssr: false,
    loading: () => (
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
        <div className="lg:pl-[88px] px-3 sm:px-4 lg:px-6">
          {/* Primary Row Skeleton */}
          <div className="flex items-center justify-between h-10 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="hidden lg:block h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
          {/* Secondary Row Skeleton */}
          <div className="flex items-center justify-between h-8 py-1">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-6 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    ),
  }
);

export { UnifiedDashboardHeader };
export type { DashboardView, QuickActionHandlers } from './UnifiedDashboardHeader';
