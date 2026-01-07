'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  Flag,
  Loader2,
  MoreVertical,
  Pause,
  Play,
  Target,
  Trash2,
  BookOpen,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award,
  ListTodo,
  BarChart3,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { Goal } from '@/app/dashboard/user/goals/_components/GoalsClient';

interface GoalDetailSheetProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalUpdated: (goal: Goal) => void;
  onGoalDeleted: (goalId: string) => void;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-500', textColor: 'text-slate-600' },
  active: { label: 'Active', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  paused: { label: 'Paused', color: 'bg-amber-500', textColor: 'text-amber-600' },
  completed: { label: 'Completed', color: 'bg-blue-500', textColor: 'text-blue-600' },
  abandoned: { label: 'Abandoned', color: 'bg-red-500', textColor: 'text-red-600' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};

const masteryLabels: Record<string, { label: string; color: string }> = {
  novice: { label: 'Novice', color: 'bg-slate-100 text-slate-600' },
  beginner: { label: 'Beginner', color: 'bg-blue-100 text-blue-600' },
  intermediate: { label: 'Intermediate', color: 'bg-violet-100 text-violet-600' },
  advanced: { label: 'Advanced', color: 'bg-amber-100 text-amber-600' },
  expert: { label: 'Expert', color: 'bg-emerald-100 text-emerald-600' },
};

export function GoalDetailSheet({
  goal,
  open,
  onOpenChange,
  onGoalUpdated,
  onGoalDeleted,
}: GoalDetailSheetProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!goal) return null;

  const status = statusConfig[goal.status];
  const priority = priorityConfig[goal.priority];
  const completedSubGoals = goal.subGoals.filter((sg) => sg.status === 'completed').length;

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/sam/agentic/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const data = await response.json();
      if (data.success) {
        onGoalUpdated({ ...goal, status: newStatus as Goal['status'] });
        toast.success(`Goal ${newStatus === 'active' ? 'activated' : newStatus}`);
      }
    } catch (error) {
      toast.error('Failed to update goal status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sam/agentic/goals/${goal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete goal');

      onGoalDeleted(goal.id);
      toast.success('Goal deleted');
    } catch (error) {
      toast.error('Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <ScrollArea className="h-full">
          {/* Header with gradient */}
          <div className="relative overflow-hidden">
            <div
              className={cn(
                'absolute inset-0 opacity-90',
                goal.priority === 'critical' && 'bg-gradient-to-br from-red-500 to-rose-600',
                goal.priority === 'high' && 'bg-gradient-to-br from-orange-500 to-amber-600',
                goal.priority === 'medium' && 'bg-gradient-to-br from-violet-500 to-indigo-600',
                goal.priority === 'low' && 'bg-gradient-to-br from-slate-500 to-slate-600'
              )}
            />
            <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />

            <SheetHeader className="relative p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Target className="w-6 h-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                    {status.label}
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Goal
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {goal.status !== 'active' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                        <Play className="w-4 h-4 mr-2" />
                        Activate
                      </DropdownMenuItem>
                    )}
                    {goal.status === 'active' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('paused')}>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                    )}
                    {goal.status !== 'completed' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Complete
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Goal
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            your goal and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Delete'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <SheetTitle className="text-2xl font-bold text-white mt-4">
                {goal.title}
              </SheetTitle>
              {goal.description && (
                <SheetDescription className="text-white/80 mt-2">
                  {goal.description}
                </SheetDescription>
              )}

              {/* Progress bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Progress</span>
                  <span className="text-lg font-bold">{goal.progress}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <Flag className={cn('w-5 h-5 mx-auto mb-1', priority.color.split(' ')[1])} />
                <p className="text-xs text-slate-500 dark:text-slate-400">Priority</p>
                <p className="font-semibold text-slate-900 dark:text-white">{priority.label}</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <ListTodo className="w-5 h-5 mx-auto mb-1 text-violet-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Sub-goals</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {completedSubGoals}/{goal.subGoals.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {formatDistanceToNow(new Date(goal.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {/* Course */}
              {goal.course && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                  <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <div>
                    <p className="text-xs text-violet-600 dark:text-violet-400">Linked Course</p>
                    <p className="font-medium text-violet-900 dark:text-violet-100">
                      {goal.course.title}
                    </p>
                  </div>
                </div>
              )}

              {/* Target Date */}
              {goal.targetDate && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Target Date</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {format(new Date(goal.targetDate), 'PPPP')}
                    </p>
                  </div>
                </div>
              )}

              {/* Mastery Levels */}
              {(goal.currentMastery || goal.targetMastery) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-100 to-violet-50 dark:from-slate-800 dark:to-violet-900/20 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-violet-600" />
                    <span className="font-medium text-slate-900 dark:text-white">Mastery Journey</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {goal.currentMastery && (
                      <Badge className={masteryLabels[goal.currentMastery]?.color || 'bg-slate-100 text-slate-600'}>
                        {masteryLabels[goal.currentMastery]?.label || goal.currentMastery}
                      </Badge>
                    )}
                    {goal.currentMastery && goal.targetMastery && (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    {goal.targetMastery && (
                      <Badge className={cn(masteryLabels[goal.targetMastery]?.color || 'bg-violet-100 text-violet-600', 'ring-2 ring-violet-300 dark:ring-violet-700')}>
                        {masteryLabels[goal.targetMastery]?.label || goal.targetMastery}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs for Sub-goals and Plans */}
            <Tabs defaultValue="subgoals" className="w-full">
              <TabsList className="w-full grid grid-cols-2 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="subgoals" className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  Sub-goals
                  {goal.subGoals.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {goal.subGoals.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="plans" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Plans
                  {goal.plans.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {goal.plans.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subgoals" className="mt-4">
                {goal.subGoals.length === 0 ? (
                  <div className="text-center py-8">
                    <ListTodo className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No sub-goals yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Ask SAM to help break this goal into smaller tasks
                    </p>
                    <Button variant="outline" className="mt-4">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Sub-goals with AI
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {goal.subGoals.map((subGoal, index) => (
                      <motion.div
                        key={subGoal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          subGoal.status === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
                        )}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                            subGoal.status === 'completed'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700'
                          )}
                        >
                          {subGoal.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {subGoal.order}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'font-medium truncate',
                              subGoal.status === 'completed'
                                ? 'text-emerald-700 dark:text-emerald-400 line-through'
                                : 'text-slate-900 dark:text-white'
                            )}
                          >
                            {subGoal.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {subGoal.estimatedMinutes && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {subGoal.estimatedMinutes} min
                              </span>
                            )}
                            {subGoal.difficulty && (
                              <Badge variant="outline" className="text-xs">
                                {subGoal.difficulty}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="plans" className="mt-4">
                {goal.plans.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No execution plans yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Create a plan to track your progress
                    </p>
                    <Button variant="outline" className="mt-4">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create AI-Powered Plan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {goal.plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary">{plan.status}</Badge>
                          <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                            {plan.overallProgress}%
                          </span>
                        </div>
                        <Progress value={plan.overallProgress} className="h-2" />
                        {plan.targetDate && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Target: {format(new Date(plan.targetDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Tags */}
            {goal.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {goal.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Ask SAM for Help
              </Button>
              {goal.status === 'active' && (
                <Button variant="outline" className="w-full" onClick={() => handleStatusChange('completed')}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Completed
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
