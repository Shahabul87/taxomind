'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Trophy,
  Brain,
  BarChart3,
  Clock,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  Target,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useLearningAnalytics, formatStudyTime } from './hooks/useLearningAnalytics';
import { useSAMGlobalOptional } from '@/components/sam/sam-global-provider';

export interface SAMInsightsProps {
  compact?: boolean;
  maxInsights?: number;
  showPatterns?: boolean;
  showActions?: boolean;
  onInsightAction?: (insight: LearningInsight) => void;
}

interface LearningInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'achievement' | 'tip' | 'pattern';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  courseName?: string;
  action?: {
    label: string;
    href?: string;
  };
}

interface LearningPattern {
  id: string;
  label: string;
  value: string;
  type: 'strength' | 'improvement' | 'neutral';
}

interface AttentionItem {
  id: string;
  message: string;
  severity: 'warning' | 'info' | 'critical';
  courseName?: string;
}

const INSIGHT_TYPE_CONFIG = {
  recommendation: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: 'Lightbulb',
  },
  warning: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: 'AlertTriangle',
  },
  achievement: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    icon: 'Trophy',
  },
  tip: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    icon: 'Brain',
  },
  pattern: {
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    icon: 'BarChart3',
  },
};

const SEVERITY_CONFIG = {
  warning: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    icon: AlertTriangle,
  },
  info: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: AlertCircle,
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    icon: AlertCircle,
  },
};

