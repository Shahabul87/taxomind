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
  Flag,
  Clock,
  AlertCircle,
  Info,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Play,
  BookOpen,
  Target,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SAMInsightsResponse,
  LearningInsight,
  LearningPattern,
  AttentionItem,
  SuggestedAction,
  INSIGHT_TYPE_CONFIG,
  ATTENTION_SEVERITY_CONFIG,
  SAMInsightsProps,
} from '@/types/learning-analytics';
import { cn } from '@/lib/utils';

// Demo data generator
function generateDemoSAMInsights(): SAMInsightsResponse {
  const insights: LearningInsight[] = [
    {
      id: '1',
      type: 'recommendation',
      priority: 'high',
      title: 'Perfect time to study TypeScript',
      description:
        "Based on your patterns, you're most productive between 9-11 AM. Your TypeScript course is falling behind - consider focusing on it this morning.",
      icon: 'Lightbulb',
      color: '#3B82F6',
      courseId: '2',
      courseName: 'TypeScript Mastery',
      createdAt: new Date().toISOString(),
      action: {
        label: 'Start TypeScript',
        href: '/courses/2',
        type: 'navigate',
      },
    },
    {
      id: '2',
      type: 'warning',
      priority: 'high',
      title: 'AWS course needs attention',
      description:
        "You're 20% behind on AWS Cloud Practitioner. At your current pace, you'll miss the deadline. Consider dedicating extra time this week.",
      icon: 'AlertTriangle',
      color: '#F59E0B',
      courseId: '4',
      courseName: 'AWS Cloud Practitioner',
      createdAt: new Date().toISOString(),
      action: {
        label: 'View Course',
        href: '/courses/4',
        type: 'navigate',
      },
    },
    {
      id: '3',
      type: 'achievement',
      priority: 'low',
      title: '50+ Lessons Milestone!',
      description:
        "Amazing progress! You've completed over 50 lessons across all courses. Keep up the momentum!",
      icon: 'Trophy',
      color: '#10B981',
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      type: 'tip',
      priority: 'medium',
      title: 'Spaced repetition reminder',
      description:
        "You haven't reviewed React Hooks concepts in 5 days. A quick review can boost retention by 40%.",
      icon: 'Brain',
      color: '#8B5CF6',
      createdAt: new Date().toISOString(),
      action: {
        label: 'Quick Review',
        type: 'navigate',
      },
    },
    {
      id: '5',
      type: 'pattern',
      priority: 'medium',
      title: 'Learning pattern detected',
      description:
        'You tend to perform better on video content (85% quiz scores) vs text (68%). Consider prioritizing video lessons.',
      icon: 'BarChart3',
      color: '#6366F1',
      createdAt: new Date().toISOString(),
    },
  ];

  const patterns: LearningPattern[] = [
    {
      id: 'best-time',
      label: 'Best focus time',
      value: '9:00 AM - 11:00 AM',
      type: 'strength',
      description: 'Based on your most productive sessions',
    },
    {
      id: 'retention',
      label: 'Peak retention',
      value: 'Video lessons (85%)',
      type: 'strength',
      description: 'Your quiz scores are highest after videos',
    },
    {
      id: 'improvement',
      label: 'Needs work',
      value: 'Reading (68% avg)',
      type: 'improvement',
      description: 'Consider using video alternatives',
    },
    {
      id: 'strength',
      label: 'Strong in',
      value: 'Practical exercises',
      type: 'strength',
      description: '92% completion rate',
    },
  ];

  const attentionItems: AttentionItem[] = [
    {
      id: '1',
      message: 'TypeScript quiz deadline in 2 days (currently scoring 72%)',
      type: 'quiz',
      severity: 'warning',
      courseId: '2',
      courseName: 'TypeScript Mastery',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 72,
    },
    {
      id: '2',
      message: "You haven't practiced React hooks in 5 days",
      type: 'review',
      severity: 'info',
      courseId: '1',
      courseName: 'Advanced React',
    },
    {
      id: '3',
      message: 'Weekly goal at 60% with 2 days remaining',
      type: 'goal',
      severity: 'warning',
      progress: 60,
    },
  ];

  const suggestedActions: SuggestedAction[] = [
    {
      id: '1',
      title: 'Complete TypeScript Chapter 4',
      duration: '35 min',
      type: 'lesson',
      courseId: '2',
      courseName: 'TypeScript Mastery',
      href: '/courses/2/chapters/4',
      priority: 1,
    },
    {
      id: '2',
      title: 'Review React Hooks notes',
      duration: '15 min',
      type: 'review',
      courseId: '1',
      courseName: 'Advanced React',
      priority: 2,
    },
    {
      id: '3',
      title: 'Practice coding exercise',
      duration: '20 min',
      type: 'exercise',
      priority: 3,
    },
  ];

  return {
    insights,
    patterns,
    attentionItems,
    suggestedActions,
    optimalStudyTime: '9:00 AM - 11:00 AM',
    focusArea: 'TypeScript',
    learningScore: 72,
    engagementLevel: 'medium',
    progressRate: 'on_track',
  };
}

