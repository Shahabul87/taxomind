'use client';

/**
 * GoalPlanner Component
 * UI for managing learning goals with SAM Agentic AI
 *
 * Phase 5: Frontend Integration
 * - Create and manage learning goals
 * - Decompose goals into sub-goals
 * - Track progress towards goals
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Target,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit3,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  Pause,
  Play,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useAgentic,
  type Goal,
  type SubGoal,
  type CreateGoalData,
} from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface GoalPlannerProps {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  className?: string;
  compact?: boolean;
  maxGoals?: number;
  showCreateButton?: boolean;
  onGoalCreated?: (goal: Goal) => void;
  onGoalUpdated?: (goal: Goal) => void;
  onGoalDeleted?: (goalId: string) => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <Badge className={cn('text-xs', colors[priority] || colors.medium)}>
      {priority}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; icon: React.ReactNode }> = {
    draft: { color: 'bg-gray-100 text-gray-700', icon: <Circle className="w-3 h-3" /> },
    active: { color: 'bg-green-100 text-green-700', icon: <Play className="w-3 h-3" /> },
    paused: { color: 'bg-yellow-100 text-yellow-700', icon: <Pause className="w-3 h-3" /> },
    completed: { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    abandoned: { color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-3 h-3" /> },
  };

  const config = configs[status] || configs.draft;

  return (
    <Badge className={cn('text-xs flex items-center gap-1', config.color)}>
      {config.icon}
      {status}
    </Badge>
  );
}

function SubGoalItem({
  subGoal,
  onToggle,
}: {
  subGoal: SubGoal;
  onToggle?: (id: string, completed: boolean) => void;
}) {
  const isCompleted = subGoal.status === 'completed';

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-2 rounded-lg transition-colors',
        isCompleted ? 'bg-emerald-50 dark:bg-emerald-950' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
    >
      <button
        onClick={() => onToggle?.(subGoal.id, !isCompleted)}
        className="mt-0.5 flex-shrink-0"
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', isCompleted && 'line-through text-gray-500')}>
          {subGoal.title}
        </p>
        {subGoal.description && (
          <p className="text-xs text-gray-500 mt-0.5">{subGoal.description}</p>
        )}
        {subGoal.estimatedMinutes && (
          <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {subGoal.estimatedMinutes} min
          </span>
        )}
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onDecompose,
  isDecomposing,
}: {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onDecompose?: (goalId: string) => void;
  isDecomposing?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubGoals = goal.subGoals && goal.subGoals.length > 0;
  const completedSubGoals = goal.subGoals?.filter((sg) => sg.status === 'completed').length ?? 0;
  const totalSubGoals = goal.subGoals?.length ?? 0;
  const progress = totalSubGoals > 0 ? (completedSubGoals / totalSubGoals) * 100 : goal.progress;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-md">
      <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold truncate text-slate-900 dark:text-white">{goal.title}</CardTitle>
            {goal.description && (
              <CardDescription className="text-sm mt-2 line-clamp-2 text-slate-600 dark:text-slate-300">
                {goal.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!hasSubGoals && onDecompose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDecompose(goal.id)}
                disabled={isDecomposing}
                title="AI Decompose"
              >
                {isDecomposing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(goal)}>
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <StatusBadge status={goal.status} />
          <PriorityBadge priority={goal.priority} />
          {goal.targetDate && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(goal.targetDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Sub-goals Toggle */}
        {hasSubGoals && (
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {completedSubGoals}/{totalSubGoals} sub-goals completed
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                {goal.subGoals?.map((subGoal) => (
                  <SubGoalItem key={subGoal.id} subGoal={subGoal} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GoalPlanner({
  courseId,
  chapterId,
  sectionId,
  className,
  compact = false,
  maxGoals = 10,
  showCreateButton = true,
  onGoalCreated,
  onGoalUpdated,
  onGoalDeleted,
}: GoalPlannerProps) {
  const {
    goals,
    isLoadingGoals,
    fetchGoals,
    createGoal,
    updateGoal,
    decomposeGoal,
    deleteGoal,
    error,
    clearError,
  } = useAgentic({ autoFetchGoals: true });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [decomposingGoalId, setDecomposingGoalId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent hydration mismatch with Radix UI Dialog
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Form state
  const [formData, setFormData] = useState<CreateGoalData>({
    title: '',
    description: '',
    priority: 'medium',
    targetDate: '',
    courseId,
    chapterId,
    sectionId,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isCreateDialogOpen && !editingGoal) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        targetDate: '',
        courseId,
        chapterId,
        sectionId,
      });
    }
  }, [isCreateDialogOpen, editingGoal, courseId, chapterId, sectionId]);

  // Populate form when editing
  useEffect(() => {
    if (editingGoal) {
      setFormData({
        title: editingGoal.title,
        description: editingGoal.description || '',
        priority: editingGoal.priority,
        targetDate: editingGoal.targetDate || '',
        courseId: editingGoal.context.courseId,
        chapterId: editingGoal.context.chapterId,
        sectionId: editingGoal.context.sectionId,
      });
    }
  }, [editingGoal]);

  const handleSubmit = useCallback(async () => {
    if (!formData.title.trim()) return;

    setIsSubmitting(true);

    // Filter out empty targetDate to prevent API validation error
    const submitData: CreateGoalData = {
      ...formData,
      targetDate: formData.targetDate?.trim() || undefined,
    };

    try {
      if (editingGoal) {
        const updated = await updateGoal(editingGoal.id, submitData);
        if (updated) {
          onGoalUpdated?.(updated);
          setEditingGoal(null);
        }
      } else {
        const created = await createGoal(submitData);
        if (created) {
          onGoalCreated?.(created);
          setIsCreateDialogOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingGoal, createGoal, updateGoal, onGoalCreated, onGoalUpdated]);

  const handleDecompose = useCallback(async (goalId: string) => {
    setDecomposingGoalId(goalId);
    try {
      await decomposeGoal(goalId);
    } finally {
      setDecomposingGoalId(null);
    }
  }, [decomposeGoal]);

  const handleDelete = useCallback(async (goalId: string) => {
    const success = await deleteGoal(goalId);
    if (success) {
      onGoalDeleted?.(goalId);
    }
  }, [deleteGoal, onGoalDeleted]);

  // Filter goals by context if provided
  const filteredGoals = goals
    .filter((goal) => {
      if (courseId && goal.context.courseId !== courseId) return false;
      if (chapterId && goal.context.chapterId !== chapterId) return false;
      if (sectionId && goal.context.sectionId !== sectionId) return false;
      return true;
    })
    .slice(0, maxGoals);

  const activeGoals = filteredGoals.filter((g) => g.status === 'active');
  const completedGoals = filteredGoals.filter((g) => g.status === 'completed');

  // Form dialog content
  const FormContent = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Goal Title</label>
        <Input
          placeholder="e.g., Master React Hooks"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Description (optional)</label>
        <Textarea
          placeholder="Describe what you want to achieve..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Priority</label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              setFormData({ ...formData, priority: value as CreateGoalData['priority'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Target Date (optional)</label>
          <Input
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1">
            <Target className="w-4 h-4" />
            Goals ({activeGoals.length})
          </span>
          {showCreateButton && mounted && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Learning Goal</DialogTitle>
                  <DialogDescription>
                    Set a new learning goal. SAM will help you break it down and track progress.
                  </DialogDescription>
                </DialogHeader>
                {FormContent}
                <DialogFooter>
                  <Button onClick={handleSubmit} disabled={isSubmitting || !formData.title.trim()}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Goal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoadingGoals ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : activeGoals.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No active goals</p>
        ) : (
          <div className="space-y-2">
            {activeGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{goal.title}</span>
                  <PriorityBadge priority={goal.priority} />
                </div>
                <Progress value={goal.progress} className="h-1 mt-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
      <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              Learning Goals
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">
              {activeGoals.length} active, {completedGoals.length} completed
            </CardDescription>
          </div>

        {showCreateButton && mounted && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Learning Goal</DialogTitle>
                <DialogDescription>
                  Set a new learning goal. SAM will help you break it down and track progress.
                </DialogDescription>
              </DialogHeader>
              {FormContent}
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={isSubmitting || !formData.title.trim()}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center justify-between mb-4 border-2 border-red-200 dark:border-red-800">
            <span className="font-medium">{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              <AlertCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Goals List */}
        {isLoadingGoals ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600 dark:text-rose-400" />
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">No learning goals yet</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6">Create your first goal to start tracking your progress</p>
            {showCreateButton && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
              onEdit={setEditingGoal}
              onDelete={handleDelete}
              onDecompose={handleDecompose}
              isDecomposing={decomposingGoalId === goal.id}
            />
          ))}
        </div>
      )}
      </CardContent>

      {/* Edit Dialog */}
      {mounted && (
        <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
              <DialogDescription>Update your learning goal details.</DialogDescription>
            </DialogHeader>
            {FormContent}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingGoal(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !formData.title.trim()}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

export default GoalPlanner;
