'use client';

/**
 * AccessibilityMetricsWidget Component
 *
 * Displays readability metrics, text statistics, and accessibility insights
 * from the SAM AI safety package.
 *
 * Features:
 * - Flesch-Kincaid grade level display
 * - Reading ease score visualization
 * - Text complexity analysis
 * - Issue detection and suggestions
 * - Target grade level comparison
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Eye,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  FileText,
  Target,
  TrendingUp,
  TrendingDown,
  Info,
  Minus,
  AlertCircle,
  GraduationCap,
  Lightbulb,
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

interface TextStatistics {
  wordCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  averageWordSyllables: number;
  complexWordPercentage: number;
  passiveVoicePercentage: number;
}

interface AccessibilityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion?: string;
  location?: { start: number; end: number };
}

interface AccessibilityResult {
  passed: boolean;
  gradeLevel: number;
  readingEase: number;
  statistics: TextStatistics;
  issues: AccessibilityIssue[];
  suggestions: string[];
  targetGradeLevel: number;
}

interface AccessibilityMetricsWidgetProps {
  className?: string;
  feedbackText?: string;
  compact?: boolean;
  onAnalyze?: (text: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GRADE_LEVEL_DESCRIPTIONS: Record<string, string> = {
  elementary: 'Grades 1-5: Basic vocabulary, simple sentences',
  middle: 'Grades 6-8: Moderate complexity, some technical terms',
  high: 'Grades 9-12: Complex sentences, academic vocabulary',
  college: 'College level: Advanced vocabulary, dense content',
  graduate: 'Graduate+: Highly technical, specialized terms',
};

const READING_EASE_LEVELS = [
  { min: 90, label: 'Very Easy', color: 'text-green-500', bg: 'bg-green-500' },
  { min: 70, label: 'Easy', color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { min: 50, label: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500' },
  { min: 30, label: 'Difficult', color: 'text-orange-500', bg: 'bg-orange-500' },
  { min: 0, label: 'Very Difficult', color: 'text-red-500', bg: 'bg-red-500' },
];

const SEVERITY_COLORS = {
  low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  high: 'text-red-500 bg-red-500/10 border-red-500/20',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getGradeLevelCategory(grade: number): string {
  if (grade <= 5) return 'elementary';
  if (grade <= 8) return 'middle';
  if (grade <= 12) return 'high';
  if (grade <= 16) return 'college';
  return 'graduate';
}

function getReadingEaseLevel(score: number) {
  return READING_EASE_LEVELS.find((level) => score >= level.min) ?? READING_EASE_LEVELS[4];
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function GradeLevelGauge({ current, target }: { current: number; target: number }) {
  const diff = current - target;
  const isOnTarget = Math.abs(diff) <= 2;
  const isAboveTarget = diff > 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="stroke-muted"
            strokeWidth="10"
            fill="none"
            r="40"
            cx="50"
            cy="50"
          />
          {/* Progress circle based on grade level (max 16 for college) */}
          <circle
            className={cn(
              'transition-all duration-1000',
              isOnTarget
                ? 'stroke-green-500'
                : isAboveTarget
                  ? 'stroke-red-500'
                  : 'stroke-yellow-500'
            )}
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            r="40"
            cx="50"
            cy="50"
            style={{
              strokeDasharray: 2 * Math.PI * 40,
              strokeDashoffset: 2 * Math.PI * 40 * (1 - Math.min(current / 16, 1)),
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{current.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">Grade</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Target className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">Target: {target}</span>
        {!isOnTarget && (
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              isAboveTarget ? 'text-red-500 border-red-500/20' : 'text-yellow-500 border-yellow-500/20'
            )}
          >
            {isAboveTarget ? '+' : ''}
            {diff.toFixed(1)}
          </Badge>
        )}
      </div>
    </div>
  );
}

function ReadingEaseBar({ score }: { score: number }) {
  const level = getReadingEaseLevel(score);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Reading Ease</span>
        <span className={cn('text-sm font-bold', level.color)}>
          {score.toFixed(0)} - {level.label}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', level.bg)}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Difficult</span>
        <span>Easy</span>
      </div>
    </div>
  );
}

