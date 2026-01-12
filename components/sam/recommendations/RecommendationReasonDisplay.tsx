'use client';

/**
 * RecommendationReasonDisplay
 *
 * Shows detailed reasoning behind why items are recommended.
 * Explains AI decision-making for transparency.
 *
 * Features:
 * - Multi-factor breakdown
 * - Confidence scoring
 * - Learning context display
 * - Interactive explanation levels
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  Brain,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  Zap,
  History,
  ChevronDown,
  ChevronUp,
  Info,
  Star,
  Sparkles,
  Activity,
  BookOpen,
} from 'lucide-react';
import type { LearningRecommendation } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationReasonDisplayProps {
  className?: string;
  /** The recommendation to explain */
  recommendation: LearningRecommendation;
  /** Display mode */
  mode?: 'inline' | 'card' | 'tooltip';
  /** Extended reasoning data */
  reasoning?: RecommendationReasoning;
  /** Show confidence breakdown */
  showConfidence?: boolean;
  /** Show contributing factors */
  showFactors?: boolean;
  /** Expanded by default */
  defaultExpanded?: boolean;
}

interface RecommendationReasoning {
  /** Overall confidence score (0-1) */
  confidence: number;
  /** Primary reason category */
  primaryReason: ReasonCategory;
  /** Contributing factors with weights */
  factors: ReasonFactor[];
  /** Learning context used */
  context: {
    currentGoals?: string[];
    recentStrengths?: string[];
    recentStruggles?: string[];
    timeAvailable?: number;
    learningStyle?: string;
  };
  /** Alternative recommendations considered */
  alternatives?: {
    title: string;
    score: number;
  }[];
}

type ReasonCategory =
  | 'goal_alignment'
  | 'knowledge_gap'
  | 'spaced_repetition'
  | 'optimal_timing'
  | 'pattern_detected'
  | 'prerequisite'
  | 'engagement_boost';

