'use client';

/**
 * BlogPlanCard Component
 *
 * A beautifully designed card for displaying blog content plans
 * with schedule visualization, metrics, and modern UI styling.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Calendar,
  Clock,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  Pause,
  Play,
  PenTool,
  CheckCircle2,
  Bell,
  BellOff,
  CalendarCheck,
  ChevronDown,
  Sparkles,
  Users,
  Globe,
  Hash,
  Lightbulb,
  TrendingUp,
  BookOpen,
  Share2,
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
type PostFrequency = 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';
type ContentGoal = 'KNOWLEDGE_SHARING' | 'AUDIENCE_BUILDING' | 'THOUGHT_LEADERSHIP' | 'MONETIZATION' | 'PORTFOLIO';

export interface BlogPlan {
  id: string;
  title: string;
  description?: string | null;
  topics: string[];
  startPublishingDate: string;
  postFrequency: PostFrequency;
  specificDays?: string | null;
  platform?: string | null;
  targetAudience?: string | null;
  contentGoal: ContentGoal;
  writingReminders: boolean;
  publishingReminders: boolean;
  deadlineAlerts: boolean;
  syncToGoogleCalendar: boolean;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

interface BlogPlanCardProps {
  plan: BlogPlan;
  onEdit?: (plan: BlogPlan) => void;
  onDelete?: (planId: string) => void;
  onStatusChange?: (planId: string, status: PlanStatus) => void;
  onStartWriting?: (plan: BlogPlan) => void;
  className?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const frequencyConfig: Record<PostFrequency, { label: string; color: string; icon: React.ElementType }> = {
  DAILY: { label: 'Daily', color: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
  WEEKLY: { label: 'Weekly', color: 'text-blue-600 dark:text-blue-400', icon: Calendar },
  BI_WEEKLY: { label: 'Bi-Weekly', color: 'text-violet-600 dark:text-violet-400', icon: Calendar },
  MONTHLY: { label: 'Monthly', color: 'text-amber-600 dark:text-amber-400', icon: Calendar },
};

const contentGoalConfig: Record<ContentGoal, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  KNOWLEDGE_SHARING: {
    label: 'Knowledge Sharing',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: Lightbulb,
  },
  AUDIENCE_BUILDING: {
    label: 'Audience Building',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    icon: Users,
  },
  THOUGHT_LEADERSHIP: {
    label: 'Thought Leadership',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    icon: Sparkles,
  },
  MONETIZATION: {
    label: 'Monetization',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    icon: TrendingUp,
  },
  PORTFOLIO: {
    label: 'Portfolio',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
    icon: BookOpen,
  },
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

function getDaysUntilStart(startDate: string): { days: number; label: string; started: boolean } {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = start.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), label: `Started ${Math.abs(diffDays)}d ago`, started: true };
  } else if (diffDays === 0) {
    return { days: 0, label: 'Starts today', started: false };
  } else if (diffDays === 1) {
    return { days: 1, label: 'Starts tomorrow', started: false };
  } else {
    return { days: diffDays, label: `Starts in ${diffDays} days`, started: false };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getPostsPerMonth(frequency: PostFrequency): number {
  switch (frequency) {
    case 'DAILY': return 30;
    case 'WEEKLY': return 4;
    case 'BI_WEEKLY': return 2;
    case 'MONTHLY': return 1;
    default: return 4;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BlogPlanCard({
  plan,
  onEdit,
  onDelete,
  onStatusChange,
  onStartWriting,
  className,
}: BlogPlanCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const frequency = frequencyConfig[plan.postFrequency];
  const contentGoal = contentGoalConfig[plan.contentGoal];
  const status = statusConfig[plan.status];
  const ContentGoalIcon = contentGoal.icon;
  const startInfo = getDaysUntilStart(plan.startPublishingDate);
  const postsPerMonth = getPostsPerMonth(plan.postFrequency);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(plan.id);
      toast.success('Blog plan deleted');
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

  // Navigate to blog post creator with pre-filled title
  const handleStartWritingClick = () => {
    // Navigate to blog post creator with the plan title as URL param
    const encodedTitle = encodeURIComponent(plan.title);
    router.push(`/dashboard/user/blog/create?planId=${plan.id}&title=${encodedTitle}`);

    // Also call the optional callback if provided
    if (onStartWriting) {
      onStartWriting(plan);
    }
  };

  // Check notification settings
  const hasNotifications = plan.writingReminders || plan.publishingReminders || plan.deadlineAlerts;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('group', className)}
      >
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900">
          {/* Gradient Header - Blue/Cyan for Blog */}
          <div className="relative h-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400" />

          <CardContent className="p-0">
            {/* Top Section */}
            <div className="p-5 pb-4">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                {/* Icon & Title */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 flex items-center justify-center shadow-sm">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                      {/* Frequency */}
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium', frequency.color)}>
                        <Calendar className="w-3 h-3" />
                        {frequency.label}
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
                          hasNotifications ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'
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

              {/* Topics */}
              {plan.topics && plan.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {plan.topics.slice(0, 5).map((topic, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    >
                      <Hash className="w-3 h-3 mr-1" />
                      {topic}
                    </Badge>
                  ))}
                  {plan.topics.length > 5 && (
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      +{plan.topics.length - 5} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Metrics Dashboard */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {/* Frequency */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{postsPerMonth}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">posts/month</div>
                </div>
                {/* Content Goal */}
                <div className={cn('rounded-xl p-3 text-center border', contentGoal.bgColor)}>
                  <ContentGoalIcon className={cn('w-4 h-4 mx-auto mb-1', contentGoal.color)} />
                  <div className={cn('text-xs font-bold truncate', contentGoal.color)}>{contentGoal.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">goal</div>
                </div>
                {/* Platform */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                  <Globe className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {plan.platform || 'Any'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">platform</div>
                </div>
              </div>

              {/* Start Date Section */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      First Post: {formatDate(plan.startPublishingDate)}
                    </span>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    startInfo.started
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : startInfo.days <= 7
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  )}>
                    {startInfo.label}
                  </span>
                </div>
              </div>

              {/* Expandable Target Audience */}
              {plan.targetAudience && (
                <div className="mb-4">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full text-left group/expand"
                  >
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      Target Audience
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
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {plan.targetAudience}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!isExpanded && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                      {plan.targetAudience}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-100 dark:border-slate-800">
              {/* Start Writing Button */}
              {plan.status === 'ACTIVE' && (
                <div className="p-4">
                  <Button
                    onClick={handleStartWritingClick}
                    className="w-full h-12 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                  >
                    <PenTool className="w-5 h-5 mr-2" />
                    Start Writing
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Paused State */}
              {plan.status === 'PAUSED' && (
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
              {plan.status === 'COMPLETED' && (
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
              Delete Blog Plan?
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

export default BlogPlanCard;
