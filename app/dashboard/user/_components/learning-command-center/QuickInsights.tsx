'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Lightbulb,
  Clock,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  Brain,
  RefreshCw,
  Loader2,
  Target,
  Coffee,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Insight {
  id: string;
  type: 'recommendation' | 'warning' | 'achievement' | 'tip';
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface SAMRecommendation {
  id: string;
  type: 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal';
  title: string;
  description: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  targetUrl?: string;
  metadata?: {
    resourceId?: string;
    difficulty?: string;
    confidence?: number;
  };
}

interface SAMRecommendationBatch {
  recommendations: SAMRecommendation[];
  totalEstimatedTime: number;
  generatedAt: string;
  context: {
    availableTime?: number;
    currentGoals?: string[];
    recentTopics?: string[];
  };
}

interface QuickInsightsProps {
  insights?: Insight[];
  optimalStudyTime?: string;
  focusArea?: string;
}

// Map SAM recommendation type to insight type
function mapRecommendationToInsight(rec: SAMRecommendation): Insight {
  const typeMap: Record<SAMRecommendation['type'], Insight['type']> = {
    content: 'recommendation',
    practice: 'recommendation',
    review: 'tip',
    assessment: 'warning',
    break: 'tip',
    goal: 'recommendation',
  };

  return {
    id: rec.id,
    type: typeMap[rec.type] || 'recommendation',
    title: rec.title,
    description: rec.reason || rec.description,
    action: rec.targetUrl
      ? { label: `Start (${rec.estimatedMinutes} min)`, href: rec.targetUrl }
      : { label: `${rec.estimatedMinutes} min` },
  };
}

// Demo insights (fallback)
const demoInsights: Insight[] = [
  {
    id: '1',
    type: 'recommendation',
    title: 'Perfect time to study TypeScript',
    description: "Based on your patterns, you're most productive between 9-11 AM. Your TypeScript course is falling behind - consider focusing on it this morning.",
    action: {
      label: 'Start TypeScript',
    },
  },
  {
    id: '2',
    type: 'warning',
    title: 'Quiz deadline approaching',
    description: 'React State Management quiz is due in 2 hours. You\'re currently at 60% progress.',
    action: {
      label: 'Resume Quiz',
    },
  },
  {
    id: '3',
    type: 'tip',
    title: 'Spaced repetition reminder',
    description: 'You haven\'t reviewed React Hooks concepts in 5 days. A quick review session can boost retention by 40%.',
    action: {
      label: 'Quick Review',
    },
  },
];

// Hook to fetch SAM recommendations
function useSAMRecommendations(availableTime: number = 60) {
  const [recommendations, setRecommendations] = useState<SAMRecommendationBatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sam/agentic/recommendations?time=${availableTime}&limit=5`);
      const result = await response.json();

      if (result.success && result.data) {
        setRecommendations(result.data);
      } else {
        setError(result.error || 'Failed to fetch recommendations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [availableTime]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, isLoading, error, refresh: fetchRecommendations };
}

const insightTypeConfig = {
  recommendation: {
    icon: Lightbulb,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  achievement: {
    icon: Sparkles,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  tip: {
    icon: Brain,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
};

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const config = insightTypeConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`rounded-xl border p-4 ${config.borderColor} ${config.bgColor}`}
    >
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-slate-900 dark:text-white">
            {insight.title}
          </h4>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {insight.description}
          </p>
          {insight.action && (
            <Button
              variant="ghost"
              size="sm"
              className={`mt-2 ${config.color} hover:${config.bgColor}`}
              onClick={insight.action.onClick}
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

export function QuickInsights({
  insights: propInsights,
  optimalStudyTime = '9:00 AM - 11:00 AM',
  focusArea: propFocusArea,
}: QuickInsightsProps) {
  // Fetch real SAM recommendations
  const { recommendations, isLoading, error, refresh } = useSAMRecommendations(60);

  // Use API recommendations if available, otherwise fall back to props or demo
  const effectiveInsights = React.useMemo(() => {
    if (recommendations?.recommendations?.length) {
      return recommendations.recommendations.map(mapRecommendationToInsight);
    }
    return propInsights ?? demoInsights;
  }, [recommendations, propInsights]);

  // Derive focus area from recommendations context
  const focusArea = React.useMemo(() => {
    if (recommendations?.context?.recentTopics?.length) {
      return recommendations.context.recentTopics[0];
    }
    return propFocusArea ?? 'TypeScript';
  }, [recommendations, propFocusArea]);

  // Calculate total estimated time
  const totalTime = recommendations?.totalEstimatedTime ?? 60;

  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Learning Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 p-3 dark:from-emerald-950/30 dark:to-teal-950/30"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Best Study Time
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {optimalStudyTime}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 p-3 dark:from-purple-950/30 dark:to-pink-950/30"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Focus Area
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-purple-700 dark:text-purple-400">
              {focusArea}
            </p>
          </motion.div>
        </div>

        {/* Total Time Badge */}
        {recommendations && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-xs text-slate-500"
          >
            <Target className="h-3 w-3" />
            <span>{totalTime} min of learning suggested</span>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          >
            Using cached recommendations
          </motion.div>
        )}

        {/* Insights List */}
        {!isLoading && (
          <div className="space-y-3">
            {effectiveInsights.map((insight, index) => (
              <InsightCard key={insight.id} insight={insight} index={index} />
            ))}
          </div>
        )}

        {/* Ask SAM Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
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
