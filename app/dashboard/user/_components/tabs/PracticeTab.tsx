'use client';

import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { FeatureGate } from '@/lib/dashboard/FeatureGate';
import { SpacedRepetitionCalendar } from '@/components/sam/SpacedRepetitionCalendar';
import {
  PracticeTimer,
  PomodoroTimer,
  SkillMasteryCard,
  PracticeCalendarHeatmap,
  PracticeLeaderboard,
  PracticeStreakDisplay,
  MilestoneTimeline,
  PracticeRecommendations,
} from '@/components/practice';
import { PracticeGoalSetter } from '@/components/practice/PracticeGoalSetter';

export function PracticeTab() {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-slate-50 dark:bg-slate-900">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 pt-16 sm:pt-20">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex-shrink-0">
              <span className="text-2xl sm:text-3xl">&#x1F3AF;</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                10,000 Hour Practice Tracker
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                Track your deliberate practice journey to mastery with quality-adjusted hours
              </p>
            </div>
          </div>
        </div>

        {/* Streak Display */}
        <div className="mb-4 sm:mb-6">
          <PracticeStreakDisplay variant="large" />
        </div>

        {/* Timer Section - Two Timers Side by Side */}
        <div className="mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Main Practice Timer */}
          <PracticeTimer />

          {/* Pomodoro Timer */}
          <PomodoroTimer />
        </div>

        {/* SAM Recommendations */}
        <div className="mb-4 sm:mb-6">
          <PracticeRecommendations limit={3} />
        </div>

        {/* Practice Goals */}
        <div className="mb-4 sm:mb-6">
          <PracticeGoalSetter />
        </div>

        {/* Calendar Heatmap - Full Width */}
        <div className="mb-4 sm:mb-6">
          <PracticeCalendarHeatmap />
        </div>

        {/* Spaced Repetition Calendar */}
        <FeatureGate feature="SPACED_REPETITION_CALENDAR">
          <div className="mb-4 sm:mb-6">
            <SpacedRepetitionCalendar />
          </div>
        </FeatureGate>

        {/* Leaderboard and Milestones Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Practice Leaderboard */}
          <PracticeLeaderboard type="global" limit={5} showPodium />

          {/* Milestone Timeline */}
          <MilestoneTimeline limit={5} />
        </div>
      </div>
    </div>
  );
}
