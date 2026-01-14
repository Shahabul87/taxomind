'use client';

/**
 * PredictiveInsights Component
 *
 * AI-powered learning outcome predictions and analytics visualization.
 *
 * Features:
 * - Learning outcome predictions
 * - Risk assessment
 * - Performance forecasting
 * - Intervention recommendations
 * - Trend analysis
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ChevronRight,
  Sparkles,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Zap,
  AlertCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Trophy,
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

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type Trend = 'improving' | 'stable' | 'declining';

interface Prediction {
  id: string;
  type: 'grade' | 'completion' | 'mastery' | 'engagement';
  title: string;
  predictedValue: number;
  confidence: number;
  trend: Trend;
  changePercent: number;
  factors: PredictionFactor[];
  timestamp: string;
}

interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
}

interface RiskAssessment {
  id: string;
  category: string;
  level: RiskLevel;
  probability: number;
  impact: string;
  mitigations: string[];
  deadline?: string;
}

interface PerformanceForecast {
  period: string;
  predictedScore: number;
  confidence: number;
  trend: Trend;
  milestone?: string;
}

interface Intervention {
  id: string;
  type: 'study' | 'practice' | 'review' | 'support';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: number;
  timeRequired: number;
  deadline?: string;
}

interface PredictiveInsightsData {
  predictions: Prediction[];
  risks: RiskAssessment[];
  forecasts: PerformanceForecast[];
  interventions: Intervention[];
  overallOutlook: 'positive' | 'neutral' | 'concerning';
  confidenceScore: number;
  lastUpdated: string;
}

interface PredictiveInsightsProps {
  className?: string;
  compact?: boolean;
  courseId?: string;
  userId?: string;
  onInterventionClick?: (intervention: Intervention) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RISK_LEVEL_CONFIG = {
  low: { color: 'bg-green-500/10 text-green-600 border-green-500/30', icon: CheckCircle2 },
  medium: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', icon: AlertCircle },
  high: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', icon: AlertTriangle },
  critical: { color: 'bg-red-500/10 text-red-600 border-red-500/30', icon: AlertTriangle },
};

const PREDICTION_TYPE_CONFIG = {
  grade: { icon: Trophy, color: 'text-yellow-500 bg-yellow-500/10', label: 'Grade' },
  completion: { icon: CheckCircle2, color: 'text-green-500 bg-green-500/10', label: 'Completion' },
  mastery: { icon: Target, color: 'text-blue-500 bg-blue-500/10', label: 'Mastery' },
  engagement: { icon: Activity, color: 'text-purple-500 bg-purple-500/10', label: 'Engagement' },
};

const INTERVENTION_TYPE_CONFIG = {
  study: { icon: BookOpen, color: 'text-blue-500' },
  practice: { icon: Target, color: 'text-green-500' },
  review: { icon: RefreshCw, color: 'text-orange-500' },
  support: { icon: Zap, color: 'text-purple-500' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function OutlookIndicator({ outlook, confidence }: { outlook: 'positive' | 'neutral' | 'concerning'; confidence: number }) {
  const config = {
    positive: { icon: TrendingUp, color: 'from-green-500/20 to-emerald-500/20', textColor: 'text-green-600', label: 'Positive Outlook' },
    neutral: { icon: Minus, color: 'from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-600', label: 'Neutral Outlook' },
    concerning: { icon: TrendingDown, color: 'from-orange-500/20 to-red-500/20', textColor: 'text-orange-600', label: 'Needs Attention' },
  };

  const { icon: Icon, color, textColor, label } = config[outlook];

  return (
    <div className={cn('p-4 rounded-xl bg-gradient-to-br', color)}>
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-background/50">
          <Icon className={cn('w-6 h-6', textColor)} />
        </div>
        <div>
          <span className={cn('font-semibold', textColor)}>{label}</span>
          <p className="text-sm text-muted-foreground">{confidence}% confidence</p>
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const config = PREDICTION_TYPE_CONFIG[prediction.type];
  const Icon = config.icon;
  const TrendIcon = prediction.trend === 'improving' ? TrendingUp :
    prediction.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = prediction.trend === 'improving' ? 'text-green-500' :
    prediction.trend === 'declining' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="p-4 rounded-xl bg-card border hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', config.color)}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{prediction.title}</span>
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
          </div>

          <div className="flex items-end gap-4">
            <div>
              <span className="text-2xl font-bold">{prediction.predictedValue}%</span>
              <span className={cn('text-sm ml-2', trendColor)}>
                {prediction.changePercent > 0 ? '+' : ''}{prediction.changePercent}%
              </span>
            </div>
            <div className="flex-1">
              <Progress value={prediction.predictedValue} className="h-2" />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{prediction.confidence}% confidence</span>
          </div>
        </div>
      </div>

      {/* Top factors */}
      {prediction.factors.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <span className="text-xs text-muted-foreground">Key factors:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {prediction.factors.slice(0, 3).map((factor, i) => (
              <Badge
                key={i}
                variant="outline"
                className={cn(
                  'text-xs',
                  factor.direction === 'positive' ? 'border-green-500/30 text-green-600' :
                  factor.direction === 'negative' ? 'border-red-500/30 text-red-600' :
                  'border-gray-500/30'
                )}
              >
                {factor.direction === 'positive' ? <ArrowUpRight className="w-3 h-3 mr-1" /> :
                 factor.direction === 'negative' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                {factor.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskCard({ risk }: { risk: RiskAssessment }) {
  const config = RISK_LEVEL_CONFIG[risk.level];
  const Icon = config.icon;

  return (
    <div className={cn('p-3 rounded-lg border', config.color)}>
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{risk.category}</span>
            <Badge variant="outline" className="text-xs capitalize">{risk.level}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{risk.impact}</p>
          {risk.mitigations.length > 0 && (
            <div className="text-xs">
              <span className="font-medium">Mitigation:</span> {risk.mitigations[0]}
            </div>
          )}
        </div>
        <span className="text-lg font-bold">{risk.probability}%</span>
      </div>
    </div>
  );
}

function ForecastTimeline({ forecasts }: { forecasts: PerformanceForecast[] }) {
  return (
    <div className="space-y-2">
      {forecasts.map((forecast, i) => {
        const TrendIcon = forecast.trend === 'improving' ? TrendingUp :
          forecast.trend === 'declining' ? TrendingDown : Minus;

        return (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <div className="text-center w-16">
              <span className="text-xs text-muted-foreground">{forecast.period}</span>
            </div>
            <div className="flex-1">
              <Progress value={forecast.predictedScore} className="h-2" />
            </div>
            <div className="flex items-center gap-2 w-20">
              <span className="font-semibold">{forecast.predictedScore}%</span>
              <TrendIcon className={cn(
                'w-4 h-4',
                forecast.trend === 'improving' ? 'text-green-500' :
                forecast.trend === 'declining' ? 'text-red-500' : 'text-gray-500'
              )} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InterventionCard({ intervention, onClick }: { intervention: Intervention; onClick?: () => void }) {
  const config = INTERVENTION_TYPE_CONFIG[intervention.type];
  const Icon = config.icon;

  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-blue-500',
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg bg-card border-l-4 hover:shadow-md transition-all cursor-pointer',
        priorityColors[intervention.priority]
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5', config.color)} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{intervention.title}</span>
            <Badge variant="secondary" className="text-xs">
              +{intervention.expectedImpact}% impact
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{intervention.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {intervention.timeRequired} min
            </span>
            {intervention.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due {new Date(intervention.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PredictiveInsights({
  className,
  compact = false,
  courseId,
  userId,
  onInterventionClick,
}: PredictiveInsightsProps) {
  const [data, setData] = useState<PredictiveInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (userId) params.append('userId', userId);

      const res = await fetch(`/api/sam/agentic/analytics/predictions?${params}`);

      if (!res.ok) throw new Error('Failed to fetch predictions');

      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [courseId, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your learning patterns...</p>
          </div>
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

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-4">
            <LineChart className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-1">No Predictions Yet</h3>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Continue learning to unlock AI-powered predictions about your progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <LineChart className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Predictive Insights</CardTitle>
              <CardDescription>AI-powered learning outcome predictions</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Outlook */}
        <OutlookIndicator outlook={data.overallOutlook} confidence={data.confidenceScore} />

        {/* Predictions */}
        {data.predictions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Key Predictions
            </h4>
            <div className="grid gap-3">
              {data.predictions.slice(0, compact ? 2 : 4).map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {!compact && data.risks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Risk Assessment
            </h4>
            <div className="space-y-2">
              {data.risks.slice(0, 3).map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          </div>
        )}

        {/* Performance Forecast */}
        {!compact && data.forecasts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Performance Forecast
            </h4>
            <ForecastTimeline forecasts={data.forecasts} />
          </div>
        )}

        {/* Interventions */}
        {data.interventions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Recommended Actions
            </h4>
            <div className="space-y-2">
              {data.interventions.slice(0, compact ? 2 : 4).map((intervention) => (
                <InterventionCard
                  key={intervention.id}
                  intervention={intervention}
                  onClick={() => onInterventionClick?.(intervention)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Last updated */}
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          Updated {new Date(data.lastUpdated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default PredictiveInsights;