// Icon mapping
const InsightIcons: Record<string, React.ElementType> = {
  Lightbulb,
  AlertTriangle,
  Trophy,
  Brain,
  BarChart3,
  Flag,
  Clock,
  AlertCircle,
  Info,
};

const ActionTypeIcons: Record<string, React.ElementType> = {
  lesson: BookOpen,
  quiz: Target,
  review: Brain,
  exercise: Play,
  break: Clock,
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
  const Icon = InsightIcons[insight.icon ?? config.icon] ?? Sparkles;

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
  const config = ATTENTION_SEVERITY_CONFIG[item.severity];
  const Icon = InsightIcons[config.icon];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-start gap-2 rounded-lg p-2',
        config.bgColor
      )}
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

function SuggestedActionCard({ action }: { action: SuggestedAction }) {
  const Icon = ActionTypeIcons[action.type] ?? BookOpen;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-all hover:border-blue-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white truncate">
          {action.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {action.duration}
          {action.courseName && ` • ${action.courseName}`}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </motion.button>
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
          {score}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function SAMInsights({
  maxInsights = 3,
  showPatterns = true,
  showActions = true,
  onInsightAction,
}: SAMInsightsProps) {
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  // In a real app, this would be fetched from the API
  const data = generateDemoSAMInsights();

  const filteredInsights = data.insights.filter(
    (i) => !dismissedInsights.includes(i.id)
  );
  const displayInsights = showAllInsights
    ? filteredInsights
    : filteredInsights.slice(0, maxInsights);

  const handleDismiss = (insight: LearningInsight) => {
    setDismissedInsights((prev) => [...prev, insight.id]);
  };

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
              data.progressRate === 'ahead' && 'bg-emerald-50 text-emerald-700',
              data.progressRate === 'on_track' && 'bg-blue-50 text-blue-700',
              data.progressRate === 'behind' && 'bg-amber-50 text-amber-700'
            )}
          >
            {data.progressRate === 'ahead' && 'Ahead of schedule'}
            {data.progressRate === 'on_track' && 'On track'}
            {data.progressRate === 'behind' && 'Needs attention'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Learning Score & Quick Stats */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:from-purple-950/30 dark:to-pink-950/30">
          <LearningScoreGauge score={data.learningScore} label="Learning Score" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Best time: <span className="font-semibold">{data.optimalStudyTime}</span>
              </span>
            </div>
            {data.focusArea && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Focus on: <span className="font-semibold">{data.focusArea}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Engagement:{' '}
                <span className="font-semibold capitalize">{data.engagementLevel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Attention Items */}
        {data.attentionItems.length > 0 && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between p-0 hover:bg-transparent"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Attention Needed ({data.attentionItems.length})
                </span>
                <ChevronDown className="h-4 w-4 transition-transform ui-open:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {data.attentionItems.map((item) => (
                <AttentionBadge key={item.id} item={item} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Insights */}
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

        {/* Suggested Actions */}
        {showActions && data.suggestedActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Target className="h-4 w-4 text-emerald-500" />
              Suggested Next Actions
            </h4>
            <div className="space-y-2">
              {data.suggestedActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <SuggestedActionCard action={action} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Patterns */}
        {showPatterns && data.patterns.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Learning Patterns
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {data.patterns.map((pattern) => (
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
          >
            <Brain className="mr-2 h-4 w-4 text-purple-500" />
            Ask SAM for personalized guidance
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}
