'use client';

/**
 * QualityMetricsPanel
 *
 * Displays response quality metrics and trends.
 * Monitors AI performance and educational effectiveness.
 *
 * Features:
 * - Quality score overview
 * - Dimension breakdown
 * - Historical trends
 * - Feedback analysis
 * - Improvement tracking
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  BookOpen,
  Target,
  Brain,
  Sparkles,
  Shield,
  RefreshCw,
  Loader2,
  Info,
  Award,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface QualityMetricsPanelProps {
  className?: string;
  /** Time period */
  period?: 'day' | 'week' | 'month';
  /** Callback when period changes */
  onPeriodChange?: (period: 'day' | 'week' | 'month') => void;
  /** Callback for refresh */
  onRefresh?: () => Promise<void>;
  /** Show detailed breakdown */
  showBreakdown?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
}

interface QualityMetrics {
  /** Overall quality score (0-100) */
  overallScore: number;
  /** Trend compared to previous period */
  trend: 'improving' | 'stable' | 'declining';
  /** Trend percentage */
  trendPercentage: number;
  /** Individual dimension scores */
  dimensions: QualityDimension[];
  /** Feedback summary */
  feedback: FeedbackSummary;
  /** Quality gates passed */
  qualityGates: QualityGate[];
  /** Response count */
  responseCount: number;
  /** Last updated */
  lastUpdated: string;
}

interface QualityDimension {
  name: string;
  score: number;
  category: 'relevance' | 'accuracy' | 'helpfulness' | 'clarity' | 'safety';
  description: string;
  trend: 'up' | 'down' | 'stable';
}

interface FeedbackSummary {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  topPositiveReasons: string[];
  topNegativeReasons: string[];
  netPromoterScore?: number;
}

interface QualityGate {
  name: string;
  passed: boolean;
  passRate: number;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DIMENSION_ICONS: Record<QualityDimension['category'], typeof Star> = {
  relevance: Target,
  accuracy: Shield,
  helpfulness: Star,
  clarity: MessageSquare,
  safety: Brain,
};

const DIMENSION_COLORS: Record<QualityDimension['category'], string> = {
  relevance: 'text-blue-500',
  accuracy: 'text-green-500',
  helpfulness: 'text-amber-500',
  clarity: 'text-purple-500',
  safety: 'text-red-500',
};

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 80) return { label: 'Good', color: 'text-blue-600' };
  if (score >= 70) return { label: 'Fair', color: 'text-amber-600' };
  return { label: 'Needs Improvement', color: 'text-orange-600' };
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ScoreCircle({ score }: { score: number }) {
  const { label, color } = getScoreLabel(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <div className="relative h-32 w-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-100 dark:text-gray-800"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={color.replace('text-', 'text-')}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold', color)}>{score}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    </div>
  );
}

function DimensionRow({ dimension }: { dimension: QualityDimension }) {
  const Icon = DIMENSION_ICONS[dimension.category];
  const color = DIMENSION_COLORS[dimension.category];
  const TrendIcon =
    dimension.trend === 'up'
      ? TrendingUp
      : dimension.trend === 'down'
      ? TrendingDown
      : Minus;
  const trendColor =
    dimension.trend === 'up'
      ? 'text-green-500'
      : dimension.trend === 'down'
      ? 'text-red-500'
      : 'text-gray-400';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', color)} />
          <span className="text-sm font-medium">{dimension.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{dimension.score}%</span>
          <TrendIcon className={cn('h-3 w-3', trendColor)} />
        </div>
      </div>
      <Progress value={dimension.score} className="h-1.5" />
      <p className="text-xs text-gray-500">{dimension.description}</p>
    </div>
  );
}

