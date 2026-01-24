'use client';

/**
 * CoursePlanCard Component
 *
 * A beautifully designed card for displaying course creation plans
 * with progress visualization, metrics, and modern UI styling.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Bell,
  BellOff,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  GraduationCap,
  Zap,
  TrendingUp,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
// CONFIGURATION
// ============================================================================

const difficultyConfig: Record<DifficultyLevel, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  BEGINNER: {
    label: 'Beginner',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    icon: Sparkles,
  },
  INTERMEDIATE: {
    label: 'Intermediate',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: TrendingUp,
  },
  ADVANCED: {
    label: 'Advanced',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    icon: Flame,
  },
};

const courseTypeConfig: Record<CourseType, { label: string; color: string; icon: React.ElementType }> = {
  VIDEO: { label: 'Video Course', color: 'text-rose-600 dark:text-rose-400', icon: Play },
  READING: { label: 'Reading', color: 'text-indigo-600 dark:text-indigo-400', icon: BookOpen },
  PRACTICE: { label: 'Hands-on', color: 'text-orange-600 dark:text-orange-400', icon: Zap },
  MIXED: { label: 'Mixed Content', color: 'text-slate-600 dark:text-slate-400', icon: GraduationCap },
};

const statusConfig: Record<PlanStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  ACTIVE: {
    label: 'Active',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
    dotColor: 'bg-emerald-500',
  },
  PAUSED: {
    label: 'Paused',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
    dotColor: 'bg-amber-500',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    dotColor: 'bg-blue-500',
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-800',
    dotColor: 'bg-slate-400',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDaysRemaining(targetDate: string | null | undefined): { days: number; label: string; urgent: boolean; progress: number } {
  if (!targetDate) return { days: -1, label: 'No target set', urgent: false, progress: 0 };

  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: diffDays, label: `${Math.abs(diffDays)}d overdue`, urgent: true, progress: 100 };
  } else if (diffDays === 0) {
    return { days: 0, label: 'Due today', urgent: true, progress: 95 };
  } else if (diffDays === 1) {
    return { days: 1, label: '1 day left', urgent: true, progress: 90 };
  } else if (diffDays <= 7) {
    return { days: diffDays, label: `${diffDays} days left`, urgent: true, progress: 80 };
  } else {
    return { days: diffDays, label: `${diffDays} days left`, urgent: false, progress: Math.min(70, (30 - diffDays) * 2) };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function calculateTotalHours(daysPerWeek: number, timePerSession: number, weeks: number): number {
  return Math.round((daysPerWeek * timePerSession * weeks) / 60);
}

function getWeeksBetween(startDate: string, endDate: string | null | undefined): number {
  if (!endDate) return 8; // Default 8 weeks
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
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
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const difficulty = difficultyConfig[plan.difficultyLevel];
  const courseType = courseTypeConfig[plan.courseType];
  const status = statusConfig[plan.status];
  const DifficultyIcon = difficulty.icon;
  const CourseTypeIcon = courseType.icon;
  const daysInfo = getDaysRemaining(plan.targetCompletionDate);
  const weeks = getWeeksBetween(plan.startDate, plan.targetCompletionDate);
  const totalHours = calculateTotalHours(plan.daysPerWeek, plan.timePerSession, weeks);

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

  // Navigate to course creator with pre-filled title
  const handleStartBuildingClick = () => {
    // Navigate to course creator with the plan title as URL param
    const encodedTitle = encodeURIComponent(plan.title);
    router.push(`/teacher/create?title=${encodedTitle}`);

    // Also call the optional callback if provided
    if (onStartBuilding) {
      onStartBuilding(plan);
    }
  };

  // Parse learning goals
  const learningGoalsList = plan.learningGoals
    ? plan.learningGoals.split('\n').filter((g) => g.trim())
    : [];

  // Check notification settings
  const hasNotifications = plan.studyReminders || plan.progressCheckins || plan.milestoneAlerts;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('group', className)}
      >
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900">
          {/* Gradient Header */}
          <div className="relative h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

          <CardContent className="p-0">
            {/* Top Section */}
            <div className="p-5 pb-4">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                {/* Icon & Title */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center shadow-sm">
                      <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    {plan.status === 'ACTIVE' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1 truncate">
                      {plan.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badge */}
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                        status.bgColor, status.color
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', status.dotColor)} />
                        {status.label}
                      </span>
                      {/* Course Type */}
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium', courseType.color)}>
                        <CourseTypeIcon className="w-3 h-3" />
                        {courseType.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Notification Indicators */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={cn(
                          'p-1.5 rounded-lg',
                          hasNotifications ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'
                        )}>
                          {hasNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {hasNotifications ? 'Notifications enabled' : 'Notifications off'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {plan.syncToGoogleCalendar && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1.5 rounded-lg text-blue-500">
                            <CalendarCheck className="w-4 h-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Synced to Google Calendar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
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
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                  {plan.description}
                </p>
              )}

              {/* Metrics Dashboard */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {/* Schedule */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{plan.daysPerWeek}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">days/week</div>
                </div>
                {/* Duration */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <Clock className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{plan.timePerSession}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">min/session</div>
                </div>
                {/* Total Hours */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <Flame className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{totalHours}h</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">total</div>
                </div>
                {/* Difficulty */}
                <div className={cn('rounded-xl p-3 text-center border', difficulty.bgColor)}>
                  <DifficultyIcon className={cn('w-4 h-4 mx-auto mb-1', difficulty.color)} />
                  <div className={cn('text-sm font-bold', difficulty.color)}>{difficulty.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">level</div>
                </div>
              </div>

              {/* Timeline Section */}
              {plan.targetCompletionDate && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Timeline</span>
                    </div>
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      daysInfo.urgent
                        ? daysInfo.days < 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    )}>
                      {daysInfo.label}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="relative mb-3">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(5, daysInfo.progress)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn(
                          'h-full rounded-full',
                          daysInfo.days < 0
                            ? 'bg-gradient-to-r from-red-400 to-red-500'
                            : 'bg-gradient-to-r from-amber-400 to-orange-500'
                        )}
                      />
                    </div>
                    {/* Progress Marker */}
                    <motion.div
                      initial={{ left: 0 }}
                      animate={{ left: `${Math.max(2, Math.min(98, daysInfo.progress))}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                    >
                      <div className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 shadow-md border-2 border-amber-500 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                      </div>
                    </motion.div>
                  </div>
                  {/* Date Labels */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Start: </span>
                      {formatShortDate(plan.startDate)}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Target: </span>
                      {formatShortDate(plan.targetCompletionDate)}
                    </div>
                  </div>
                </div>
              )}

              {/* Expandable Learning Goals */}
              {learningGoalsList.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full text-left group/expand"
                  >
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Learning Goals ({learningGoalsList.length})
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover/expand:text-slate-600" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-3 space-y-2">
                          {learningGoalsList.map((goal, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                            >
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex-shrink-0" />
                              <span>{goal}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isExpanded && learningGoalsList.length > 0 && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                      {learningGoalsList[0]}
                      {learningGoalsList.length > 1 && (
                        <span className="text-amber-500"> +{learningGoalsList.length - 1} more</span>
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-100 dark:border-slate-800">
              {/* Course Link if exists */}
              {plan.courseId && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Course Created</span>
                  </div>
                  <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100">
                    View Course
                  </Button>
                </div>
              )}

              {/* Start Building Button */}
              {plan.status === 'ACTIVE' && !plan.courseId && (
                <div className="p-4">
                  <Button
                    onClick={handleStartBuildingClick}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-semibold text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300"
                  >
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Building Course
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Paused State */}
              {plan.status === 'PAUSED' && !plan.courseId && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Pause className="w-5 h-5" />
                      <span className="font-medium">Plan Paused</span>
                    </div>
                    {onStatusChange && (
                      <Button
                        onClick={() => onStatusChange(plan.id, 'ACTIVE')}
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Completed State */}
              {plan.status === 'COMPLETED' && !plan.courseId && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Plan Completed</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              Delete Course Plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">&quot;{plan.title}&quot;</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {isDeleting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  Deleting...
                </>
              ) : (
                'Delete Plan'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CoursePlanCard;
