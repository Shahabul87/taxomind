'use client';

/**
 * MetaLearningInsightsWidget Component
 *
 * Displays meta-learning analytics, patterns, and system insights
 * from the SAM AI system.
 *
 * Features:
 * - Overall effectiveness score
 * - Pattern detection summary
 * - Active insights with recommendations
 * - Trend visualization
 * - Strategy performance overview
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Info,
  Lightbulb,
  Target,
  BarChart3,
  Activity,
  Sparkles,
  ChevronRight,
  Zap,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PatternsByCategory {
  teaching_strategy: number;
  student_behavior: number;
  content_effectiveness: number;
  engagement_pattern: number;
  error_pattern: number;
  success_pattern: number;
  interaction_style: number;
}

interface StrategyRanking {
  strategyId: string;
  strategyName: string;
  score: number;
  usageCount: number;
  trend: 'up' | 'down' | 'stable';
}

interface TrendData {
  direction: 'improving' | 'declining' | 'stable';
  changeRate: number;
  confidence: number;
}

interface MetaLearningAnalytics {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  patternsIdentified: number;
  highConfidencePatterns: number;
  newPatterns: number;
  patternsByCategory: PatternsByCategory;
  strategiesEvaluated: number;
  topStrategies: StrategyRanking[];
  underperformingStrategies: StrategyRanking[];
  overallEffectiveness: number;
  improvementFromBaseline: number;
  calibrationAccuracy: number;
  insightsGenerated: number;
  criticalInsights: number;
  actionableRecommendations: number;
  effectivenessTrend: TrendData;
  engagementTrend: TrendData;
  errorRateTrend: TrendData;
  generatedAt: string;
}

interface InsightRecommendation {
  id: string;
  action: string;
  rationale: string;
  priority: number;
  effort: 'low' | 'medium' | 'high';
  expectedOutcome: string;
}

interface MetaLearningInsight {
  id: string;
  type: 'optimization' | 'warning' | 'recommendation' | 'trend' | 'anomaly';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  evidence: string[];
  recommendations: InsightRecommendation[];
  confidence: number;
  expectedImpact: number;
  affectedAreas: string[];
  timeframe: string;
  generatedAt: string;
  validUntil?: string;
}

interface MetaLearningInsightsWidgetProps {
  className?: string;
  compact?: boolean;
  showPatterns?: boolean;
  showStrategies?: boolean;
  period?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'all_time';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_COLORS = {
  critical: 'text-red-500 bg-red-500/10 border-red-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  info: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
};

const TYPE_ICONS = {
  optimization: Zap,
  warning: AlertTriangle,
  recommendation: Lightbulb,
  trend: TrendingUp,
  anomaly: AlertCircle,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EffectivenessGauge({ score, trend }: { score: number; trend: TrendData }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'stroke-green-500';
    if (s >= 60) return 'stroke-blue-500';
    if (s >= 40) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
        <circle
          className="stroke-muted"
          strokeWidth="8"
          fill="none"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          className={cn('transition-all duration-1000', getColor(score))}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          r="45"
          cx="50"
          cy="50"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold">{Math.round(score)}%</span>
        <span className="text-xs text-muted-foreground">Effectiveness</span>
        {trend.direction !== 'stable' && (
          <div className="flex items-center gap-1 mt-1">
            {trend.direction === 'improving' ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className={cn(
              'text-xs',
              trend.direction === 'improving' ? 'text-green-500' : 'text-red-500'
            )}>
              {(trend.changeRate * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function PatternSummary({ patterns }: { patterns: PatternsByCategory }) {
  const categories = [
    { key: 'success_pattern' as const, label: 'Success', color: 'bg-green-500' },
    { key: 'engagement_pattern' as const, label: 'Engagement', color: 'bg-blue-500' },
    { key: 'teaching_strategy' as const, label: 'Strategy', color: 'bg-purple-500' },
    { key: 'error_pattern' as const, label: 'Errors', color: 'bg-red-500' },
  ];

  const total = Object.values(patterns).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      {categories.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-20">{label}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', color)}
              style={{ width: `${total > 0 ? (patterns[key] / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-medium w-6 text-right">{patterns[key]}</span>
        </div>
      ))}
    </div>
  );
}

function InsightCard({ insight, compact }: { insight: MetaLearningInsight; compact?: boolean }) {
  const Icon = TYPE_ICONS[insight.type];

  return (
    <div className={cn(
      'p-3 rounded-lg border transition-colors hover:bg-muted/50',
      PRIORITY_COLORS[insight.priority]
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-1.5 rounded-md',
          PRIORITY_COLORS[insight.priority].split(' ')[1]
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{insight.title}</h4>
            <Badge variant="outline" className="text-xs">
              {insight.type}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {insight.description}
          </p>
          {!compact && insight.recommendations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-dashed">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lightbulb className="w-3 h-3" />
                <span>{insight.recommendations.length} recommendation(s)</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-muted-foreground">
            {Math.round(insight.confidence * 100)}% confident
          </span>
          {insight.expectedImpact > 0 && (
            <span className="text-xs text-green-500">
              +{insight.expectedImpact}% impact
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StrategyList({ strategies, title }: { strategies: StrategyRanking[]; title: string }) {
  if (strategies.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      {strategies.slice(0, 3).map((strategy) => (
        <div key={strategy.strategyId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
          <div className="flex items-center gap-2">
            {strategy.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
            {strategy.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
            {strategy.trend === 'stable' && <Minus className="w-3 h-3 text-gray-500" />}
            <span className="text-sm">{strategy.strategyName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{strategy.usageCount} uses</span>
            <Badge variant={strategy.score >= 50 ? 'default' : 'destructive'} className="text-xs">
              {strategy.score}%
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MetaLearningInsightsWidget({
  className,
  compact = false,
  showPatterns = true,
  showStrategies = true,
  period = 'week',
}: MetaLearningInsightsWidgetProps) {
  const [analytics, setAnalytics] = useState<MetaLearningAnalytics | null>(null);
  const [insights, setInsights] = useState<MetaLearningInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Fetch analytics and insights in parallel
      const [analyticsRes, insightsRes] = await Promise.all([
        fetch(`/api/sam/agentic/meta-learning?action=analytics&period=${period}`),
        fetch(`/api/sam/agentic/meta-learning?action=insights&limit=5`),
      ]);

      if (!analyticsRes.ok || !insightsRes.ok) {
        throw new Error('Failed to fetch meta-learning data');
      }

      const [analyticsData, insightsData] = await Promise.all([
        analyticsRes.json(),
        insightsRes.json(),
      ]);

      if (analyticsData.success) {
        setAnalytics(analyticsData.data.analytics);
      }

      if (insightsData.success) {
        setInsights(insightsData.data.insights);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Meta-Learning Insights</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          AI learning patterns and optimization insights
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Effectiveness Overview */}
        {analytics && (
          <div className="flex items-center gap-6">
            <EffectivenessGauge
              score={analytics.overallEffectiveness}
              trend={analytics.effectivenessTrend}
            />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Patterns Found</span>
                <p className="text-xl font-bold">{analytics.patternsIdentified}</p>
                <span className="text-xs text-green-500">
                  {analytics.highConfidencePatterns} high confidence
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Active Insights</span>
                <p className="text-xl font-bold">{analytics.insightsGenerated}</p>
                {analytics.criticalInsights > 0 && (
                  <span className="text-xs text-red-500">
                    {analytics.criticalInsights} critical
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Calibration</span>
                <p className="text-xl font-bold">
                  {Math.round(analytics.calibrationAccuracy * 100)}%
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Improvement</span>
                <p className={cn(
                  'text-xl font-bold',
                  analytics.improvementFromBaseline >= 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {analytics.improvementFromBaseline >= 0 ? '+' : ''}
                  {Math.round(analytics.improvementFromBaseline)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pattern Summary */}
        {showPatterns && analytics && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Pattern Distribution
            </h3>
            <PatternSummary patterns={analytics.patternsByCategory} />
          </div>
        )}

        {/* Strategy Performance */}
        {showStrategies && analytics && !compact && (
          <div className="grid grid-cols-2 gap-4">
            <StrategyList strategies={analytics.topStrategies} title="Top Strategies" />
            <StrategyList strategies={analytics.underperformingStrategies} title="Needs Improvement" />
          </div>
        )}

        {/* Active Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Active Insights
              <Badge variant="secondary" className="text-xs">
                {insights.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {insights.slice(0, compact ? 2 : 5).map((insight) => (
                <InsightCard key={insight.id} insight={insight} compact={compact} />
              ))}
            </div>
            {insights.length > (compact ? 2 : 5) && (
              <Button variant="ghost" size="sm" className="w-full">
                View all insights
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analytics && insights.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="font-medium">No Learning Data Yet</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Start learning to see patterns and insights from your study sessions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MetaLearningInsightsWidget;