function FeedbackSummaryCard({ feedback }: { feedback: FeedbackSummary }) {
  const positiveRate =
    feedback.totalFeedback > 0
      ? (feedback.positiveCount / feedback.totalFeedback) * 100
      : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Total Feedback</span>
        <span className="text-sm font-medium">
          {feedback.totalFeedback.toLocaleString()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-green-600">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm font-medium">{feedback.positiveCount}</span>
        </div>
        <div className="flex items-center gap-1 text-red-600">
          <ThumbsDown className="h-4 w-4" />
          <span className="text-sm font-medium">{feedback.negativeCount}</span>
        </div>
        <div className="flex-1">
          <Progress value={positiveRate} className="h-2" />
        </div>
        <span className="text-xs text-gray-500">
          {positiveRate.toFixed(0)}% positive
        </span>
      </div>

      {feedback.netPromoterScore !== undefined && (
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <span className="text-xs text-gray-500">Net Promoter Score</span>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              feedback.netPromoterScore >= 50
                ? 'text-green-600 bg-green-50'
                : feedback.netPromoterScore >= 0
                ? 'text-amber-600 bg-amber-50'
                : 'text-red-600 bg-red-50'
            )}
          >
            {feedback.netPromoterScore >= 0 ? '+' : ''}
            {feedback.netPromoterScore}
          </Badge>
        </div>
      )}

      {/* Top reasons */}
      <div className="grid grid-cols-2 gap-3">
        {feedback.topPositiveReasons.length > 0 && (
          <div>
            <div className="text-xs font-medium text-green-600 mb-1">
              Top Positive
            </div>
            <ul className="space-y-1">
              {feedback.topPositiveReasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">+</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        {feedback.topNegativeReasons.length > 0 && (
          <div>
            <div className="text-xs font-medium text-red-600 mb-1">
              Areas to Improve
            </div>
            <ul className="space-y-1">
              {feedback.topNegativeReasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-red-500 mt-0.5">-</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function QualityGatesSection({ gates }: { gates: QualityGate[] }) {
  const passedCount = gates.filter((g) => g.passed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Quality Gates</span>
        <Badge variant="outline" className="text-xs">
          {passedCount}/{gates.length} passing
        </Badge>
      </div>

      <div className="space-y-2">
        {gates.map((gate) => (
          <div
            key={gate.name}
            className={cn(
              'flex items-center justify-between p-2 rounded-lg',
              gate.passed
                ? 'bg-green-50 dark:bg-green-950/30'
                : 'bg-red-50 dark:bg-red-950/30'
            )}
          >
            <div className="flex items-center gap-2">
              {gate.passed ? (
                <Award className="h-4 w-4 text-green-500" />
              ) : (
                <Shield className="h-4 w-4 text-red-500" />
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm">{gate.name}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{gate.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                gate.passed ? 'text-green-600' : 'text-red-600'
              )}
            >
              {gate.passRate.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QualityMetricsPanel({
  className,
  period = 'week',
  onPeriodChange,
  onRefresh,
  showBreakdown = true,
  refreshInterval,
}: QualityMetricsPanelProps) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dimensions' | 'feedback' | 'gates'>(
    'dimensions'
  );

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/sam/agentic/analytics/quality?period=${period}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMetrics(result.data);
        }
      }
    } catch (error) {
      console.error('[QualityMetricsPanel] Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    await fetchMetrics();
    setIsRefreshing(false);
  }, [onRefresh, fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchMetrics]);

  // Trend indicator
  const TrendIcon =
    metrics?.trend === 'improving'
      ? TrendingUp
      : metrics?.trend === 'declining'
      ? TrendingDown
      : Minus;
  const trendColor =
    metrics?.trend === 'improving'
      ? 'text-green-500'
      : metrics?.trend === 'declining'
      ? 'text-red-500'
      : 'text-gray-400';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">Quality Metrics</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Monitor AI response quality and effectiveness
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <LoadingState />
        ) : metrics ? (
          <>
            {/* Period selector */}
            {onPeriodChange && (
              <div className="flex items-center justify-center gap-1">
                {(['day', 'week', 'month'] as const).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onPeriodChange(p)}
                    className="h-7 text-xs capitalize"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            )}

            {/* Overall score */}
            <div className="flex flex-col items-center">
              <ScoreCircle score={metrics.overallScore} />
              <div className="flex items-center gap-2 mt-2">
                <TrendIcon className={cn('h-4 w-4', trendColor)} />
                <span className={cn('text-sm', trendColor)}>
                  {metrics.trendPercentage >= 0 ? '+' : ''}
                  {metrics.trendPercentage.toFixed(1)}% vs last {period}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Based on {metrics.responseCount.toLocaleString()} responses
              </div>
            </div>

            {/* Breakdown tabs */}
            {showBreakdown && (
              <Tabs
                value={activeTab}
                onValueChange={(v) =>
                  setActiveTab(v as 'dimensions' | 'feedback' | 'gates')
                }
              >
                <TabsList className="w-full">
                  <TabsTrigger value="dimensions" className="flex-1">
                    Dimensions
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="flex-1">
                    Feedback
                  </TabsTrigger>
                  <TabsTrigger value="gates" className="flex-1">
                    Gates
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="dimensions" className="mt-3 space-y-4">
                  {metrics.dimensions.map((dimension, index) => (
                    <DimensionRow key={index} dimension={dimension} />
                  ))}
                </TabsContent>

                <TabsContent value="feedback" className="mt-3">
                  <FeedbackSummaryCard feedback={metrics.feedback} />
                </TabsContent>

                <TabsContent value="gates" className="mt-3">
                  <QualityGatesSection gates={metrics.qualityGates} />
                </TabsContent>
              </Tabs>
            )}

            {/* Last updated */}
            <div className="text-xs text-gray-400 text-right">
              Updated: {new Date(metrics.lastUpdated).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Info className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">Unable to load metrics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QualityMetricsPanel;
