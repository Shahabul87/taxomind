'use client';

import { useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { SAMContextTracker } from '@/components/sam/SAMContextTracker';
import { ActivityStream } from '../ActivityStream';
import { EmptyState } from '../EmptyState';
import { useActivities } from '@/hooks/use-activities';
import {
  LevelProgressBar,
  AchievementsWidget,
  LeaderboardWidget,
  StreakWidget,
} from '@/components/gamification';
import { AchievementBadges } from '@/components/sam/AchievementBadges';
import { LeaderboardWidget as SAMLeaderboardWidget } from '@/components/sam/LeaderboardWidget';
import { CompetencyDashboard } from '@/components/sam/CompetencyDashboard';

interface GamificationTabProps {
  userId: string;
  viewMode: 'grid' | 'list';
}

export function GamificationTab({ viewMode }: GamificationTabProps) {
  const {
    activities,
    isLoading,
    error,
    hasMore,
    loadMore,
    updateActivity,
    deleteActivity,
  } = useActivities();

  // Refs for stable callback access to changing values
  const activitiesRef = useRef(activities);
  activitiesRef.current = activities;
  const deleteActivityRef = useRef(deleteActivity);
  deleteActivityRef.current = deleteActivity;
  const updateActivityRef = useRef(updateActivity);
  updateActivityRef.current = updateActivity;

  // Memoized event handlers - stable references prevent child re-renders
  const handleViewDetails = useCallback((id: string) => {
    console.log('View details for activity:', id);
  }, []);

  const handleEdit = useCallback((id: string) => {
    console.log('Edit activity:', id);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const success = await deleteActivityRef.current(id);
    if (!success) {
      console.error('Failed to delete activity');
    }
  }, []);

  const handleToggleComplete = useCallback(async (id: string) => {
    const activity = activitiesRef.current.find((a) => a.id === id);
    if (!activity) return;

    const isCompleted =
      activity.status === 'SUBMITTED' || activity.status === 'GRADED';

    const success = await updateActivityRef.current(id, {
      status: isCompleted ? 'NOT_STARTED' : 'SUBMITTED',
      completedAt: isCompleted ? undefined : new Date(),
    });

    if (!success) {
      console.error('Failed to toggle activity completion');
    }
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    console.log('Toggle favorite for activity:', id);
  }, []);

  return (
    <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      {/* SAM Context Tracker - Invisible, syncs page context */}
      <SAMContextTracker />

      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pt-16 sm:pt-20">
        {/* Gamification Section */}
        <section className="mb-4 sm:mb-6 md:mb-8">
          {/* Level Progress Header */}
          <div className="mb-4 sm:mb-6">
            <LevelProgressBar />
          </div>

          {/* Gamification Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Streak Widget */}
            <div className="md:col-span-1 lg:col-span-1">
              <StreakWidget />
            </div>

            {/* Achievements Widget */}
            <div className="md:col-span-1 lg:col-span-2">
              <AchievementsWidget maxDisplay={6} />
            </div>
          </div>

          {/* SAM AI Achievements */}
          <div className="mt-4 sm:mt-6">
            <AchievementBadges limit={8} showLocked compact={false} />
          </div>

          {/* Leaderboard (Full Width) */}
          <div className="mt-4 sm:mt-6">
            <LeaderboardWidget maxDisplay={5} />
          </div>

          {/* SAM AI Learning Leaderboard */}
          <div className="mt-4 sm:mt-6">
            <SAMLeaderboardWidget
              limit={5}
              compact={false}
              showCurrentUserPosition={true}
            />
          </div>

          {/* SAM AI Advanced Analytics Row */}
          <div className="mt-4 sm:mt-6">
            {/* Competency Dashboard - Skill Mastery Tracking */}
            <CompetencyDashboard />
            {/* NOTE: ConfidenceCalibrationWidget moved to Analytics tab */}
          </div>
        </section>

        {/* Activity Stream Section */}
        {isLoading && activities.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                Loading activities...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <EmptyState type="activities" />
        ) : (
          <ActivityStream
            activities={activities}
            viewMode={viewMode}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleComplete={handleToggleComplete}
            onToggleFavorite={handleToggleFavorite}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