function StatisticItem({
  label,
  value,
  suffix,
  warning,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium', warning && 'text-yellow-500')}>
        {typeof value === 'number' ? value.toFixed(1) : value}
        {suffix && <span className="text-muted-foreground ml-1">{suffix}</span>}
        {warning && <AlertTriangle className="w-3 h-3 inline ml-1" />}
      </span>
    </div>
  );
}

function IssueCard({ issue }: { issue: AccessibilityIssue }) {
  return (
    <div className={cn('p-3 rounded-lg border', SEVERITY_COLORS[issue.severity])}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{issue.type.replace(/_/g, ' ')}</p>
          <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
          {issue.suggestion && (
            <div className="flex items-start gap-1 mt-2 pt-2 border-t border-dashed">
              <Lightbulb className="w-3 h-3 mt-0.5 text-yellow-500" />
              <p className="text-xs">{issue.suggestion}</p>
            </div>
          )}
        </div>
        <Badge variant="outline" className="text-xs capitalize">
          {issue.severity}
        </Badge>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AccessibilityMetricsWidget({
  className,
  feedbackText,
  compact = false,
  onAnalyze,
}: AccessibilityMetricsWidgetProps) {
  const [result, setResult] = useState<AccessibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const analyzeText = useCallback(
    async (text: string) => {
      if (isLoadingRef.current || !text.trim()) return;
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/sam/safety/accessibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) throw new Error('Failed to analyze text');

        const data = await res.json();

        if (data.success) {
          setResult(data.data);
          onAnalyze?.(text);
        } else {
          throw new Error(data.error || 'Analysis failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze');
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    },
    [onAnalyze]
  );

  // Auto-analyze when feedbackText changes
  useEffect(() => {
    if (feedbackText) {
      analyzeText(feedbackText);
    }
  }, [feedbackText, analyzeText]);

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Analyzing accessibility...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          {feedbackText && (
            <Button variant="outline" size="sm" onClick={() => analyzeText(feedbackText)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!result) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Accessibility Metrics</CardTitle>
          </div>
          <CardDescription>
            Analyze text for readability and accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground text-center max-w-[200px]">
            No text to analyze. Provide feedback text to see accessibility metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Accessibility Metrics</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {result.passed ? (
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Passed
              </Badge>
            ) : (
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Needs Improvement
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>Readability and text complexity analysis</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Metrics Row */}
        <div className="flex items-start gap-6">
          <GradeLevelGauge current={result.gradeLevel} target={result.targetGradeLevel} />
          <div className="flex-1 space-y-4">
            <ReadingEaseBar score={result.readingEase} />
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {GRADE_LEVEL_DESCRIPTIONS[getGradeLevelCategory(result.gradeLevel)]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Text Statistics */}
        {!compact && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Text Statistics
            </h3>
            <div className="bg-muted/30 rounded-lg p-3">
              <StatisticItem label="Word Count" value={result.statistics.wordCount} />
              <StatisticItem label="Sentence Count" value={result.statistics.sentenceCount} />
              <StatisticItem
                label="Avg. Sentence Length"
                value={result.statistics.averageSentenceLength}
                suffix="words"
                warning={result.statistics.averageSentenceLength > 25}
              />
              <StatisticItem
                label="Complex Words"
                value={result.statistics.complexWordPercentage}
                suffix="%"
                warning={result.statistics.complexWordPercentage > 20}
              />
              <StatisticItem
                label="Passive Voice"
                value={result.statistics.passiveVoicePercentage}
                suffix="%"
                warning={result.statistics.passiveVoicePercentage > 30}
              />
            </div>
          </div>
        )}

        {/* Issues */}
        {result.issues.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Issues Found
              <Badge variant="secondary" className="text-xs">
                {result.issues.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {result.issues.slice(0, compact ? 2 : 5).map((issue, idx) => (
                <IssueCard key={idx} issue={issue} />
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions.length > 0 && !compact && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Suggestions
            </h3>
            <ul className="space-y-2">
              {result.suggestions.slice(0, 3).map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AccessibilityMetricsWidget;
