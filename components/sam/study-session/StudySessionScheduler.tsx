'use client';

/**
 * StudySessionScheduler Component
 *
 * Smart session scheduling that connects with Study Plans.
 * Users can select a plan, pick a week, view tasks, and schedule sessions.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CalendarClock,
  Loader2,
  AlertCircle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlanWeekSelector } from './PlanWeekSelector';
import { WeekTaskList } from './WeekTaskList';
import { TaskScheduleModal } from './TaskScheduleModal';
import { ScheduledSessionsList } from './ScheduledSessionsList';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface StudyPlan {
  id: string;
  title: string;
  description?: string;
  status: string;
  targetDate?: string;
  metadata?: {
    planType?: string;
    totalWeeks?: number;
    totalTasks?: number;
    estimatedHours?: number;
    preferences?: {
      startDate?: string;
      targetEndDate?: string;
    };
  };
  subGoals: SubGoal[];
  course?: {
    id: string;
    title: string;
  } | null;
}

export interface SubGoal {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  order: number;
  status: string;
  type: string;
  estimatedMinutes: number;
  difficulty: string;
  completedAt?: string | null;
  metadata?: {
    weekNumber?: number;
    weekTitle?: string;
    dayNumber?: number;
    scheduledDate?: string;
    taskType?: string;
  };
}

export interface ScheduledSession {
  id: string;
  title: string;
  notes?: string;
  startTime: string;
  duration: number;
  subGoalId?: string;
  // Push notification settings
  notifyEnabled?: boolean;
  notifyMinutesBefore?: number;
  notificationSentAt?: string | null;
}

interface StudySessionSchedulerProps {
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudySessionScheduler({ className }: StudySessionSchedulerProps) {
  // State
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<SubGoal | null>(null);

  // Ref to track initial fetch
  const fetchedRef = useRef(false);

  // Fetch study plans
  const fetchStudyPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch goals with status=active
      const response = await fetch('/api/sam/agentic/goals?status=active&limit=50');
      const result = await response.json();

      if (result.success && result.data?.goals) {
        // Filter for study plans only (metadata.planType === 'study_plan')
        const plans = result.data.goals.filter(
          (goal: StudyPlan) => goal.metadata?.planType === 'study_plan'
        );
        setStudyPlans(plans);

        // Auto-select first plan if available
        if (plans.length > 0 && !selectedPlanId) {
          setSelectedPlanId(plans[0].id);
        }
      } else {
        setError(result.error || 'Failed to load study plans');
      }
    } catch (err) {
      console.error('Error fetching study plans:', err);
      setError('Failed to load study plans');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlanId]);

  // Fetch scheduled sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/sessions?upcoming=true&limit=10');
      const result = await response.json();

      if (result.success && result.data) {
        setSessions(result.data);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchStudyPlans();
      fetchSessions();
    }
  }, [fetchStudyPlans, fetchSessions]);

  // Get selected plan
  const selectedPlan = studyPlans.find((p) => p.id === selectedPlanId);

  // Get tasks for selected week
  const weekTasks = selectedPlan?.subGoals.filter(
    (sg) => sg.metadata?.weekNumber === selectedWeek
  ) || [];

  // Get total weeks from plan
  const totalWeeks = selectedPlan?.metadata?.totalWeeks ||
    Math.max(...(selectedPlan?.subGoals.map((sg) => sg.metadata?.weekNumber || 1) || [1]));

  // Handle schedule task click
  const handleScheduleTask = (task: SubGoal) => {
    setSelectedTask(task);
    setScheduleModalOpen(true);
  };

  // Handle session created
  const handleSessionCreated = async (sessionData: {
    title: string;
    notes?: string;
    date: Date;
    startTime: string;
    duration: number;
    subGoalId?: string;
    syncToGoogleCalendar: boolean;
  }) => {
    try {
      // Combine date and time
      const [hours, minutes] = sessionData.startTime.split(':').map(Number);
      const startDateTime = new Date(sessionData.date);
      startDateTime.setHours(hours, minutes, 0, 0);

      const response = await fetch('/api/dashboard/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sessionData.title,
          notes: sessionData.notes,
          startTime: startDateTime.toISOString(),
          duration: sessionData.duration,
          subGoalId: sessionData.subGoalId,
          syncToGoogleCalendar: sessionData.syncToGoogleCalendar,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Session scheduled successfully!');
        setScheduleModalOpen(false);
        setSelectedTask(null);
        // Refresh sessions list
        fetchSessions();
      } else {
        toast.error(result.error?.message || 'Failed to schedule session');
      }
    } catch (err) {
      console.error('Error scheduling session:', err);
      toast.error('Failed to schedule session');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50">
              <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Schedule Study Sessions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Loading your study plans...
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchedRef.current = false;
                  fetchStudyPlans();
                }}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state - no study plans
  if (studyPlans.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50">
              <CalendarClock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Schedule Study Sessions
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Plan focused study time from your tasks
              </p>
            </div>
          </div>
        </div>

        <Card className="border-dashed border-2 border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/10">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50 flex items-center justify-center mb-3 sm:mb-4">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
              No Study Plans Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 max-w-sm mx-auto">
              Create a study plan first to schedule focused study sessions for specific tasks.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main content
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/50 dark:to-emerald-900/50">
            <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Schedule Study Sessions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {studyPlans.length} active {studyPlans.length === 1 ? 'plan' : 'plans'}
            </p>
          </div>
        </div>
      </div>

      {/* Plan & Week Selector */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
        <CardContent className="p-3 sm:p-4">
          <PlanWeekSelector
            plans={studyPlans}
            selectedPlanId={selectedPlanId}
            onPlanChange={setSelectedPlanId}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            totalWeeks={totalWeeks}
          />
        </CardContent>
      </Card>

      {/* Week Tasks */}
      {selectedPlan && (
        <WeekTaskList
          tasks={weekTasks}
          weekNumber={selectedWeek}
          planTitle={selectedPlan.title}
          onScheduleTask={handleScheduleTask}
        />
      )}

      {/* Scheduled Sessions */}
      {sessions.length > 0 && (
        <ScheduledSessionsList
          sessions={sessions}
          onSessionUpdate={(updatedSession) => {
            setSessions((prev) =>
              prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
            );
          }}
        />
      )}

      {/* Schedule Modal */}
      <TaskScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        planTitle={selectedPlan?.title}
        onSchedule={handleSessionCreated}
      />
    </div>
  );
}

export default StudySessionScheduler;
