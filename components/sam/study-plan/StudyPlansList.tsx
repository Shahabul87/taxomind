'use client';

/**
 * StudyPlansList Component
 *
 * Fetches and displays all AI-generated study plans for the current user.
 * Shows plans with metadata planType === 'study_plan'.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StudyPlanView } from './StudyPlanView';

// ============================================================================
// TYPES
// ============================================================================

interface StudyPlanSummary {
  id: string;
  title: string;
  status: string;
  progress: number;
  metadata?: {
    planType?: string;
    totalWeeks?: number;
    totalTasks?: number;
  };
}

interface StudyPlansListProps {
  className?: string;
  maxPlans?: number;
  onCreatePlan?: () => void;
  onTaskComplete?: (taskId: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudyPlansList({
  className,
  maxPlans = 5,
  onCreatePlan,
  onTaskComplete,
}: StudyPlansListProps) {
  const [plans, setPlans] = useState<StudyPlanSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if we have already fetched
  const fetchedRef = useRef(false);

  // Fetch study plans
  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/sam/agentic/goals');
      const result = await response.json();

      if (result.success && result.data?.goals) {
        // Filter for study plans only (goals with planType === 'study_plan')
        const studyPlans = (result.data.goals as StudyPlanSummary[]).filter(
          (goal) => goal.metadata?.planType === 'study_plan'
        );
        setPlans(studyPlans.slice(0, maxPlans));
      } else if (result.success && Array.isArray(result.data)) {
        // Fallback: handle if data is directly an array
        const studyPlans = (result.data as StudyPlanSummary[]).filter(
          (goal) => goal.metadata?.planType === 'study_plan'
        );
        setPlans(studyPlans.slice(0, maxPlans));
      } else {
        setError(result.error?.message || 'Failed to load study plans');
      }
    } catch (err) {
      console.error('Error fetching study plans:', err);
      setError('Failed to load study plans');
    } finally {
      setIsLoading(false);
    }
  }, [maxPlans]);

  // Initial fetch
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchPlans();
    }
  }, [fetchPlans]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Study Plans
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading your personalized study plans...
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
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
                onClick={fetchPlans}
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

  // Empty state
  if (plans.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Study Plans
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Personalized learning paths with daily tasks
              </p>
            </div>
          </div>
        </div>

        <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              No Study Plans Yet
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-sm mx-auto">
              Create an AI-powered study plan to get personalized daily tasks
              tailored to your learning goals and schedule.
            </p>
            {onCreatePlan && (
              <Button
                onClick={onCreatePlan}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Study Plan
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Plans list
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Study Plans
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {plans.length} active {plans.length === 1 ? 'plan' : 'plans'}
            </p>
          </div>
        </div>

        {onCreatePlan && (
          <Button
            onClick={onCreatePlan}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Plan
          </Button>
        )}
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <StudyPlanView
            key={plan.id}
            goalId={plan.id}
            defaultExpanded={plans.length === 1}
            onTaskComplete={onTaskComplete}
          />
        ))}
      </div>
    </div>
  );
}

export default StudyPlansList;
