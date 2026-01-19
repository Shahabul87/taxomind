'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bell,
  X,
  ChevronRight,
  Clock,
  Brain,
  Target,
  Coffee,
  BookOpen,
  TrendingUp,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  Heart,
  Lightbulb,
  Play,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSAMInterventions, type SAMIntervention } from '@/hooks/use-sam-agentic-analytics';
import { useSAMGlobalOptional } from '@/components/sam/sam-global-provider';

export interface ProactiveInterventionsProps {
  compact?: boolean;
  maxInterventions?: number;
  onActionTaken?: (intervention: SAMIntervention, action: string) => void;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

type InterventionTypeConfig = {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
};

const typeConfig: Record<string, InterventionTypeConfig> = {
  encouragement: {
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    label: 'Encouragement',
  },
  strategy_change: {
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    label: 'Strategy',
  },
  break_suggestion: {
    icon: Coffee,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    label: 'Take a Break',
  },
  resource_recommendation: {
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Resources',
  },
  goal_adjustment: {
    icon: Target,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    label: 'Goal Update',
  },
};

const priorityConfig = {
  critical: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ring: 'ring-2 ring-red-200 dark:ring-red-800',
  },
  high: {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    ring: 'ring-2 ring-orange-200 dark:ring-orange-800',
  },
  medium: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ring: '',
  },
  low: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ring: '',
  },
};