function InsightCard({
  insight,
  onAction,
  onDismiss,
}: {
  insight: LearningInsight;
  onAction?: (insight: LearningInsight) => void;
  onDismiss?: (insight: LearningInsight) => void;
}) {
  const config = INSIGHT_TYPE_CONFIG[insight.type];
  const Icon = insight.type === 'recommendation' ? Lightbulb :
    insight.type === 'warning' ? AlertTriangle :
    insight.type === 'achievement' ? Trophy :
    insight.type === 'tip' ? Brain : BarChart3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'rounded-xl border p-4',
        config.borderColor,
        config.bgColor
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
            config.bgColor
          )}
        >
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-slate-900 dark:text-white">
              {insight.title}
            </h4>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 text-slate-400 hover:text-slate-600"
                onClick={() => onDismiss(insight)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {insight.description}
          </p>
          {insight.courseName && (
            <Badge variant="outline" className="mt-2 text-xs">
              {insight.courseName}
            </Badge>
          )}
          {insight.action && (
            <Button
              variant="ghost"
              size="sm"
              className={cn('mt-2 h-7 px-2', config.color)}
              onClick={() => onAction?.(insight)}
            >
              {insight.action.label}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AttentionBadge({ item }: { item: AttentionItem }) {
  const config = SEVERITY_CONFIG[item.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('flex items-start gap-2 rounded-lg p-2', config.bgColor)}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', config.color)}>{item.message}</p>
        {item.courseName && (
          <p className="text-xs text-slate-500 mt-0.5">{item.courseName}</p>
        )}
      </div>
    </motion.div>
  );
}

function PatternBadge({ pattern }: { pattern: LearningPattern }) {
  const typeColors = {
    strength: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    improvement: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    neutral: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <div className={cn('rounded-lg p-2', typeColors[pattern.type])}>
      <p className="text-xs font-medium">{pattern.label}</p>
      <p className="text-sm font-semibold">{pattern.value}</p>
    </div>
  );
}

function LearningScoreGauge({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 60) return 'text-blue-500';
    if (s >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90 transform">
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-slate-200 dark:text-slate-700"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
            animate={{
              strokeDashoffset: 2 * Math.PI * 36 * (1 - score / 100),
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeDasharray={`${2 * Math.PI * 36}`}
            className={getColor(score)}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-900 dark:text-white">
          {Math.round(score)}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function LoadingState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex items-center justify-center', compact ? 'p-6' : 'p-12')}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-slate-500">Loading insights...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex flex-col items-center justify-center text-center', compact ? 'p-6' : 'p-12')}>
        <Sparkles className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-semibold text-slate-900 dark:text-white">No Insights Yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Start learning to get personalized insights from SAM AI.
        </p>
      </CardContent>
    </Card>
  );
}

export function SAMInsights({
  compact = false,
  maxInsights = 3,
  showPatterns = true,
  showActions = true,
  onInsightAction,
}: SAMInsightsProps) {
  const { data, isLoading, error, samData } = useLearningAnalytics('month');
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  const samContext = useSAMGlobalOptional();

  // Handler to open SAM with analytics context
  const handleAskSAM = () => {
    // Only open SAM if the context is available
    if (!samContext) {
      return;
    }

    // Update SAM context with current analytics data
    samContext.updateContext({
      pageType: 'analytics',
      entityType: 'learning-analytics',
      contextData: {
        source: 'analytics-insights',
        analyticsData: data ? {
          learningScore: Math.round(
            (data.overview.averageScore * 0.4) +
            (data.overview.averageProgress * 0.3) +
            (data.learningPatterns.retentionRate * 0.3)
          ),
          totalStudyTime: data.overview.totalStudyTime,
          currentStreak: data.overview.currentStreak,
          activeCourses: data.overview.activeCourses,
          averageProgress: data.overview.averageProgress,
          averageScore: data.overview.averageScore,
          studyFrequency: data.learningPatterns.studyFrequency,
          retentionRate: data.learningPatterns.retentionRate,
        } : null,
        samData: samData ? {
          predictions: samData.predictions,
          interventions: samData.interventions.filter(i => i.status === 'pending').slice(0, 3),
          recommendations: samData.recommendations?.items?.slice(0, 3),
        } : null,
        suggestedQuestions: [
          'How can I improve my learning progress?',
          'What areas should I focus on next?',
          'How do I maintain my learning streak?',
        ],
      },
    });
    // Open SAM assistant
    samContext.setIsOpen(true);
  };

  if (isLoading) {
    return <LoadingState compact={compact} />;
  }

  if (error || !data) {
    return <EmptyState compact={compact} />;
  }

  // Transform API data into component format
  const learningScore = Math.round(
    (data.overview.averageScore * 0.4) +
    (data.overview.averageProgress * 0.3) +
    (data.learningPatterns.retentionRate * 0.3)
  );

  const progressRate = data.overview.averageProgress >= 60 ? 'ahead' :
    data.overview.averageProgress >= 40 ? 'on_track' : 'behind';

  const insights: LearningInsight[] = data.aiRecommendations.map((rec, idx) => ({
    id: `rec-${idx}`,
    type: rec.type === 'weak_areas' ? 'warning' as const :
      rec.type === 'learning_strategy' ? 'tip' as const : 'recommendation' as const,
    priority: rec.priority,
    title: rec.title,
    description: rec.description,
    action: rec.actionItems.length > 0 ? {
      label: 'Learn More',
    } : undefined,
  }));

  // Add achievements as insights
  data.achievements.forEach((achievement, idx) => {
    insights.push({
      id: `ach-${idx}`,
      type: 'achievement',
      priority: 'low',
      title: achievement.title,
      description: achievement.description,
    });
  });

  const patterns: LearningPattern[] = [
    {
      id: 'study-time',
      label: 'Best focus time',
      value: data.learningPatterns.preferredStudyTime === 'morning' ? '9:00 AM - 12:00 PM' :
        data.learningPatterns.preferredStudyTime === 'afternoon' ? '1:00 PM - 5:00 PM' : '6:00 PM - 9:00 PM',
      type: 'strength',
    },
    {
      id: 'frequency',
      label: 'Study frequency',
      value: data.learningPatterns.studyFrequency,
      type: data.learningPatterns.studyFrequency === 'high' ? 'strength' : 'improvement',
    },
    {
      id: 'active-day',
      label: 'Most active day',
      value: data.learningPatterns.mostActiveDay,
      type: 'neutral',
    },
    {
      id: 'retention',
      label: 'Retention rate',
      value: `${data.learningPatterns.retentionRate}%`,
      type: data.learningPatterns.retentionRate >= 80 ? 'strength' : 'improvement',
    },
  ];

  const attentionItems: AttentionItem[] = [];

  // Add attention items based on data
  if (data.overview.averageScore < 70) {
    attentionItems.push({
      id: 'score',
      message: `Average score is ${Math.round(data.overview.averageScore)}%. Consider reviewing weak areas.`,
      severity: 'warning',
    });
  }

  if (data.courseProgress.some(c => c.progress < 30 && c.estimatedTimeToComplete > 0)) {
    attentionItems.push({
      id: 'progress',
      message: 'Some courses need more attention to stay on track.',
      severity: 'info',
    });
  }

  const filteredInsights = insights.filter(i => !dismissedInsights.includes(i.id));
  const displayInsights = showAllInsights
    ? filteredInsights
    : filteredInsights.slice(0, compact ? 1 : maxInsights);

  const handleDismiss = (insight: LearningInsight) => {
    setDismissedInsights(prev => [...prev, insight.id]);
  };

  // Compact view for Overview grid
  if (compact) {
    return (
      <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
              SAM Learning Insights
            </CardTitle>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                progressRate === 'ahead' && 'bg-emerald-50 text-emerald-700',
                progressRate === 'on_track' && 'bg-blue-50 text-blue-700',
                progressRate === 'behind' && 'bg-amber-50 text-amber-700'
              )}
            >
              {progressRate === 'ahead' ? 'Ahead' : progressRate === 'on_track' ? 'On track' : 'Needs attention'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Compact Score Display */}
          <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:from-purple-950/30 dark:to-pink-950/30">
            <LearningScoreGauge score={learningScore} label="Learning Score" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>{formatStudyTime(data.overview.totalStudyTime)} studied</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Target className="h-3.5 w-3.5 text-purple-600" />
                <span>{data.overview.activeCourses} active courses</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                <span>{data.overview.currentStreak} day streak</span>
              </div>
            </div>
          </div>

          {/* Top insight */}
          {displayInsights.length > 0 && (
            <InsightCard
              insight={displayInsights[0]}
              onAction={onInsightAction}
              onDismiss={handleDismiss}
            />
          )}

          {/* Ask SAM Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20"
            onClick={handleAskSAM}
          >
            <Brain className="mr-2 h-4 w-4 text-purple-500" />
            Ask SAM for guidance
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-500" />
            SAM Learning Insights
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              progressRate === 'ahead' && 'bg-emerald-50 text-emerald-700',
              progressRate === 'on_track' && 'bg-blue-50 text-blue-700',
              progressRate === 'behind' && 'bg-amber-50 text-amber-700'
            )}
          >
            {progressRate === 'ahead' ? 'Ahead of schedule' : progressRate === 'on_track' ? 'On track' : 'Needs attention'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Learning Score & Quick Stats */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:from-purple-950/30 dark:to-pink-950/30">
          <LearningScoreGauge score={learningScore} label="Learning Score" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Study time: <span className="font-semibold">{formatStudyTime(data.overview.totalStudyTime)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Active courses: <span className="font-semibold">{data.overview.activeCourses}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Avg score: <span className="font-semibold">{Math.round(data.overview.averageScore)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Attention Items */}
        {attentionItems.length > 0 && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between p-0 hover:bg-transparent"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Attention Needed ({attentionItems.length})
                </span>
                <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {attentionItems.map(item => (
                <AttentionBadge key={item.id} item={item} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Insights */}
        {displayInsights.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              Personalized Recommendations
            </h4>
            <AnimatePresence mode="popLayout">
              {displayInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <InsightCard
                    insight={insight}
                    onAction={onInsightAction}
                    onDismiss={handleDismiss}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredInsights.length > maxInsights && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-500"
                onClick={() => setShowAllInsights(!showAllInsights)}
              >
                {showAllInsights ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Show {filteredInsights.length - maxInsights} more
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Learning Patterns */}
        {showPatterns && patterns.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Learning Patterns
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {patterns.map(pattern => (
                <PatternBadge key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </div>
        )}

        {/* Ask SAM Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            variant="outline"
            className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20"
            onClick={handleAskSAM}
          >
            <Brain className="mr-2 h-4 w-4 text-purple-500" />
            Ask SAM for personalized guidance
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}
