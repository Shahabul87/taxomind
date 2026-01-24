'use client';

/**
 * CoursePlanCard Component
 *
 * Displays a single course creation plan with schedule info,
 * target date, and action buttons.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  Clock,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  Pause,
  Play,
  Rocket,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

type PlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type CourseType = 'VIDEO' | 'READING' | 'PRACTICE' | 'MIXED';

export interface CoursePlan {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  targetCompletionDate?: string | null;
  daysPerWeek: number;
  timePerSession: number;
  difficultyLevel: DifficultyLevel;
  courseType: CourseType;
  learningGoals?: string | null;
  studyReminders: boolean;
  progressCheckins: boolean;
  milestoneAlerts: boolean;
  syncToGoogleCalendar: boolean;
  status: PlanStatus;
  courseId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CoursePlanCardProps {
  plan: CoursePlan;
  onEdit?: (plan: CoursePlan) => void;
  onDelete?: (planId: string) => void;
  onStatusChange?: (planId: string, status: PlanStatus) => void;
  onStartBuilding?: (plan: CoursePlan) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const difficultyConfig: Record<DifficultyLevel, { label: string; color: string }> = {
  BEGINNER: { label: 'Beginner', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  INTERMEDIATE: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ADVANCED: { label: 'Advanced', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const courseTypeConfig: Record<CourseType, { label: string; color: string }> = {
  VIDEO: { label: 'Video', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  READING: { label: 'Reading', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  PRACTICE: { label: 'Practice', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  MIXED: { label: 'Mixed', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
};

const statusConfig: Record<PlanStatus, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Play },
  PAUSED: { label: 'Paused', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Pause },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archived', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', icon: AlertCircle },
};

function getDaysRemaining(targetDate: string | null | undefined): { days: number; label: string; urgent: boolean } {
  if (!targetDate) return { days: -1, label: 'No target date', urgent: false };

  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, label: `${Math.abs(diffDays)} days overdue`, urgent: true };
  } else if (diffDays === 0) {
    return { days: 0, label: 'Due today', urgent: true };
  } else if (diffDays === 1) {
    return { days: 1, label: '1 day remaining', urgent: true };
  } else if (diffDays <= 7) {
    return { days: diffDays, label: `${diffDays} days remaining`, urgent: true };
  } else {
    return { days: diffDays, label: `${diffDays} days remaining`, urgent: false };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CoursePlanCard({
  plan,
  onEdit,
  onDelete,
  onStatusChange,
  onStartBuilding,
  className,
}: CoursePlanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const difficulty = difficultyConfig[plan.difficultyLevel];
  const courseType = courseTypeConfig[plan.courseType];
  const status = statusConfig[plan.status];
  const StatusIcon = status.icon;
  const daysInfo = getDaysRemaining(plan.targetCompletionDate);

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(plan.id);
      toast.success('Course plan deleted');
    } catch {
      toast.error('Failed to delete plan');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleStatusToggle = () => {
    if (!onStatusChange) return;

    const newStatus: PlanStatus = plan.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    onStatusChange(plan.id, newStatus);
  };

  const handleComplete = () => {
    if (!onStatusChange) return;
    onStatusChange(plan.id, 'COMPLETED');
  };

  // Parse learning goals if they exist
  const learningGoalsList = plan.learningGoals
    ? plan.learningGoals.split('\n').filter((g) => g.trim())
    : [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('group', className)}
      >
        <Card className="border-2 border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-800 dark:to-amber-900/10 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50">
                  <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {plan.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className={cn('text-xs', courseType.color)}>
                      {courseType.label}
                    </Badge>
                    <Badge variant="secondary" className={cn('text-xs', difficulty.color)}>
                      {difficulty.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={cn('text-xs gap-1', status.color)}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(plan)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Plan
                      </DropdownMenuItem>
                    )}
                    {onStatusChange && plan.status !== 'COMPLETED' && (
                      <DropdownMenuItem onClick={handleStatusToggle}>
                        {plan.status === 'ACTIVE' ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause Plan
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Resume Plan
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    {onStatusChange && plan.status !== 'COMPLETED' && (
                      <DropdownMenuItem onClick={handleComplete}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark Completed
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Plan
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Description */}
            {plan.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                {plan.description}
              </p>
            )}

            {/* Schedule Info */}
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{plan.daysPerWeek} days/week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{plan.timePerSession} min/session</span>
              </div>
            </div>

            {/* Target Date */}
            {plan.targetCompletionDate && (
              <div className={cn(
                'flex items-center gap-1.5 text-sm mb-4',
                daysInfo.urgent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
              )}>
                <Target className="w-4 h-4" />
                <span>Target: {formatDate(plan.targetCompletionDate)}</span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className={cn(
                  daysInfo.days < 0 && 'text-red-600 dark:text-red-400',
                  daysInfo.days >= 0 && daysInfo.urgent && 'font-medium'
                )}>
                  {daysInfo.label}
                </span>
              </div>
            )}

            {/* Learning Goals */}
            {learningGoalsList.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Learning Goals
                </h4>
                <ul className="space-y-1">
                  {learningGoalsList.slice(0, 3).map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span className="line-clamp-1">{goal}</span>
                    </li>
                  ))}
                  {learningGoalsList.length > 3 && (
                    <li className="text-xs text-slate-500 dark:text-slate-400 ml-4">
                      +{learningGoalsList.length - 3} more goals
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Start Building Button */}
            {onStartBuilding && plan.status === 'ACTIVE' && !plan.courseId && (
              <Button
                onClick={() => onStartBuilding(plan)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Start Building Course
              </Button>
            )}

            {/* Course Link */}
            {plan.courseId && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Course created - View course</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{plan.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CoursePlanCard;
