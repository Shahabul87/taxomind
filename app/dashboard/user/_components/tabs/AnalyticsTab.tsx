'use client';

/**
 * AnalyticsTab
 *
 * Redesigned analytics tab with course-centric approach.
 * Provides clean, focused view of enrolled course progress and AI insights.
 *
 * Features:
 * - 3-tab design: Overview, Courses, AI Insights
 * - Consolidated API reducing 8+ calls to 1-2
 * - Real-time data from SAM AI system
 * - Responsive design
 */

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { CourseAnalyticsDashboard } from '@/components/analytics/enrolled';

interface AnalyticsTabProps {
  userId: string;
}

export function AnalyticsTab({ userId }: AnalyticsTabProps) {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-900 dark:via-indigo-900/10 dark:to-purple-900/10">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-0 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-4 sm:pt-6">
        {/* Course Analytics Dashboard - New course-centric design */}
        <CourseAnalyticsDashboard
          defaultTab="overview"
          refreshInterval={0} // Manual refresh
        />
      </div>
    </div>
  );
}
