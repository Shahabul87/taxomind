'use client';

/**
 * BlogPlansList Component
 *
 * Fetches and displays all blog content plans for the current user.
 * Shows plans for content creation and publishing schedules.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
  PenTool,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BlogPlanCard, type BlogPlan } from './BlogPlanCard';

// ============================================================================
// TYPES
// ============================================================================

type PlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

interface BlogPlansListProps {
  className?: string;
  maxPlans?: number;
  onCreatePlan?: () => void;
  refreshKey?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BlogPlansList({
  className,
  maxPlans = 10,
  onCreatePlan,
  refreshKey = 0,
}: BlogPlansListProps) {
  const [plans, setPlans] = useState<BlogPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track if we have already fetched
  const fetchedRef = useRef(false);

  // Fetch blog plans
  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/blog-plans');
      const result = await response.json();

      if (result.success && result.data) {
        // Filter for active/paused plans only, completed can be shown differently
        const activePlans = (result.data as BlogPlan[]).filter(
          (plan) => plan.status !== 'ARCHIVED'
        );
        setPlans(activePlans.slice(0, maxPlans));
      } else {
        setError(result.error?.message || 'Failed to load blog plans');
      }
    } catch (err) {
      console.error('Error fetching blog plans:', err);
      setError('Failed to load blog plans');
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
      const response = await fetch(`/api/dashboard/blog-plans/${planId}`, {
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
      const response = await fetch(`/api/dashboard/blog-plans/${planId}`, {
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

  // Handle start writing - navigate to blog creation
  const handleStartWriting = (plan: BlogPlan) => {
    // Navigation is handled in the BlogPlanCard component
    toast.info(`Starting content creation for "${plan.title}"`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Blog Content Plans
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Loading your blog plans...
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
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
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Blog Content Plans
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Plan and organize your content creation journey
              </p>
            </div>
          </div>
        </div>

        <Card className="border-dashed border-2 border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 flex items-center justify-center mb-3 sm:mb-4">
              <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
              No Blog Plans Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 max-w-sm mx-auto">
              Planning to start a blog? Create a content plan to organize your topics,
              schedule, and publishing goals.
            </p>
            {onCreatePlan && (
              <Button
                onClick={onCreatePlan}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-xs sm:text-sm"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Create Blog Plan
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Blog Content Plans
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
            </p>
          </div>
        </div>

        {onCreatePlan && (
          <Button
            onClick={onCreatePlan}
            size="sm"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-xs sm:text-sm"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            New Plan
          </Button>
        )}
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <BlogPlanCard
            key={plan.id}
            plan={plan}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onStartWriting={handleStartWriting}
          />
        ))}
      </div>
    </div>
  );
}

export default BlogPlansList;
