'use client';

import dynamic from 'next/dynamic';
import type { User as NextAuthUser } from 'next-auth';

// Dynamically import SmartHeader with SSR disabled to prevent hydration mismatch
// The header uses Framer Motion which renders differently on server vs client
const SmartHeader = dynamic(
  () => import('./smart-header').then((mod) => mod.SmartHeader),
  {
    ssr: false,
    loading: () => (
      // Placeholder that matches the header dimensions
      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md bg-white/95 dark:bg-slate-800/95">
        <div className="h-full pl-4 lg:pl-[88px] pr-4 sm:pr-6 lg:pr-8" />
      </header>
    ),
  }
);

interface SmartHeaderClientProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  quickActionHandlers?: {
    onCreateStudyPlan: () => void;
    onCreateCoursePlan: () => void;
    onCreateBlogPlan: () => void;
    onScheduleSession: () => void;
    onAddTodo: () => void;
    onSetGoal: () => void;
  };
  isMobileVisible?: boolean;
}

export function SmartHeaderClient({
  user,
  viewMode,
  onViewModeChange,
  quickActionHandlers,
  isMobileVisible,
}: SmartHeaderClientProps) {
  return (
    <SmartHeader
      user={user}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      quickActionHandlers={quickActionHandlers}
      isMobileVisible={isMobileVisible}
    />
  );
}