interface ReasonFactor {
  name: string;
  category: ReasonCategory;
  score: number;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REASON_CATEGORY_CONFIG: Record<
  ReasonCategory,
  {
    icon: typeof Target;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  goal_alignment: {
    icon: Target,
    label: 'Goal Alignment',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  knowledge_gap: {
    icon: AlertTriangle,
    label: 'Knowledge Gap',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  spaced_repetition: {
    icon: History,
    label: 'Due for Review',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  optimal_timing: {
    icon: Clock,
    label: 'Optimal Timing',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  pattern_detected: {
    icon: Activity,
    label: 'Learning Pattern',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
  prerequisite: {
    icon: BookOpen,
    label: 'Prerequisite',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
  },
  engagement_boost: {
    icon: Zap,
    label: 'Engagement Boost',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
};

const IMPACT_CONFIG = {
  high: { color: 'text-red-600', bgColor: 'bg-red-50', label: 'High Impact' },
  medium: { color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Medium Impact' },
  low: { color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Low Impact' },
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ConfidenceBar({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const colorClass =
    percentage >= 80
      ? 'bg-green-500'
      : percentage >= 60
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">Confidence</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function FactorItem({ factor }: { factor: ReasonFactor }) {
  const categoryConfig = REASON_CATEGORY_CONFIG[factor.category];
  const impactConfig = IMPACT_CONFIG[factor.impact];
  const Icon = categoryConfig?.icon || Target;

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className={cn('p-1.5 rounded-full shrink-0', categoryConfig?.bgColor)}>
        <Icon className={cn('h-3.5 w-3.5', categoryConfig?.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{factor.name}</span>
          <Badge
            variant="outline"
            className={cn('text-xs', impactConfig.color)}
          >
            {factor.impact}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{factor.description}</p>
        <div className="mt-1.5">
          <Progress value={factor.score * 100} className="h-1" />
        </div>
      </div>
    </div>
  );
}

function ContextItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string | string[];
}) {
  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm">{displayValue}</div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecommendationReasonDisplay({
  className,
  recommendation,
  mode = 'card',
  reasoning,
  showConfidence = true,
  showFactors = true,
  defaultExpanded = false,
}: RecommendationReasonDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Generate mock reasoning if not provided
  const displayReasoning = useMemo<RecommendationReasoning>(() => {
    if (reasoning) return reasoning;

    // Generate from recommendation metadata
    const confidence = recommendation.metadata?.confidence ?? 0.75;

    return {
      confidence,
      primaryReason: 'goal_alignment' as ReasonCategory,
      factors: [
        {
          name: 'Goal Progress',
          category: 'goal_alignment' as ReasonCategory,
          score: 0.85,
          description: 'Aligns with your active learning goals',
          impact: 'high' as const,
        },
        {
          name: 'Time Fit',
          category: 'optimal_timing' as ReasonCategory,
          score: 0.9,
          description: 'Fits your available study time',
          impact: 'medium' as const,
        },
        {
          name: 'Skill Gap',
          category: 'knowledge_gap' as ReasonCategory,
          score: 0.7,
          description: 'Addresses areas for improvement',
          impact: 'high' as const,
        },
      ],
      context: {
        currentGoals: ['Complete course'],
        recentStrengths: ['Problem solving'],
        recentStruggles: ['Time management'],
        timeAvailable: 30,
        learningStyle: 'Visual',
      },
    };
  }, [reasoning, recommendation.metadata?.confidence]);

  const primaryConfig = REASON_CATEGORY_CONFIG[displayReasoning.primaryReason];
  const PrimaryIcon = primaryConfig?.icon || Lightbulb;

  // Inline mode - simple one-liner
  if (mode === 'inline') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm',
          primaryConfig?.color,
          className
        )}
      >
        <PrimaryIcon className="h-4 w-4" />
        <span>{recommendation.reason}</span>
        {showConfidence && (
          <Badge variant="outline" className="text-xs">
            {Math.round(displayReasoning.confidence * 100)}% match
          </Badge>
        )}
      </div>
    );
  }

  // Tooltip mode - hover to see details
  if (mode === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1.5 text-sm cursor-help',
                primaryConfig?.color,
                className
              )}
            >
              <Lightbulb className="h-4 w-4" />
              <span className="underline decoration-dotted">
                Why recommended?
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PrimaryIcon className={cn('h-4 w-4', primaryConfig?.color)} />
                <span className="font-medium">{primaryConfig?.label}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {recommendation.reason}
              </p>
              {showConfidence && <ConfidenceBar confidence={displayReasoning.confidence} />}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Card mode - full expandable details
  return (
    <Card className={cn('overflow-hidden', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-full', primaryConfig?.bgColor)}>
                  <Lightbulb className={cn('h-5 w-5', primaryConfig?.color)} />
                </div>
                <div>
                  <CardTitle className="text-base">Why This Recommendation?</CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    {primaryConfig?.label}: {recommendation.reason}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showConfidence && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      displayReasoning.confidence >= 0.8
                        ? 'text-green-600 bg-green-50'
                        : displayReasoning.confidence >= 0.6
                        ? 'text-amber-600 bg-amber-50'
                        : 'text-red-600 bg-red-50'
                    )}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    {Math.round(displayReasoning.confidence * 100)}% match
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Confidence bar */}
            {showConfidence && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <ConfidenceBar confidence={displayReasoning.confidence} />
              </div>
            )}

            {/* Contributing factors */}
            {showFactors && displayReasoning.factors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Brain className="h-4 w-4 text-blue-500" />
                  Contributing Factors
                </div>
                <div className="space-y-1">
                  {displayReasoning.factors.map((factor, index) => (
                    <FactorItem key={index} factor={factor} />
                  ))}
                </div>
              </div>
            )}

            {/* Learning context */}
            {displayReasoning.context && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Your Learning Context
                </div>
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {displayReasoning.context.currentGoals &&
                    displayReasoning.context.currentGoals.length > 0 && (
                      <ContextItem
                        icon={Target}
                        label="Current Goals"
                        value={displayReasoning.context.currentGoals}
                      />
                    )}
                  {displayReasoning.context.timeAvailable && (
                    <ContextItem
                      icon={Clock}
                      label="Available Time"
                      value={`${displayReasoning.context.timeAvailable} min`}
                    />
                  )}
                  {displayReasoning.context.learningStyle && (
                    <ContextItem
                      icon={Brain}
                      label="Learning Style"
                      value={displayReasoning.context.learningStyle}
                    />
                  )}
                  {displayReasoning.context.recentStrengths &&
                    displayReasoning.context.recentStrengths.length > 0 && (
                      <ContextItem
                        icon={TrendingUp}
                        label="Strengths"
                        value={displayReasoning.context.recentStrengths}
                      />
                    )}
                </div>
              </div>
            )}

            {/* Alternatives considered */}
            {displayReasoning.alternatives && displayReasoning.alternatives.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4 text-gray-500" />
                  Also Considered
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayReasoning.alternatives.map((alt, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs text-gray-500"
                    >
                      {alt.title} ({Math.round(alt.score * 100)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default RecommendationReasonDisplay;
