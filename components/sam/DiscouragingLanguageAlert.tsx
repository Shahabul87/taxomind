'use client';

/**
 * DiscouragingLanguageAlert Component
 *
 * Displays real-time alerts for detected discouraging language in feedback.
 * Integrates with the SAM AI safety package.
 *
 * Features:
 * - Real-time discouraging language detection
 * - Category-based issue grouping
 * - Severity-based prioritization
 * - Suggested alternatives
 * - Overall safety score
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  MessageSquareWarning,
  ThumbsDown,
  ThumbsUp,
  ArrowRight,
  X,
  Info,
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type DiscouragingCategory =
  | 'absolute_negative'
  | 'personal_attack'
  | 'dismissive'
  | 'comparing_negatively'
  | 'hopelessness'
  | 'labeling'
  | 'sarcasm'
  | 'condescending';

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface DiscouragingMatch {
  phrase: string;
  category: DiscouragingCategory;
  severity: Severity;
  position: { start: number; end: number };
  alternative?: string;
}

interface DiscouragingLanguageResult {
  found: boolean;
  matches: DiscouragingMatch[];
  score: number;
  categoryCounts: Record<DiscouragingCategory, number>;
}

interface DiscouragingLanguageAlertProps {
  className?: string;
  feedbackText?: string;
  compact?: boolean;
  onAnalyze?: (result: DiscouragingLanguageResult) => void;
  dismissible?: boolean;
  showScore?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_LABELS: Record<DiscouragingCategory, string> = {
  absolute_negative: 'Absolute Negative',
  personal_attack: 'Personal Attack',
  dismissive: 'Dismissive',
  comparing_negatively: 'Negative Comparison',
  hopelessness: 'Hopelessness',
  labeling: 'Labeling',
  sarcasm: 'Sarcasm',
  condescending: 'Condescending',
};

const CATEGORY_ICONS: Record<DiscouragingCategory, React.ReactNode> = {
  absolute_negative: <X className="w-4 h-4" />,
  personal_attack: <AlertTriangle className="w-4 h-4" />,
  dismissive: <ThumbsDown className="w-4 h-4" />,
  comparing_negatively: <AlertCircle className="w-4 h-4" />,
  hopelessness: <AlertTriangle className="w-4 h-4" />,
  labeling: <MessageSquareWarning className="w-4 h-4" />,
  sarcasm: <AlertCircle className="w-4 h-4" />,
  condescending: <AlertCircle className="w-4 h-4" />,
};

const SEVERITY_COLORS: Record<Severity, { text: string; bg: string; border: string }> = {
  critical: { text: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  high: { text: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  medium: { text: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  low: { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

const SCORE_LEVELS = [
  { min: 80, label: 'Excellent', color: 'text-green-500', icon: ShieldCheck },
  { min: 60, label: 'Good', color: 'text-emerald-500', icon: Shield },
  { min: 40, label: 'Fair', color: 'text-yellow-500', icon: Shield },
  { min: 20, label: 'Poor', color: 'text-orange-500', icon: ShieldAlert },
  { min: 0, label: 'Critical', color: 'text-red-500', icon: ShieldAlert },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getScoreLevel(score: number) {
  return SCORE_LEVELS.find((level) => score >= level.min) ?? SCORE_LEVELS[4];
}

function sortMatchesBySeverity(matches: DiscouragingMatch[]): DiscouragingMatch[] {
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...matches].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreIndicator({ score }: { score: number }) {
  const level = getScoreLevel(score);
  const Icon = level.icon;

  return (
    <div className="flex items-center gap-3">
      <div className={cn('p-2 rounded-full', score >= 60 ? 'bg-green-500/10' : 'bg-red-500/10')}>
        <Icon className={cn('w-5 h-5', level.color)} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={cn('text-2xl font-bold', level.color)}>{score}</span>
          <span className="text-muted-foreground">/100</span>
        </div>
        <span className={cn('text-sm', level.color)}>{level.label}</span>
      </div>
    </div>
  );
}

function MatchCard({ match, compact }: { match: DiscouragingMatch; compact?: boolean }) {
  const colors = SEVERITY_COLORS[match.severity];

  return (
    <div className={cn('p-3 rounded-lg border', colors.bg, colors.border)}>
      <div className="flex items-start gap-3">
        <div className={cn('p-1.5 rounded-md', colors.bg)}>
          {CATEGORY_ICONS[match.category]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-sm font-medium', colors.text)}>
              {CATEGORY_LABELS[match.category]}
            </span>
            <Badge variant="outline" className={cn('text-xs capitalize', colors.text, colors.border)}>
              {match.severity}
            </Badge>
          </div>
          <p className="text-sm bg-muted/50 px-2 py-1 rounded font-mono">
            &quot;{match.phrase}&quot;
          </p>
          {match.alternative && !compact && (
            <div className="flex items-start gap-2 mt-2 pt-2 border-t border-dashed">
              <ArrowRight className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />
              <p className="text-xs text-green-600">
                <span className="font-medium">Try instead:</span> {match.alternative}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategorySummary({ counts }: { counts: Record<DiscouragingCategory, number> }) {
  const nonZeroCategories = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  if (nonZeroCategories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {nonZeroCategories.map(([category, count]) => (
        <Badge
          key={category}
          variant="outline"
          className="text-xs"
        >
          {CATEGORY_LABELS[category as DiscouragingCategory]}: {count}
        </Badge>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DiscouragingLanguageAlert({
  className,
  feedbackText,
  compact = false,
  onAnalyze,
  dismissible = false,
  showScore = true,
}: DiscouragingLanguageAlertProps) {
  const [result, setResult] = useState<DiscouragingLanguageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isLoadingRef = useRef(false);

  const analyzeText = useCallback(
    async (text: string) => {
      if (isLoadingRef.current || !text.trim()) return;
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      setDismissed(false);

      try {
        const res = await fetch('/api/sam/safety/discouraging-language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) throw new Error('Failed to analyze text');

        const data = await res.json();

        if (data.success) {
          setResult(data.data);
          onAnalyze?.(data.data);
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

  // If dismissed, don't render
  if (dismissed && dismissible) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Checking language safety...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Analysis Failed</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          {feedbackText && (
            <Button variant="outline" size="sm" onClick={() => analyzeText(feedbackText)}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // No text to analyze
  if (!result && !feedbackText) {
    return null;
  }

  // All clear - no discouraging language found
  if (result && !result.found) {
    return (
      <Alert className={cn('border-green-500/20 bg-green-500/5', className)}>
        <ShieldCheck className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-600">Language Check Passed</AlertTitle>
        <AlertDescription className="text-green-600/80">
          No discouraging language detected. The feedback is constructive and supportive.
        </AlertDescription>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => setDismissed(true)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </Alert>
    );
  }

  // Discouraging language found
  if (result?.found) {
    const sortedMatches = sortMatchesBySeverity(result.matches);
    const hasCritical = sortedMatches.some((m) => m.severity === 'critical');

    return (
      <Card className={cn(hasCritical && 'border-red-500/30', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={cn('w-5 h-5', hasCritical ? 'text-red-500' : 'text-yellow-500')} />
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Language Safety Alert</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  hasCritical
                    ? 'text-red-500 border-red-500/20'
                    : 'text-yellow-500 border-yellow-500/20'
                )}
              >
                {result.matches.length} Issue{result.matches.length > 1 ? 's' : ''} Found
              </Badge>
              {dismissible && (
                <Button variant="ghost" size="icon" onClick={() => setDismissed(true)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            {hasCritical
              ? 'Critical issues detected that may negatively impact students.'
              : 'Some language patterns may be discouraging to students.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Score Indicator */}
          {showScore && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <ScoreIndicator score={result.score} />
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Safety Score</p>
                <p className="text-xs text-muted-foreground">Higher is better</p>
              </div>
            </div>
          )}

          {/* Category Summary */}
          <CategorySummary counts={result.categoryCounts} />

          {/* Individual Matches */}
          <div className="space-y-2">
            {sortedMatches.slice(0, compact ? 3 : 10).map((match, idx) => (
              <MatchCard key={idx} match={match} compact={compact} />
            ))}
            {sortedMatches.length > (compact ? 3 : 10) && (
              <p className="text-xs text-muted-foreground text-center py-2">
                And {sortedMatches.length - (compact ? 3 : 10)} more issues...
              </p>
            )}
          </div>

          {/* Recommendation */}
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-600">Recommendation</p>
                <p className="text-xs text-blue-600/80">
                  Review the highlighted phrases and consider using the suggested alternatives to
                  create more supportive and constructive feedback for students.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default DiscouragingLanguageAlert;
