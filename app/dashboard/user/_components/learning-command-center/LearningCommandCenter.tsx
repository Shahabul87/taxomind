'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { User as NextAuthUser } from 'next-auth';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Components
import { DailyHeroSection } from './DailyHeroSection';
import { TodaySchedule } from './TodaySchedule';
import { TodayTasks } from './TodayTasks';
import { WeeklyTimeline } from './WeeklyTimeline';
import { QuickInsights } from './QuickInsights';
import { LearningGantt } from './LearningGantt';
import { JourneyProgress } from '../JourneyProgress';
import { CalendarStatusWidget } from '@/components/calendar/CalendarStatusWidget';
import { LearningJourneyMap } from '../smart-dashboard/LearningJourneyMap';
import { Button } from '@/components/ui/button';

// SAM Agentic Components
import { SpacedRepetitionCalendar, SpacedRepetitionWidget } from '@/components/sam/SpacedRepetitionCalendar';
import { ReviewQueueWidget } from './ReviewQueueWidget';

// SAM AI Components - Memory, Behavior, Recommendations, Plans
import { MemoryInsightsWidget } from '@/components/sam/memory';
import { BehaviorPatternsWidget, StruggleDetectionAlert, LearningStyleIndicator } from '@/components/sam/behavior';
import { DailyPlanWidget, PlanProgressTracker, PlanControlPanel } from '@/components/sam/plans';
import { RecommendationCard, RecommendationTimeline } from '@/components/sam/recommendations';

// SAM Confidence Components
import { ConfidenceIndicator } from '@/components/sam/confidence';

// SAM Quick Actions - useSAMActions hook integration (Safe wrapper handles missing SAMProvider)
import { SAMQuickActionsSafe } from '@/components/sam/SAMQuickActionsSafe';

// SAM Presence Components - Real-time learner awareness
import { ActiveLearnersWidget } from '@/components/sam/presence/ActiveLearnersWidget';
import { StudyStatusBadge } from '@/components/sam/presence/StudyStatusBadge';
import { StudyBuddyFinder } from '@/components/sam/StudyBuddyFinder';

// Hooks
import { useDailyAgenda } from '@/hooks/use-daily-agenda';
import { useLearningActivities } from '@/hooks/use-learning-activities';
import { useWeeklyTimeline } from '@/hooks/use-weekly-timeline';
import { useGanttTimeline } from '@/hooks/use-gantt-timeline';

// Types
import type { LearningActivity, LearningTask, DailyAgenda } from './types';

// Fallback demo data for when API is not available
import {
  generateDailyAgenda,
  generateWeeklyTimeline as generateDemoTimeline,
  getDemoActivities,
  getDemoTasks,
  getDemoGanttItems,
  getDemoGanttCourses,
  getDemoGanttSummary,
} from './demo-data';

// Types for Gantt
import type { LearningGanttItem } from './types';

interface LearningCommandCenterProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  /** Callback to open the study plan modal from parent */
  onCreateStudyPlan?: () => void;
}

export function LearningCommandCenter({ user, onCreateStudyPlan }: LearningCommandCenterProps) {
  // Router for navigation
  const router = useRouter();

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [localTasks, setLocalTasks] = useState<LearningTask[]>([]);
  const [useRealData, setUseRealData] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);


  // Track when component has mounted to prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Hooks for real data
  const {
    agenda,
    activities: apiActivities,
    tasks: apiTasks,
    streak,
    isLoading: isAgendaLoading,
    error: agendaError,
    refresh: refreshAgenda,
  } = useDailyAgenda(selectedDate);

  const {
    activities: allActivities,
    updateActivity,
    deleteActivity,
    createActivity,
    toggleComplete: toggleActivityComplete,
    refresh: refreshActivities,
  } = useLearningActivities({
    startDate: selectedDate,
    endDate: selectedDate,
  });

  const {
    timeline: apiTimeline,
    isLoading: isTimelineLoading,
    error: timelineError,
  } = useWeeklyTimeline({ weeks: 1 });

  const {
    items: ganttItems,
    courses: ganttCourses,
    summary: ganttSummary,
    isLoading: isGanttLoading,
    error: ganttError,
  } = useGanttTimeline({ weeks: 2 });

  // Determine which data to use (API or demo fallback)
  const userName = user.name?.split(' ')[0] || 'Learner';

  const effectiveAgenda = useMemo<DailyAgenda>(() => {
    if (agenda && useRealData && !agendaError) {
      return agenda;
    }
    return generateDailyAgenda(userName);
  }, [agenda, useRealData, agendaError, userName]);

  const effectiveActivities = useMemo<LearningActivity[]>(() => {
    if (apiActivities && apiActivities.length > 0 && useRealData && !agendaError) {
      return apiActivities;
    }
    return getDemoActivities();
  }, [apiActivities, useRealData, agendaError]);

  const effectiveTasks = useMemo<LearningTask[]>(() => {
    if (apiTasks && apiTasks.length > 0 && useRealData && !agendaError) {
      return apiTasks;
    }
    // Use local tasks if we have them, otherwise demo
    return localTasks.length > 0 ? localTasks : getDemoTasks();
  }, [apiTasks, useRealData, agendaError, localTasks]);

  const effectiveTimeline = useMemo(() => {
    if (apiTimeline && apiTimeline.length > 0 && useRealData && !timelineError) {
      return apiTimeline;
    }
    return generateDemoTimeline();
  }, [apiTimeline, useRealData, timelineError]);

  const effectiveGanttItems = useMemo(() => {
    if (ganttItems && ganttItems.length > 0 && useRealData && !ganttError) {
      return ganttItems;
    }
    return getDemoGanttItems();
  }, [ganttItems, useRealData, ganttError]);

  const effectiveGanttCourses = useMemo(() => {
    if (ganttCourses && ganttCourses.length > 0 && useRealData && !ganttError) {
      return ganttCourses;
    }
    return getDemoGanttCourses();
  }, [ganttCourses, useRealData, ganttError]);

  const effectiveGanttSummary = useMemo(() => {
    if (ganttSummary && useRealData && !ganttError) {
      return ganttSummary;
    }
    return getDemoGanttSummary();
  }, [ganttSummary, useRealData, ganttError]);

  // Handlers
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleActivityClick = useCallback((activity: LearningActivity) => {
    // Navigate to course or show activity details based on activity type
    if (activity.courseId && activity.chapterId) {
      router.push(`/courses/${activity.courseId}/learn/${activity.chapterId}`);
    } else if (activity.courseId) {
      router.push(`/courses/${activity.courseId}`);
    } else {
      // Show toast with activity details for activities without a course
      toast.info(`${activity.title}`, {
        description: activity.description || `${activity.type} - ${activity.status}`,
      });
    }
  }, [router]);

  const handleAddActivity = useCallback(async () => {
    // Navigate to planner tab where users can add activities
    router.push('/dashboard/user?tab=planner');
    toast.info('Open the planner to schedule new activities');
  }, [router]);

  const handleToggleActivityComplete = useCallback(async (activityId: string) => {
    if (useRealData) {
      await toggleActivityComplete(activityId);
      refreshAgenda();
    }
  }, [useRealData, toggleActivityComplete, refreshAgenda]);

  const handleToggleTaskComplete = useCallback(async (taskId: string) => {
    // Optimistic update - update local state immediately for responsive UI
    setLocalTasks((prev) => {
      const existing = prev.find((t) => t.id === taskId);
      if (existing) {
        return prev.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
      }
      // If not in local state, copy from effective tasks and toggle
      const fromEffective = effectiveTasks.find((t) => t.id === taskId);
      if (fromEffective) {
        return [...prev, { ...fromEffective, completed: !fromEffective.completed }];
      }
      return prev;
    });

    // API call to update task status
    try {
      const response = await fetch(`/api/dashboard/todos/${taskId}/toggle`, { method: 'PATCH' });
      if (!response.ok) {
        throw new Error('Failed to toggle task');
      }
      refreshAgenda();
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
      // Revert optimistic update on error
      setLocalTasks((prev) => prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
    }
  }, [effectiveTasks, refreshAgenda]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    // Store task for potential rollback
    const taskToDelete = localTasks.find((t) => t.id === taskId) ||
                         effectiveTasks.find((t) => t.id === taskId);

    // Optimistic update
    setLocalTasks((prev) => prev.filter((task) => task.id !== taskId));

    // API call to delete task
    try {
      const response = await fetch(`/api/dashboard/todos/${taskId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      toast.success('Task deleted');
      refreshAgenda();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      // Rollback on error
      if (taskToDelete) {
        setLocalTasks((prev) => [...prev, taskToDelete]);
      }
    }
  }, [localTasks, effectiveTasks, refreshAgenda]);

  const handleAddTask = useCallback(async (title: string) => {
    // Create temporary task for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newTask: LearningTask = {
      id: tempId,
      title,
      completed: false,
      priority: 'MEDIUM',
      tags: [],
    };
    setLocalTasks((prev) => [...prev, newTask]);

    // API call to create task
    try {
      const response = await fetch('/api/dashboard/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority: 'MEDIUM' }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const data = await response.json();
      // Replace temp task with real task from API
      setLocalTasks((prev) => prev.map((task) =>
        task.id === tempId ? { ...task, id: data.data?.id || task.id } : task
      ));
      toast.success('Task added');
      refreshAgenda();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to add task');
      // Remove temp task on error
      setLocalTasks((prev) => prev.filter((task) => task.id !== tempId));
    }
  }, [refreshAgenda]);

  const handleViewTimelineDetails = useCallback(() => {
    // Navigate to analytics page
    router.push('/dashboard/user?tab=analytics');
  }, [router]);

  const handleGanttItemClick = useCallback((item: LearningGanttItem) => {
    // Navigate to course or chapter based on item type
    if (item.chapterId && item.courseId) {
      router.push(`/courses/${item.courseId}/learn/${item.chapterId}`);
    } else if (item.courseId) {
      router.push(`/courses/${item.courseId}`);
    } else {
      toast.info(`${item.title}`, {
        description: `${item.status} - ${item.actualProgress}% complete`,
      });
    }
  }, [router]);

  const handleGanttViewDetails = useCallback(() => {
    // Navigate to full calendar/planner view
    router.push('/dashboard/user?tab=planner');
  }, [router]);


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
      },
    },
  };

  // Loading state - show skeleton placeholders that match the actual widget layout
  if (hasMounted && isAgendaLoading && useRealData) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/20">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          {/* Hero Section Skeleton */}
          <div className="rounded-xl bg-white dark:bg-slate-800 p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>

          {/* Main Grid Skeleton */}
          <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column Skeleton */}
            <div className="md:col-span-2 space-y-4 sm:space-y-6">
              {/* Today Schedule Skeleton */}
              <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Weekly Timeline Skeleton */}
              <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="grid grid-cols-7 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-lg" />
                  ))}
                </div>
              </div>

              {/* Gantt Chart Skeleton */}
              <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-4 sm:space-y-6">
              <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                <Skeleton className="h-6 w-28 mb-3" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/20">
      <motion.div
        className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section - Full Width */}
        <motion.div variants={itemVariants}>
          <DailyHeroSection
            agenda={effectiveAgenda}
            userName={userName}
            onDateChange={handleDateChange}
          />
        </motion.div>

        {/* Main Grid Layout */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Today&apos;s Schedule (2/3 width) */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 space-y-4 sm:space-y-6"
          >
            <TodaySchedule
              activities={effectiveActivities}
              onActivityClick={handleActivityClick}
              onAddActivity={handleAddActivity}
            />

            {/* Weekly Timeline - Below Schedule */}
            <WeeklyTimeline
              days={effectiveTimeline}
              onViewDetails={handleViewTimelineDetails}
            />

            {/* Learning Journey Gantt Chart */}
            <LearningGantt
              items={effectiveGanttItems}
              summary={effectiveGanttSummary}
              courses={effectiveGanttCourses}
              onItemClick={handleGanttItemClick}
              onViewDetails={handleGanttViewDetails}
            />

            {/* Learning Journey Map - Connected to SAM API */}
            <LearningJourneyMap user={user} />
          </motion.div>

          {/* Right Column - Tasks, Goals, Insights (1/3 width) */}
          <motion.div
            variants={itemVariants}
            className="space-y-4 sm:space-y-6"
          >
            {/* Study Status Badge - Shows current study status */}
            <div className="flex items-center justify-between">
              <StudyStatusBadge />
              <span className="text-xs text-slate-500 dark:text-slate-400">Your Status</span>
            </div>

            {/* Active Learners Widget - Social learning awareness */}
            <ActiveLearnersWidget
              compact={true}
              maxVisible={5}
              showBreakdown={false}
              refreshInterval={60000}
            />

            {/* Study Buddy Finder - Find compatible study partners */}
            <StudyBuddyFinder
              compact={true}
              limit={5}
              minCompatibility={30}
            />

            {/* Struggle Detection Alert - Shows when AI detects learning difficulties */}
            <StruggleDetectionAlert />

            {/* SAM Quick Actions - AI-powered learning assistance */}
            <SAMQuickActionsSafe
              variant="inline"
              categories={['learning', 'help', 'practice']}
              maxActions={6}
              showCategories={false}
            />

            {/* SAM Daily Plan Widget - Today's AI-Optimized Focus */}
            <DailyPlanWidget compact={true} />

            {/* Google Calendar Integration */}
            <CalendarStatusWidget />

            <TodayTasks
              tasks={effectiveTasks}
              onToggleComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
            />

            {/* Create Learning Plan Button */}
            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200/50 dark:border-purple-800/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                    Personalized Learning Plan
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    AI-powered weekly schedule
                  </p>
                </div>
                <Button
                  onClick={onCreateStudyPlan}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">Create Plan</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </div>
            </div>

            {/* SAM Spaced Repetition - Memory Optimization */}
            <ReviewQueueWidget />

            <JourneyProgress />

            <QuickInsights />

            {/* SAM Memory Insights - Contextual memory from past sessions */}
            <MemoryInsightsWidget compact={true} />

            {/* SAM Behavior Patterns - Learning style and pattern insights */}
            <BehaviorPatternsWidget compact={true} />

            {/* SAM Learning Style Indicator - VARK learning style detection */}
            <LearningStyleIndicator mode="card" />

            {/* SAM AI Recommendations - Personalized learning recommendations */}
            <RecommendationCard
              recommendation={{
                id: 'rec-1',
                type: 'content',
                title: 'Continue your learning',
                description: 'Based on your progress, here are personalized recommendations',
                priority: 'high',
                reason: 'Knowledge gap identified',
                estimatedMinutes: 20,
                metadata: {
                  confidence: 0.85,
                },
              }}
              onAction={() => console.log('Recommendation accepted')}
              onDismiss={() => console.log('Recommendation dismissed')}
            />

            {/* SAM Confidence Indicator - AI confidence level */}
            <ConfidenceIndicator
              confidence={0.82}
              mode="badge"
              showPercentage={true}
              showExplanation={true}
              explanation="SAM Confidence in recommendations"
            />
          </motion.div>
        </div>
      </motion.div>

    </div>
  );
}
