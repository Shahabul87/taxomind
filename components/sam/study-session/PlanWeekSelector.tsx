'use client';

/**
 * PlanWeekSelector Component
 *
 * Dropdown for selecting a study plan and tabs for selecting weeks.
 */

import React from 'react';
import { ChevronDown, BookOpen, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { StudyPlan } from './StudySessionScheduler';

interface PlanWeekSelectorProps {
  plans: StudyPlan[];
  selectedPlanId: string | null;
  onPlanChange: (planId: string) => void;
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  totalWeeks: number;
}

export function PlanWeekSelector({
  plans,
  selectedPlanId,
  onPlanChange,
  selectedWeek,
  onWeekChange,
  totalWeeks,
}: PlanWeekSelectorProps) {
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // Calculate completion for each week
  const getWeekCompletion = (weekNum: number) => {
    if (!selectedPlan) return { completed: 0, total: 0, percent: 0 };

    const weekTasks = selectedPlan.subGoals.filter(
      (sg) => sg.metadata?.weekNumber === weekNum
    );
    const completed = weekTasks.filter((t) => t.status === 'completed').length;
    const total = weekTasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percent };
  };

  // Find current week (first week with incomplete tasks)
  const getCurrentWeek = () => {
    if (!selectedPlan) return 1;

    for (let week = 1; week <= totalWeeks; week++) {
      const { percent } = getWeekCompletion(week);
      if (percent < 100) return week;
    }
    return totalWeeks;
  };

  const currentWeek = getCurrentWeek();

  return (
    <div className="space-y-4">
      {/* Plan Selector */}
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
          Select Study Plan
        </label>
        <Select value={selectedPlanId || ''} onValueChange={onPlanChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a study plan">
              {selectedPlan && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-500" />
                  <span className="truncate">{selectedPlan.title}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="z-[10000]">
            {plans.map((plan) => {
              const completedTasks = plan.subGoals.filter(
                (sg) => sg.status === 'completed'
              ).length;
              const totalTasks = plan.subGoals.length;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <SelectItem key={plan.id} value={plan.id}>
                  <div className="flex items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-500" />
                      <span className="truncate max-w-[200px]">{plan.title}</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {progress}% done
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Week Tabs */}
      {selectedPlan && totalWeeks > 0 && (
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            Select Week
          </label>
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => {
              const { percent, completed, total } = getWeekCompletion(weekNum);
              const isSelected = selectedWeek === weekNum;
              const isCurrent = currentWeek === weekNum;
              const isCompleted = percent === 100;

              return (
                <button
                  key={weekNum}
                  onClick={() => onWeekChange(weekNum)}
                  className={cn(
                    'relative flex flex-col items-center min-w-[70px] px-3 py-2 rounded-xl border-2 transition-all duration-200',
                    isSelected
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                      : 'border-transparent bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700',
                    isCurrent && !isSelected && 'ring-2 ring-teal-300 dark:ring-teal-700'
                  )}
                >
                  {/* Week Number */}
                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span
                        className={cn(
                          'text-xs font-bold',
                          isSelected
                            ? 'text-teal-700 dark:text-teal-300'
                            : 'text-slate-600 dark:text-slate-400'
                        )}
                      >
                        W{weekNum}
                      </span>
                    )}
                  </div>

                  {/* Progress indicator */}
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isCompleted
                          ? 'bg-emerald-500'
                          : percent > 0
                            ? 'bg-teal-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Task count */}
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {completed}/{total}
                  </span>

                  {/* Current week indicator */}
                  {isCurrent && !isCompleted && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanWeekSelector;