function InterventionCard({
  intervention,
  onDismiss,
  onAction,
  onAskSAM,
}: {
  intervention: SAMIntervention;
  onDismiss?: (id: string) => void;
  onAction?: (intervention: SAMIntervention, action: string) => void;
  onAskSAM?: () => void;
}) {
  const config = typeConfig[intervention.type] ?? typeConfig.encouragement;
  const priority = priorityConfig[intervention.priority] ?? priorityConfig.medium;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-xl border p-4 transition-all',
        config.borderColor,
        config.bgColor,
        priority.ring
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
          config.bgColor
        )}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn('text-xs', priority.badge)}>
                {intervention.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 text-slate-400 hover:text-slate-600"
                onClick={() => onDismiss(intervention.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Message */}
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
            {intervention.message}
          </p>

          {/* Suggested Actions */}
          {intervention.suggestedActions.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Suggested Actions:
              </p>
              <div className="flex flex-wrap gap-2">
                {intervention.suggestedActions.slice(0, 3).map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onAction?.(intervention, action.title)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {action.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-7 text-xs', config.color)}
              onClick={onAskSAM}
            >
              <Brain className="h-3 w-3 mr-1" />
              Ask SAM about this
            </Button>
            {intervention.createdAt && (
              <span className="text-xs text-slate-400 ml-auto">
                <Clock className="inline h-3 w-3 mr-1" />
                {formatTimeAgo(new Date(intervention.createdAt))}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function QuickCheckIn({
  onRespond,
}: {
  onRespond: (response: 'good' | 'struggling' | 'need_help') => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:border-indigo-800 dark:from-indigo-950/30 dark:to-purple-950/30"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">
            Quick Check-in
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            How&apos;s your learning going today?
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
          onClick={() => onRespond('good')}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Great!
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
          onClick={() => onRespond('struggling')}
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Struggling
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
          onClick={() => onRespond('need_help')}
        >
          <Lightbulb className="h-4 w-4 mr-1" />
          Need Tips
        </Button>
      </div>
    </motion.div>
  );
}

function LoadingState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex items-center justify-center', compact ? 'p-6' : 'p-12')}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-slate-500">Loading interventions...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex flex-col items-center justify-center text-center', compact ? 'p-6' : 'p-12')}>
        <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-semibold text-slate-900 dark:text-white">All Caught Up!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          No pending interventions. Keep up the great work with your learning!
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProactiveInterventions({
  compact = false,
  maxInterventions = 5,
  onActionTaken,
}: ProactiveInterventionsProps) {
  const { interventions, loading, dismissIntervention, submitCheckIn } = useSAMInterventions();
  const samContext = useSAMGlobalOptional();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [showCheckIn, setShowCheckIn] = useState(true);

  // Filter to pending interventions and exclude dismissed
  const pendingInterventions = interventions
    .filter((i) => i.status === 'pending' && !dismissedIds.has(i.id))
    .slice(0, maxInterventions);

  // Handle dismissing an intervention
  const handleDismiss = useCallback(async (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    try {
      await dismissIntervention(id);
    } catch (error) {
      console.error('Failed to dismiss intervention:', error);
    }
  }, [dismissIntervention]);

  // Handle taking action on an intervention
  const handleAction = useCallback((intervention: SAMIntervention, action: string) => {
    onActionTaken?.(intervention, action);
    // Navigate to action URL if available
    const suggestedAction = intervention.suggestedActions.find((a) => a.title === action);
    if (suggestedAction?.targetUrl) {
      window.location.href = suggestedAction.targetUrl;
    }
  }, [onActionTaken]);

  // Handle asking SAM about an intervention
  const handleAskSAM = useCallback((intervention: SAMIntervention) => {
    if (!samContext) {
      return;
    }
    samContext.updateContext({
      pageType: 'analytics',
      entityType: 'intervention',
      contextData: {
        source: 'proactive-intervention',
        intervention: {
          type: intervention.type,
          message: intervention.message,
          priority: intervention.priority,
          suggestedActions: intervention.suggestedActions,
        },
      },
    });
    samContext.setIsOpen(true);
  }, [samContext]);

  // Handle check-in response
  const handleCheckInResponse = useCallback(async (response: 'good' | 'struggling' | 'need_help') => {
    setShowCheckIn(false);
    try {
      await submitCheckIn(response);
      if ((response === 'need_help' || response === 'struggling') && samContext) {
        // Open SAM with context
        samContext.updateContext({
          pageType: 'analytics',
          entityType: 'check-in',
          contextData: {
            source: 'check-in-response',
            response,
            helpType: response === 'need_help' ? 'tips' : 'support',
          },
        });
        samContext.setIsOpen(true);
      }
    } catch (error) {
      console.error('Failed to submit check-in:', error);
    }
  }, [submitCheckIn, samContext]);

  if (loading) {
    return <LoadingState compact={compact} />;
  }

  const hasContent = pendingInterventions.length > 0 || showCheckIn;

  if (!hasContent) {
    return <EmptyState compact={compact} />;
  }

  // Compact view
  if (compact) {
    return (
      <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <Bell className="h-5 w-5 text-purple-500" />
              SAM Check-ins
            </CardTitle>
            {pendingInterventions.length > 0 && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                {pendingInterventions.length} pending
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Check-in */}
          {showCheckIn && (
            <QuickCheckIn onRespond={handleCheckInResponse} />
          )}

          {/* Top Intervention */}
          {pendingInterventions.length > 0 && (
            <InterventionCard
              intervention={pendingInterventions[0]}
              onDismiss={handleDismiss}
              onAction={handleAction}
              onAskSAM={() => handleAskSAM(pendingInterventions[0])}
            />
          )}

          {/* Show more indicator */}
          {pendingInterventions.length > 1 && (
            <p className="text-center text-xs text-slate-500">
              +{pendingInterventions.length - 1} more interventions
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <Bell className="h-5 w-5 text-purple-500" />
            Proactive Interventions
          </CardTitle>
          {pendingInterventions.length > 0 && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {pendingInterventions.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Check-in */}
        {showCheckIn && (
          <QuickCheckIn onRespond={handleCheckInResponse} />
        )}

        {/* Interventions List */}
        {pendingInterventions.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Zap className="h-4 w-4 text-amber-500" />
              Personalized Interventions
            </h4>
            <AnimatePresence mode="popLayout">
              {pendingInterventions.map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  onDismiss={handleDismiss}
                  onAction={handleAction}
                  onAskSAM={() => handleAskSAM(intervention)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state for interventions only */}
        {pendingInterventions.length === 0 && !showCheckIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6"
          >
            <Sparkles className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No pending interventions - you&apos;re on track!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
