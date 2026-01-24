'use client';

/**
 * CoursePlansList Component
 *
 * Fetches and displays all course creation plans for the current user.
 * Shows plans for building/creating new courses.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CoursePlanCard, type CoursePlan } from './CoursePlanCard';

// ============================================================================
// TYPES
// ============================================================================

type PlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

interface CoursePlansListProps {
  className?: string;
  maxPlans?: number;
  onCreatePlan?: () => void;
  refreshKey?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CoursePlansList({
  className,
  maxPlans = 10,
  onCreatePlan,
  refreshKey = 0,
}: CoursePlansListProps) {
  const [plans, setPlans] = useState<CoursePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if we have already fetched
  const fetchedRef = useRef(false);

  // Fetch course plans
  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/course-plans');
      const result = await response.json();

      if (result.success && result.data) {
        // Filter for active/paused plans only, completed can be shown differently
        const activePlans = (result.data as CoursePlan[]).filter(
          (plan) => plan.status !== 'ARCHIVED'
        );
        setPlans(activePlans.slice(0, maxPlans));
      } else {
        setError(result.error?.message || 'Failed to load course plans');
      }
    } catch (err) {
      console.error('Error fetching course plans:', err);
      setError('Failed to load course plans');
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

  // Refetch when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      fetchPlans();
    }
  }, [refreshKey, fetchPlans]);

  // Handle status change
  const handleStatusChange = async (planId: string, status: PlanStatus) => {
    try {
      const response = await fetch(`/api/dashboard/course-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        setPlans((prev) =>
          prev.map((plan) =>
            plan.id === planId ? { ...plan, status } : plan
          )
        );
        toast.success(`Plan ${status.toLowerCase()}`);
      } else {
        toast.error(result.error?.message || 'Failed to update plan');
      }
    } catch {
      toast.error('Failed to update plan');
    }
  };

  // Handle delete
  const handleDelete = async (planId: string) => {
    try {
      const response = await fetch(`/api/dashboard/course-plans/${planId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setPlans((prev) => prev.filter((plan) => plan.id !== planId));
      } else {
        throw new Error(result.error?.message || 'Failed to delete plan');
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle start building - navigate to course creation
  const handleStartBuilding = (plan: CoursePlan) => {
    // Navigate to course creation with pre-filled data
    // For now, just show a toast - can be enhanced later
    toast.info(`Starting course creation for "${plan.title}"`, {
      description: 'Course creation wizard coming soon!',
    });
    // Future: router.push(`/dashboard/teacher/courses/create?planId=${plan.id}`)
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Course Creation Plans
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading your course plans...
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Course Creation Plans
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Plan and organize your course creation journey
              </p>
            </div>
          </div>
        </div>

        <Card className="border-dashed border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 flex items-center justify-center mb-4">
              <Lightbulb className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              No Course Plans Yet
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 max-w-sm mx-auto">
              Planning to create a course? Start by outlining your course idea,
              schedule, and learning goals to stay organized.
            </p>
            {onCreatePlan && (
              <Button
                onClick={onCreatePlan}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Course Plan
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
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Course Creation Plans
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
            </p>
          </div>
        </div>

        {onCreatePlan && (
          <Button
            onClick={onCreatePlan}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Plan
          </Button>
        )}
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <CoursePlanCard
            key={plan.id}
            plan={plan}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onStartBuilding={handleStartBuilding}
          />
        ))}
      </div>
    </div>
  );
}

export default CoursePlansList;
