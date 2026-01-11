'use client';

/**
 * BiasDetectionReport Component
 *
 * Displays fairness analysis and bias detection results from the SAM AI system.
 * Uses the @sam-ai/safety FairnessAuditor for comprehensive bias analysis.
 *
 * Features:
 * - Overall fairness score with breakdown
 * - Bias type analysis (demographic, cognitive, cultural, etc.)
 * - Statistical parity metrics
 * - Remediation recommendations
 * - Trend tracking over time
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Brain,
  Globe,
  Target,
  Scale,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface BiasCategory {
  name: string;
  score: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  indicators: string[];
  affectedGroups?: string[];
}

interface ParityMetric {
  name: string;
  value: number;
  threshold: number;
  passed: boolean;
  description: string;
}

interface RemediationStep {
  priority: 'high' | 'medium' | 'low';
  category: string;
  action: string;
  rationale: string;
  expectedImpact: string;
}

interface FairnessAuditResult {
  auditId: string;
  contentId?: string;
  courseId?: string;
  overallScore: number;
  fairnessLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  biasCategories: BiasCategory[];
  parityMetrics: ParityMetric[];
  remediationSteps: RemediationStep[];
  historicalComparison?: {
    previousScore: number;
    trend: 'improving' | 'stable' | 'declining';
    changePercent: number;
  };
  metadata: {
    auditedAt: string;
    evaluationsAnalyzed: number;
    confidenceLevel: number;
    auditorVersion: string;
  };
}

interface BiasDetectionReportProps {
  contentId?: string;
  courseId?: string;
  evaluations?: Array<{
    id: string;
    studentId: string;
    score: number;
    demographics?: Record<string, string>;
  }>;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SEVERITY_COLORS = {
  none: 'bg-green-500/10 text-green-700 border-green-500/30',
  low: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
  high: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  critical: 'bg-red-500/10 text-red-700 border-red-500/30',
};

const LEVEL_COLORS = {
  excellent: 'text-green-500',
  good: 'text-blue-500',
  fair: 'text-yellow-500',
  poor: 'text-orange-500',
  critical: 'text-red-500',
};

const BIAS_ICONS: Record<string, React.ElementType> = {
  demographic: Users,
  cognitive: Brain,
  cultural: Globe,
  language: FileText,
  assessment: Target,
  default: Scale,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FairnessScoreGauge({ score, level }: { score: number; level: string }) {
  const getColor = (s: number) => {
    if (s >= 90) return 'text-green-500 stroke-green-500';
    if (s >= 75) return 'text-blue-500 stroke-blue-500';
    if (s >= 60) return 'text-yellow-500 stroke-yellow-500';
    if (s >= 40) return 'text-orange-500 stroke-orange-500';
    return 'text-red-500 stroke-red-500';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/20"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-1000', getColor(score))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-bold', getColor(score))}>
          {Math.round(score)}
        </span>
        <span className="text-sm text-muted-foreground capitalize">{level}</span>
      </div>
    </div>
  );
}

function BiasCategoryCard({ category }: { category: BiasCategory }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = BIAS_ICONS[category.name.toLowerCase()] ?? BIAS_ICONS.default;

  return (
    <div
      className={cn(
        'border rounded-xl p-4 transition-all duration-200',
        SEVERITY_COLORS[category.severity]
      )}
    >
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium">{category.name}</h4>
            <p className="text-sm opacity-80">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(category.score)}</div>
            <Badge variant="outline" className="text-xs">
              {category.severity}
            </Badge>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-current/10 space-y-4">
          {category.indicators.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Indicators Detected</h5>
              <ul className="space-y-1">
                {category.indicators.map((indicator, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm opacity-80">
                    <AlertTriangle className="w-3 h-3" />
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {category.affectedGroups && category.affectedGroups.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Affected Groups</h5>
              <div className="flex flex-wrap gap-2">
                {category.affectedGroups.map((group, i) => (
                  <Badge key={i} variant="outline">
                    {group}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParityMetricRow({ metric }: { metric: ParityMetric }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        {metric.passed ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <div>
          <h5 className="font-medium">{metric.name}</h5>
          <p className="text-xs text-muted-foreground">{metric.description}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-mono">
          {metric.value.toFixed(3)}
          <span className="text-xs text-muted-foreground ml-1">
            / {metric.threshold.toFixed(2)}
          </span>
        </div>
        <Badge variant={metric.passed ? 'default' : 'destructive'} className="text-xs">
          {metric.passed ? 'Pass' : 'Fail'}
        </Badge>
      </div>
    </div>
  );
}

function RemediationCard({ step }: { step: RemediationStep }) {
  const priorityColors = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-blue-500/30 bg-blue-500/5',
  };

  return (
    <div className={cn('border rounded-xl p-4', priorityColors[step.priority])}>
      <div className="flex items-start justify-between mb-2">
        <Badge
          variant="outline"
          className={cn(
            step.priority === 'high' && 'bg-red-500/10 text-red-700',
            step.priority === 'medium' && 'bg-yellow-500/10 text-yellow-700',
            step.priority === 'low' && 'bg-blue-500/10 text-blue-700'
          )}
        >
          {step.priority} priority
        </Badge>
        <Badge variant="outline">{step.category}</Badge>
      </div>
      <h4 className="font-medium mb-2">{step.action}</h4>
      <p className="text-sm text-muted-foreground mb-3">{step.rationale}</p>
      <div className="flex items-center gap-2 text-sm">
        <Target className="w-4 h-4 text-primary" />
        <span className="font-medium">Expected Impact:</span>
        <span className="text-muted-foreground">{step.expectedImpact}</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BiasDetectionReport({
  contentId,
  courseId,
  evaluations,
  className,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}: BiasDetectionReportProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FairnessAuditResult | null>(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sam/safety/fairness-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          courseId,
          evaluations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to run fairness audit');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [contentId, courseId, evaluations]);

  useEffect(() => {
    fetchAudit();

    if (autoRefresh) {
      const interval = setInterval(fetchAudit, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAudit, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Running fairness analysis...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <p className="text-red-500">{error}</p>
          <Button variant="outline" onClick={fetchAudit}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  const passedMetrics = result.parityMetrics.filter((m) => m.passed).length;
  const totalMetrics = result.parityMetrics.length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Bias Detection Report
              </CardTitle>
              <CardDescription>
                Fairness analysis and bias detection for educational content
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAudit}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-audit
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <FairnessScoreGauge score={result.overallScore} level={result.fairnessLevel} />
              <div>
                <h3 className="text-2xl font-bold">
                  Fairness Score:{' '}
                  <span className={LEVEL_COLORS[result.fairnessLevel]}>
                    {result.fairnessLevel}
                  </span>
                </h3>
                <p className="text-muted-foreground mt-1">
                  Based on analysis of {result.metadata.evaluationsAnalyzed} evaluations
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="outline">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {passedMetrics}/{totalMetrics} metrics passed
                  </Badge>
                  <Badge variant="outline">
                    Confidence: {Math.round(result.metadata.confidenceLevel * 100)}%
                  </Badge>
                </div>
              </div>
            </div>

            {result.historicalComparison && (
              <div className="text-right p-4 rounded-xl bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">vs. Previous Audit</div>
                <div className="flex items-center gap-2">
                  {result.historicalComparison.trend === 'improving' && (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  )}
                  {result.historicalComparison.trend === 'declining' && (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  {result.historicalComparison.trend === 'stable' && (
                    <Minus className="w-5 h-5 text-yellow-500" />
                  )}
                  <span
                    className={cn(
                      'text-lg font-bold',
                      result.historicalComparison.trend === 'improving' && 'text-green-500',
                      result.historicalComparison.trend === 'declining' && 'text-red-500',
                      result.historicalComparison.trend === 'stable' && 'text-yellow-500'
                    )}
                  >
                    {result.historicalComparison.changePercent > 0 ? '+' : ''}
                    {result.historicalComparison.changePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Previous: {result.historicalComparison.previousScore}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Bias Categories, Parity Metrics, Remediation */}
      <Tabs defaultValue="categories">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">
            Bias Categories ({result.biasCategories.length})
          </TabsTrigger>
          <TabsTrigger value="parity">
            Parity Metrics ({passedMetrics}/{totalMetrics})
          </TabsTrigger>
          <TabsTrigger value="remediation">
            Remediation ({result.remediationSteps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4 space-y-4">
          {result.biasCategories.length > 0 ? (
            result.biasCategories.map((category, i) => (
              <BiasCategoryCard key={i} category={category} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h4 className="font-medium">No significant bias detected</h4>
                <p className="text-sm text-muted-foreground">
                  The content appears to be fair across all analyzed categories.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="parity" className="mt-4 space-y-3">
          {result.parityMetrics.map((metric, i) => (
            <ParityMetricRow key={i} metric={metric} />
          ))}
        </TabsContent>

        <TabsContent value="remediation" className="mt-4 space-y-4">
          {result.remediationSteps.length > 0 ? (
            result.remediationSteps.map((step, i) => (
              <RemediationCard key={i} step={step} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h4 className="font-medium">No remediation needed</h4>
                <p className="text-sm text-muted-foreground">
                  The content meets all fairness criteria.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Metadata Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Audit ID: {result.auditId}
        {' '}&bull;{' '}
        Audited at: {new Date(result.metadata.auditedAt).toLocaleString()}
        {' '}&bull;{' '}
        Auditor v{result.metadata.auditorVersion}
      </div>
    </div>
  );
}

export default BiasDetectionReport;
