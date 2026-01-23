'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useUnifiedDashboardContext, type Goal } from '@/lib/contexts/unified-dashboard-context';

export type GoalStatus = 'draft' | 'active' | 'paused' | 'completed' | 'abandoned';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface CreateGoalInput {
  title: string;
  description?: string;
  targetDate?: string;
  priority?: GoalPriority;
  courseId?: string;
  tags?: string[];
  milestones?: Array<{ title: string; targetDate: Date }>;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: GoalStatus;
  priority?: GoalPriority;
  targetDate?: string;
  progress?: number;
  tags?: string[];
}

export interface GoalFilters {
  status?: GoalStatus;
  priority?: GoalPriority;
  courseId?: string;
}

/**
 * Hook for managing goals in the unified dashboard
 *
 * This hook provides:
 * - Goals list with pagination
 * - CRUD operations for goals
 * - Filtering and sorting
 * - Computed stats
 *
 * @example
 * ```tsx
 * const { goals, createGoal, isLoading, loadMore } = useUnifiedGoals();
 *
 * const handleCreate = async () => {
 *   await createGoal({ title: 'Learn React', priority: 'high' });
 * };
 *
 * return (
 *   <div>
 *     {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
 *     {hasMore && <button onClick={loadMore}>Load More</button>}
 *   </div>
 * );
 * ```
 */
export function useUnifiedGoals(filters?: GoalFilters) {
  const context = useUnifiedDashboardContext();
  const {
    state,
    fetchGoals,
    createGoal: createGoalAction,
    updateGoal: updateGoalAction,
    deleteGoal: deleteGoalAction,
  } = context;

  const initialFetchRef = useRef(false);
  const filtersRef = useRef(filters);

  // Fetch goals on mount or when filters change
  useEffect(() => {
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current);

    if (!initialFetchRef.current || filtersChanged) {
      initialFetchRef.current = true;
      filtersRef.current = filters;
      fetchGoals({ reset: true, status: filters?.status });
    }
  }, [fetchGoals, filters]);

  // Load more goals (pagination)
  const loadMore = useCallback(() => {
    if (state.goalsPagination.hasMore && !state.loadingStates.goals) {
      fetchGoals({
        page: state.goalsPagination.page + 1,
        status: filters?.status,
      });
    }
  }, [fetchGoals, filters?.status, state.goalsPagination, state.loadingStates.goals]);

  // Create goal
  const createGoal = useCallback(
    async (input: CreateGoalInput): Promise<Goal | null> => {
      return createGoalAction(input as Partial<Goal>);
    },
    [createGoalAction]
  );

  // Update goal
  const updateGoal = useCallback(
    async (id: string, input: UpdateGoalInput): Promise<Goal | null> => {
      return updateGoalAction(id, input as Partial<Goal>);
    },
    [updateGoalAction]
  );

  // Delete goal
  const deleteGoal = useCallback(
    async (id: string): Promise<boolean> => {
      return deleteGoalAction(id);
    },
    [deleteGoalAction]
  );

  // Filter goals client-side for additional filtering
  const filteredGoals = useMemo(() => {
    let goals = state.goals;

    if (filters?.priority) {
      goals = goals.filter((g) => g.priority === filters.priority);
    }

    if (filters?.courseId) {
      goals = goals.filter((g) => g.courseId === filters.courseId);
    }

    return goals;
  }, [state.goals, filters]);

  // Computed stats
  const stats = useMemo(() => {
    const all = state.goals;
    return {
      total: all.length,
      active: all.filter((g) => g.status === 'active').length,
      completed: all.filter((g) => g.status === 'completed').length,
      paused: all.filter((g) => g.status === 'paused').length,
      draft: all.filter((g) => g.status === 'draft').length,
      abandoned: all.filter((g) => g.status === 'abandoned').length,
      highPriority: all.filter((g) => g.priority === 'high' || g.priority === 'critical').length,
      avgProgress: all.length > 0
        ? Math.round(all.reduce((sum, g) => sum + (g.progress ?? 0), 0) / all.length)
        : 0,
    };
  }, [state.goals]);

  // Goals grouped by status
  const goalsByStatus = useMemo(() => {
    const grouped: Record<GoalStatus, Goal[]> = {
      draft: [],
      active: [],
      paused: [],
      completed: [],
      abandoned: [],
    };

    for (const goal of state.goals) {
      grouped[goal.status].push(goal);
    }

    return grouped;
  }, [state.goals]);

  return {
    // Goals data
    goals: filteredGoals,
    goalsByStatus,

    // Pagination
    pagination: state.goalsPagination,
    hasMore: state.goalsPagination.hasMore,
    loadMore,

    // Loading and errors
    isLoading: state.loadingStates.goals,
    error: state.errors.goals,

    // Actions
    createGoal,
    updateGoal,
    deleteGoal,
    refreshGoals: () => fetchGoals({ reset: true, status: filters?.status }),

    // Stats
    stats,
  };
}

/**
 * Hook for accessing a single goal by ID
 */
export function useGoal(goalId: string) {
  const { goals, updateGoal, deleteGoal, isLoading } = useUnifiedGoals();

  const goal = useMemo(
    () => goals.find((g) => g.id === goalId) ?? null,
    [goals, goalId]
  );

  const update = useCallback(
    (input: UpdateGoalInput) => updateGoal(goalId, input),
    [goalId, updateGoal]
  );

  const remove = useCallback(() => deleteGoal(goalId), [goalId, deleteGoal]);

  return {
    goal,
    isLoading,
    update,
    delete: remove,
  };
}

/**
 * Hook for active goals only
 */
export function useActiveGoals() {
  return useUnifiedGoals({ status: 'active' });
}

/**
 * Hook for goals related to a specific course
 */
export function useCourseGoals(courseId: string) {
  return useUnifiedGoals({ courseId });
}
