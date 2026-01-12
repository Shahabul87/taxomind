'use client';

/**
 * RecommendationCard
 *
 * Enhanced recommendation card with snooze, feedback, and action features.
 *
 * Features:
 * - Priority indicators
 * - Time estimate display
 * - Snooze functionality
 * - Feedback collection
 * - Quick actions
 * - Animated interactions
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Target,
  Brain,
  FileQuestion,
  Coffee,
  Flag,
  Clock,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  AlarmClock,
  Check,
  X,
  ChevronRight,
  Lightbulb,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import type {
  LearningRecommendation,
  RecommendationType,
  RecommendationPriority,
} from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationCardProps {
  className?: string;
  /** Recommendation data */
  recommendation: LearningRecommendation;
  /** Compact display mode */
  compact?: boolean;
  /** Show reason by default */
  showReason?: boolean;
  /** Callback when action taken */
  onAction?: (recommendation: LearningRecommendation) => void;
  /** Callback when snoozed */
  onSnooze?: (recommendation: LearningRecommendation, duration: number) => void;
  /** Callback when feedback given */
  onFeedback?: (
    recommendation: LearningRecommendation,
    feedback: 'helpful' | 'not_helpful',
    comment?: string
  ) => void;
  /** Callback when dismissed */
  onDismiss?: (recommendation: LearningRecommendation) => void;
}

type FeedbackType = 'helpful' | 'not_helpful' | null;

// ============================================================================
// CONSTANTS
// ============================================================================

const TYPE_CONFIG: Record<
  RecommendationType,
  {
    icon: typeof BookOpen;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  content: {
    icon: BookOpen,
    label: 'Content',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  practice: {
    icon: Target,
    label: 'Practice',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  review: {
    icon: Brain,
    label: 'Review',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  assessment: {
    icon: FileQuestion,
    label: 'Assessment',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  break: {
    icon: Coffee,
    label: 'Break',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
  goal: {
    icon: Flag,
    label: 'Goal',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};

const PRIORITY_CONFIG: Record<
  RecommendationPriority,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  high: {
    label: 'High Priority',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  medium: {
    label: 'Medium Priority',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  low: {
    label: 'Low Priority',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
};

const SNOOZE_OPTIONS = [
  { label: '15 minutes', duration: 15 },
  { label: '1 hour', duration: 60 },
  { label: '4 hours', duration: 240 },
  { label: 'Tomorrow', duration: 1440 },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecommendationCard({
  className,
  recommendation,
  compact = false,
  showReason = false,
  onAction,
  onSnooze,
  onFeedback,
  onDismiss,
}: RecommendationCardProps) {
  // State
  const [showReasonExpanded, setShowReasonExpanded] = useState(showReason);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const typeConfig = TYPE_CONFIG[recommendation.type] || TYPE_CONFIG.content;
  const priorityConfig = PRIORITY_CONFIG[recommendation.priority] || PRIORITY_CONFIG.medium;
  const Icon = typeConfig.icon;

  // Handle action click
  const handleAction = useCallback(() => {
    onAction?.(recommendation);
  }, [onAction, recommendation]);

  // Handle snooze
  const handleSnooze = useCallback(
    (duration: number) => {
      onSnooze?.(recommendation, duration);
    },
    [onSnooze, recommendation]
  );

  // Handle feedback
  const handleFeedback = useCallback(
    (type: 'helpful' | 'not_helpful') => {
      setFeedback(type);
      if (type === 'not_helpful') {
        setShowFeedbackDialog(true);
      } else {
        onFeedback?.(recommendation, type);
      }
    },
    [onFeedback, recommendation]
  );

  // Submit feedback with comment
  const submitFeedback = useCallback(async () => {
    if (!feedback) return;
    setIsSubmitting(true);
    await onFeedback?.(recommendation, feedback, feedbackComment);
    setIsSubmitting(false);
    setShowFeedbackDialog(false);
  }, [feedback, feedbackComment, onFeedback, recommendation]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    onDismiss?.(recommendation);
  }, [onDismiss, recommendation]);

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  // Compact mode
  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
          'hover:bg-gray-50 dark:hover:bg-gray-800',
          priorityConfig.borderColor,
          className
        )}
      >
        <div className={cn('p-2 rounded-full', typeConfig.bgColor)}>
          <Icon className={cn('h-4 w-4', typeConfig.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{recommendation.title}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{recommendation.estimatedMinutes} min</span>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleAction}
          className="shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card
          className={cn(
            'overflow-hidden transition-shadow hover:shadow-md',
            recommendation.priority === 'high' && 'border-l-4 border-l-red-500',
            recommendation.priority === 'medium' && 'border-l-4 border-l-amber-500',
            className
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-full shrink-0', typeConfig.bgColor)}>
                  <Icon className={cn('h-5 w-5', typeConfig.color)} />
                </div>
                <div>
                  <CardTitle className="text-base leading-snug">
                    {recommendation.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={cn('text-xs', typeConfig.color)}>
                      {typeConfig.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', priorityConfig.color, priorityConfig.bgColor)}
                    >
                      {priorityConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {SNOOZE_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.duration}
                      onClick={() => handleSnooze(option.duration)}
                    >
                      <AlarmClock className="h-4 w-4 mr-2" />
                      Snooze {option.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDismiss} className="text-red-600">
                    <X className="h-4 w-4 mr-2" />
                    Dismiss
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <CardDescription className="text-sm">
              {recommendation.description}
            </CardDescription>

            {/* Time and metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{recommendation.estimatedMinutes} min</span>
              </div>
              {recommendation.metadata?.difficulty && (
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span className="capitalize">{recommendation.metadata.difficulty}</span>
                </div>
              )}
              {recommendation.metadata?.confidence && (
                <div className="flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  <span>{Math.round(recommendation.metadata.confidence * 100)}% match</span>
                </div>
              )}
            </div>

            {/* Reason (expandable) */}
            <AnimatePresence>
              {(showReasonExpanded || showReason) && recommendation.reason && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      {recommendation.reason}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showReason && recommendation.reason && (
              <button
                onClick={() => setShowReasonExpanded(!showReasonExpanded)}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
              >
                <Lightbulb className="h-3 w-3" />
                {showReasonExpanded ? 'Hide' : 'Show'} why recommended
              </button>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              {/* Feedback buttons */}
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={feedback === 'helpful' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleFeedback('helpful')}
                        className={cn(
                          'h-8 w-8 p-0',
                          feedback === 'helpful' && 'bg-green-500 hover:bg-green-600'
                        )}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Helpful recommendation</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={feedback === 'not_helpful' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleFeedback('not_helpful')}
                        className={cn(
                          'h-8 w-8 p-0',
                          feedback === 'not_helpful' && 'bg-red-500 hover:bg-red-600'
                        )}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Not helpful</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Action button */}
              <Button onClick={handleAction} size="sm">
                Start Now
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Help Us Improve
            </DialogTitle>
            <DialogDescription>
              Tell us why this recommendation wasn&apos;t helpful so we can do better.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="What would have been more helpful? (optional)"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowFeedbackDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitFeedback} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default RecommendationCard;
