'use client';

/**
 * ConfidenceCalibrationWidget Component
 *
 * Displays confidence calibration data and threshold recommendations
 * for the SAM AI system. Uses the prediction-calibration service.
 *
 * Features:
 * - Calibration score visualization
 * - Bucket-wise accuracy analysis
 * - Threshold recommendations
 * - Historical calibration trends
 * - Quality indicators
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Info,
  Settings,
  Target,
  BarChart3,
  Activity,
  Sparkles,
  ArrowUp,
  ArrowDown,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface CalibrationBucket {
  rangeStart: number;
  rangeEnd: number;
  count: number;
  avgPredicted: number;
  actualAccuracy: number;
  error: number;
}

interface ThresholdRecommendation {
  type: 'increase' | 'decrease' | 'maintain';
  target: string;
  currentValue: number;
  suggestedValue: number;
  reason: string;
  confidence: number;
  expectedImprovement: string;
}

interface ThresholdConfig {
  directAnswerThreshold: number;
  uncertaintyThreshold: number;
  verificationThreshold: number;
  declineThreshold: number;
}

interface CalibrationReport {
  userId?: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalPredictions: number;
    outcomesRecorded: number;
    avgPredictedConfidence: number;
    avgActualAccuracy: number;
    calibrationError: number;
    brierScore: number;
    verificationOverrideRate: number;
  };
  buckets: CalibrationBucket[];
  byResponseType: Record<string, {
    count: number;
    avgConfidence: number;
    avgAccuracy: number;
    error: number;
  }>;
  recommendations: ThresholdRecommendation[];
  thresholdSuggestions: ThresholdConfig;
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  generatedAt: string;
}

interface ConfidenceCalibrationWidgetProps {
  userId?: string;
  periodDays?: number;
  className?: string;
  compact?: boolean;
  showRecommendations?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const QUALITY_COLORS = {
  excellent: 'text-green-500',
  good: 'text-blue-500',
  fair: 'text-yellow-500',
  poor: 'text-red-500',
};

const QUALITY_BG_COLORS = {
  excellent: 'bg-green-500/10',
  good: 'bg-blue-500/10',
  fair: 'bg-yellow-500/10',
  poor: 'bg-red-500/10',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CalibrationGauge({ score, quality }: { score: number; quality: string }) {
  const getColor = (s: number) => {
    if (s < 5) return 'stroke-green-500';
    if (s < 10) return 'stroke-blue-500';
    if (s < 15) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  // Lower error is better, so we invert for display
  const displayScore = Math.max(0, 100 - score * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-1000', getColor(score * 100))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', QUALITY_COLORS[quality as keyof typeof QUALITY_COLORS])}>
          {(score * 100).toFixed(1)}%
        </span>
        <span className="text-xs text-muted-foreground">error</span>
      </div>
    </div>
  );
}

function BucketChart({ buckets }: { buckets: CalibrationBucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="space-y-2">
      {buckets.map((bucket, i) => (
        <div key={i} className="group">
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="w-20 text-muted-foreground">
              {(bucket.rangeStart * 100).toFixed(0)}-{(bucket.rangeEnd * 100).toFixed(0)}%
            </span>
            <div className="flex-1 relative h-6 bg-muted rounded-sm overflow-hidden">
              {/* Predicted bar */}
              <div
                className="absolute left-0 h-full bg-blue-500/50"
                style={{ width: `${bucket.avgPredicted * 100}%` }}
              />
              {/* Actual bar */}
              <div
                className="absolute left-0 h-full bg-green-500/50"
                style={{ width: `${bucket.actualAccuracy * 100}%` }}
              />
              {/* Error indicator */}
              {bucket.error > 0.1 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                </div>
              )}
            </div>
            <span className="w-12 text-right text-muted-foreground">
              n={bucket.count}
            </span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500/50 rounded-sm" />
          <span>Predicted</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500/50 rounded-sm" />
          <span>Actual</span>
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: ThresholdRecommendation }) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        rec.type === 'increase' && 'border-green-500/30 bg-green-500/5',
        rec.type === 'decrease' && 'border-red-500/30 bg-red-500/5',
        rec.type === 'maintain' && 'border-blue-500/30 bg-blue-500/5'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {rec.type === 'increase' && <ArrowUp className="w-4 h-4 text-green-500" />}
          {rec.type === 'decrease' && <ArrowDown className="w-4 h-4 text-red-500" />}
          {rec.type === 'maintain' && <Minus className="w-4 h-4 text-blue-500" />}
          <span className="font-medium capitalize">{rec.target.replace(/([A-Z])/g, ' $1').trim()}</span>
        </div>
        <Badge variant="outline">
          {Math.round(rec.confidence * 100)}% confidence
        </Badge>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Current:</span>{' '}
          <span className="font-mono">{(rec.currentValue * 100).toFixed(0)}%</span>
        </div>
        <span className="text-muted-foreground">&rarr;</span>
        <div className="text-sm">
          <span className="text-muted-foreground">Suggested:</span>{' '}
          <span className="font-mono font-medium">{(rec.suggestedValue * 100).toFixed(0)}%</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
      <div className="flex items-center gap-2 text-xs">
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-primary">{rec.expectedImprovement}</span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
  format = 'percent',
}: {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  format?: 'percent' | 'number' | 'decimal';
}) {
  const formatValue = (v: number) => {
    switch (format) {
      case 'percent':
        return `${(v * 100).toFixed(1)}%`;
      case 'number':
        return v.toLocaleString();
      case 'decimal':
        return v.toFixed(4);
      default:
        return v.toString();
    }
  };

  return (
    <div className="p-4 rounded-xl bg-muted/50">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {trend && (
          <>
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-yellow-500" />}
          </>
        )}
      </div>
      <div className="text-2xl font-bold">{formatValue(value)}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConfidenceCalibrationWidget({
  userId,
  periodDays = 14,
  className,
  compact = false,
  showRecommendations = true,
}: ConfidenceCalibrationWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CalibrationReport | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        periodDays: periodDays.toString(),
      });
      if (userId) params.set('userId', userId);

      const response = await fetch(`/api/sam/calibration/report?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to fetch calibration report');
      }

      setReport(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, periodDays]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchReport}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return null;
  }

  // Compact view
  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', QUALITY_BG_COLORS[report.overallQuality])}>
                <Gauge className={cn('w-5 h-5', QUALITY_COLORS[report.overallQuality])} />
              </div>
              <div>
                <div className="font-medium">Calibration Quality</div>
                <div className={cn('text-sm capitalize', QUALITY_COLORS[report.overallQuality])}>
                  {report.overallQuality}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{(report.metrics.calibrationError * 100).toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">error rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                Confidence Calibration
              </CardTitle>
              <CardDescription>
                Prediction accuracy and threshold recommendations
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchReport}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calibration Gauge */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center">
            <CalibrationGauge
              score={report.metrics.calibrationError}
              quality={report.overallQuality}
            />
            <div className="mt-4 text-center">
              <Badge
                variant="outline"
                className={cn('text-sm capitalize', QUALITY_COLORS[report.overallQuality])}
              >
                {report.overallQuality} calibration
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Avg Predicted"
                value={report.metrics.avgPredictedConfidence}
                icon={Target}
              />
              <MetricCard
                label="Avg Actual"
                value={report.metrics.avgActualAccuracy}
                icon={CheckCircle2}
              />
              <MetricCard
                label="Brier Score"
                value={report.metrics.brierScore}
                icon={Activity}
                format="decimal"
              />
              <MetricCard
                label="Override Rate"
                value={report.metrics.verificationOverrideRate}
                icon={AlertTriangle}
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{report.metrics.totalPredictions.toLocaleString()} total predictions</span>
              <span>{report.metrics.outcomesRecorded.toLocaleString()} outcomes recorded</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="buckets">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="buckets">Calibration Buckets</TabsTrigger>
          <TabsTrigger value="types">By Response Type</TabsTrigger>
          {showRecommendations && (
            <TabsTrigger value="recommendations">
              Recommendations ({report.recommendations.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="buckets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Predicted vs Actual by Confidence Level</CardTitle>
              <CardDescription>
                Comparing predicted confidence with actual accuracy across ranges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BucketChart buckets={report.buckets} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(report.byResponseType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {data.count} responses
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Conf:</span>{' '}
                        <span className="font-medium">{(data.avgConfidence * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Acc:</span>{' '}
                        <span className="font-medium">{(data.avgAccuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className={cn(data.error > 0.1 ? 'text-red-500' : 'text-green-500')}>
                        <span className="text-muted-foreground">Err:</span>{' '}
                        <span className="font-medium">{(data.error * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {showRecommendations && (
          <TabsContent value="recommendations" className="mt-4 space-y-4">
            {report.recommendations.length > 0 ? (
              report.recommendations.map((rec, i) => (
                <RecommendationCard key={i} rec={rec} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h4 className="font-medium">No adjustments needed</h4>
                  <p className="text-sm text-muted-foreground">
                    Your confidence thresholds are well calibrated.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Suggested Thresholds */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Suggested Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Direct Answer</div>
                    <div className="text-lg font-mono font-bold">
                      {(report.thresholdSuggestions.directAnswerThreshold * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Uncertainty</div>
                    <div className="text-lg font-mono font-bold">
                      {(report.thresholdSuggestions.uncertaintyThreshold * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Verification</div>
                    <div className="text-lg font-mono font-bold">
                      {(report.thresholdSuggestions.verificationThreshold * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Decline</div>
                    <div className="text-lg font-mono font-bold">
                      {(report.thresholdSuggestions.declineThreshold * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Report period: {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
        {' '}&bull;{' '}
        Generated: {new Date(report.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}

export default ConfidenceCalibrationWidget;
