'use client';

/**
 * CognitiveLoadMonitor Component
 *
 * Real-time cognitive load monitoring widget for learners.
 * Tracks and displays current cognitive load levels with:
 * - Visual load gauge (0-100)
 * - Load factor breakdown (intrinsic, extraneous, germane)
 * - Trend indicators
 * - Risk level alerts
 * - Actionable recommendations
 * - Historical load chart
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Info,
  Lightbulb,
  Coffee,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronUp,
  BarChart3,
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

interface CognitiveLoadFactors {
  intrinsicLoad: number;
  extraneousLoad: number;
  germaneLoad: number;
}

interface CognitiveLoadData {
  id: string;
  sessionId: string;
  instantaneousLoad: number;
  factors: CognitiveLoadFactors;
  trend: 'increasing' | 'stable' | 'decreasing';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  interventionSuggested: boolean;
  analyzedAt: string;
}

interface SessionMetrics {
  sessionId: string;
  courseId?: string;
  sectionId?: string;
  topicComplexity?: number;
  contentDensity?: number;
  timeOnTask?: number;
  idleTime?: number;
  clickCount?: number;
  scrollCount?: number;
  hintRequests?: number;
  errorCount?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  averageResponseTime?: number;
  frustrationIndicators?: number;
  engagementLevel?: number;
}

interface CognitiveLoadMonitorProps {
  sessionId: string;
  courseId?: string;
  sectionId?: string;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  compact?: boolean;
  onLoadChange?: (load: CognitiveLoadData) => void;
  onInterventionNeeded?: (data: CognitiveLoadData) => void;
  metrics?: Partial<SessionMetrics>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RISK_COLORS = {
  low: 'text-green-500 bg-green-500/10 border-green-500/30',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  critical: 'text-red-500 bg-red-500/10 border-red-500/30',
};

const TREND_ICONS = {
  increasing: TrendingUp,
  stable: Minus,
  decreasing: TrendingDown,
};

const TREND_COLORS = {
  increasing: 'text-red-500',
  stable: 'text-yellow-500',
  decreasing: 'text-green-500',
};

const FACTOR_INFO = {
  intrinsicLoad: {
    label: 'Intrinsic Load',
    description: 'Cognitive effort required by the content complexity',
    icon: BookOpen,
    color: 'bg-blue-500',
  },
  extraneousLoad: {
    label: 'Extraneous Load',
    description: 'Load from poor design or distractions',
    icon: Zap,
    color: 'bg-red-500',
  },
  germaneLoad: {
    label: 'Germane Load',
    description: 'Productive effort devoted to learning',
    icon: Lightbulb,
    color: 'bg-green-500',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadGauge({ value, riskLevel }: { value: number; riskLevel: string }) {
  const getColor = (load: number) => {
    if (load >= 90) return 'stroke-red-500 text-red-500';
    if (load >= 75) return 'stroke-orange-500 text-orange-500';
    if (load >= 55) return 'stroke-yellow-500 text-yellow-500';
    if (load >= 30) return 'stroke-blue-500 text-blue-500';
    return 'stroke-green-500 text-green-500';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-500', getColor(value))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Brain className={cn('w-6 h-6 mb-1', getColor(value))} />
        <span className={cn('text-2xl font-bold', getColor(value))}>
          {Math.round(value)}
        </span>
        <span className="text-xs text-muted-foreground capitalize">{riskLevel}</span>
      </div>
    </div>
  );
}

function FactorBar({
  factor,
  value,
}: {
  factor: keyof typeof FACTOR_INFO;
  value: number;
}) {
  const info = FACTOR_INFO[factor];
  const Icon = info.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                {info.label}
              </span>
              <span className="font-medium">{Math.round(value)}%</span>
            </div>
            <Progress value={value} className="h-2" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-sm">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function RecommendationItem({ text, index }: { text: string; index: number }) {
  const icons = [Lightbulb, Coffee, BookOpen, Activity, Brain];
  const Icon = icons[index % icons.length];

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
      <div className="p-1.5 rounded-md bg-primary/10">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function LoadHistory({
  history,
}: {
  history: Array<{ load: number; timestamp: string }>;
}) {
  if (history.length < 2) return null;

  const maxLoad = Math.max(...history.map((h) => h.load));
  const minLoad = Math.min(...history.map((h) => h.load));
  const range = maxLoad - minLoad || 1;

  return (
    <div className="mt-4 p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Recent Load History</span>
      </div>
      <div className="flex items-end gap-1 h-12">
        {history.slice(-10).map((h, i) => {
          const height = ((h.load - minLoad) / range) * 100;
          const color =
            h.load >= 75
              ? 'bg-red-500'
              : h.load >= 55
                ? 'bg-yellow-500'
                : 'bg-green-500';

          return (
            <TooltipProvider key={i}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn('flex-1 rounded-t transition-all', color)}
                    style={{ height: `${Math.max(10, height)}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    {Math.round(h.load)}% at{' '}
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CognitiveLoadMonitor({
  sessionId,
  courseId,
  sectionId,
  className,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  compact = false,
  onLoadChange,
  onInterventionNeeded,
  metrics = {},
}: CognitiveLoadMonitorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CognitiveLoadData | null>(null);
  const [history, setHistory] = useState<Array<{ load: number; timestamp: string }>>([]);
  const [expanded, setExpanded] = useState(false);

  const previousLoadRef = useRef<number | undefined>(undefined);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCognitiveLoad = useCallback(async () => {
    if (!sessionId) return;

    try {
      const requestBody = {
        sessionId,
        courseId,
        sectionId,
        previousLoad: previousLoadRef.current,
        ...metrics,
      };

      const response = await fetch('/api/sam/cognitive-load/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? 'Failed to analyze cognitive load');
      }

      const newData = result.data as CognitiveLoadData;
      setData(newData);
      setError(null);

      // Update history
      setHistory((prev) => [
        ...prev.slice(-19),
        { load: newData.instantaneousLoad, timestamp: newData.analyzedAt },
      ]);

      // Store for next request
      previousLoadRef.current = newData.instantaneousLoad;

      // Callbacks
      if (onLoadChange) {
        onLoadChange(newData);
      }

      if (newData.interventionSuggested && onInterventionNeeded) {
        onInterventionNeeded(newData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [sessionId, courseId, sectionId, metrics, onLoadChange, onInterventionNeeded]);

  useEffect(() => {
    fetchCognitiveLoad();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchCognitiveLoad, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchCognitiveLoad, autoRefresh, refreshInterval]);

  if (loading && !data) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Analyzing cognitive load...</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchCognitiveLoad}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const TrendIcon = TREND_ICONS[data.trend];

  // Compact view
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border',
          RISK_COLORS[data.riskLevel],
          className
        )}
      >
        <div className="relative">
          <Brain className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background flex items-center justify-center">
            <TrendIcon className={cn('w-3 h-3', TREND_COLORS[data.trend])} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Cognitive Load: {Math.round(data.instantaneousLoad)}%
            </span>
            <Badge variant="outline" className="text-xs">
              {data.riskLevel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {data.recommendations[0] ?? 'Monitoring cognitive load...'}
          </p>
        </div>
        {data.interventionSuggested && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Consider taking a break</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // Full view
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Cognitive Load Monitor
            </CardTitle>
            <CardDescription>Real-time mental workload assessment</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <Button variant="outline" size="sm" onClick={fetchCognitiveLoad}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Main Display */}
        <div className="flex items-center gap-6 mb-6">
          <LoadGauge value={data.instantaneousLoad} riskLevel={data.riskLevel} />

          <div className="flex-1 space-y-4">
            {/* Risk and Trend */}
            <div className="flex items-center gap-4">
              <Badge className={cn('text-sm', RISK_COLORS[data.riskLevel])}>
                {data.riskLevel.toUpperCase()} Risk
              </Badge>
              <div className={cn('flex items-center gap-1', TREND_COLORS[data.trend])}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-sm capitalize">{data.trend}</span>
              </div>
              {data.interventionSuggested && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Break Recommended
                </Badge>
              )}
            </div>

            {/* Factor Breakdown */}
            <div className="space-y-2">
              <FactorBar factor="intrinsicLoad" value={data.factors.intrinsicLoad} />
              <FactorBar factor="extraneousLoad" value={data.factors.extraneousLoad} />
              <FactorBar factor="germaneLoad" value={data.factors.germaneLoad} />
            </div>
          </div>
        </div>

        {/* Expandable Section */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            {data.recommendations.length} Recommendation
            {data.recommendations.length !== 1 ? 's' : ''}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {expanded && (
          <div className="mt-4 space-y-2">
            {data.recommendations.map((rec, i) => (
              <RecommendationItem key={i} text={rec} index={i} />
            ))}

            {/* Load History Chart */}
            <LoadHistory history={history} />
          </div>
        )}

        {/* Last Updated */}
        <div className="mt-4 pt-3 border-t text-xs text-muted-foreground text-center">
          Last analyzed: {new Date(data.analyzedAt).toLocaleTimeString()}
          {autoRefresh && (
            <span className="ml-2">
              &bull; Auto-refresh every {Math.round(refreshInterval / 1000)}s
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CognitiveLoadMonitor;
