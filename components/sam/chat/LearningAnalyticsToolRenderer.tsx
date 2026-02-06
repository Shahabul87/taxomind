'use client';

/**
 * LearningAnalyticsToolRenderer
 *
 * Renders learning analytics tool output in SAM chat messages.
 * Handles both conversation mode (showing options) and generation mode (showing analytics).
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Clock,
  BookOpen,
  CheckCircle2,
  Flame,
  Trophy,
  Brain,
  AlertCircle,
  Loader2,
  RefreshCw,
  Lightbulb,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  ConversationalOptions,
  InlineOptions,
} from './ConversationalOptions';
import type {
  LearningAnalyticsToolOutput,
  LearningAnalyticsResult,
} from './hooks/useLearningAnalyticsTool';

// =============================================================================
// TYPES
// =============================================================================

interface LearningAnalyticsToolRendererProps {
  output: LearningAnalyticsToolOutput;
  onSendMessage: (message: string) => void;
  isInteractive?: boolean;
  className?: string;
}

interface ProgressEvent {
  stage: string;
  percent: number;
  message: string;
}

// =============================================================================
// STEP ICONS
// =============================================================================

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  scope: BarChart3,
  course: BookOpen,
  timeRange: Calendar,
  metricFocus: Activity,
  includeRecommendations: Lightbulb,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function LearningAnalyticsToolRenderer({
  output,
  onSendMessage,
  isInteractive = true,
  className,
}: LearningAnalyticsToolRendererProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [completedAnalytics, setCompletedAnalytics] = useState<LearningAnalyticsResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<ProgressEvent | null>(null);

  // Handle generation complete
  const handleGenerationComplete = useCallback((analytics: LearningAnalyticsResult) => {
    setIsGenerating(false);
    setCompletedAnalytics(analytics);
  }, []);

  // Handle generation error
  const handleGenerationError = useCallback((error: string) => {
    setIsGenerating(false);
    setGenerationError(error);
  }, []);

  // Start generation when triggerGeneration is true
  const shouldGenerate =
    output.type === 'generate_analytics' &&
    output.triggerGeneration &&
    !completedAnalytics &&
    !generationError;

  // Render generation progress
  if (shouldGenerate && output.params) {
    return (
      <div className={cn('space-y-3 sm:space-y-4 w-full', className)}>
        {output.message && (
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            {output.message}
          </p>
        )}
        <AnalyticsGenerationProgress
          params={output.params}
          onComplete={handleGenerationComplete}
          onError={handleGenerationError}
          onProgress={setGenerationProgress}
        />
      </div>
    );
  }

  // Render completed analytics
  if (completedAnalytics) {
    return (
      <AnalyticsDashboard
        analytics={completedAnalytics}
        className={className}
      />
    );
  }

  // Render generation error
  if (generationError) {
    return (
      <Card className={cn('border-destructive/50 w-full', className)}>
        <CardContent className="pt-4 px-3 sm:px-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-destructive">Generation Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{generationError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setGenerationError(null);
                  setIsGenerating(true);
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render conversation mode
  if (output.type === 'conversation') {
    return (
      <ConversationRenderer
        output={output}
        onOptionSelect={onSendMessage}
        isInteractive={isInteractive}
        className={className}
      />
    );
  }

  return null;
}

// =============================================================================
// CONVERSATION RENDERER
// =============================================================================

interface ConversationRendererProps {
  output: LearningAnalyticsToolOutput;
  onOptionSelect: (value: string) => void;
  isInteractive?: boolean;
  className?: string;
}

function ConversationRenderer({
  output,
  onOptionSelect,
  isInteractive = true,
  className,
}: ConversationRendererProps) {
  const StepIcon = output.step ? STEP_ICONS[output.step] || BarChart3 : BarChart3;
  const isYesNoQuestion = output.step === 'includeRecommendations';

  return (
    <div className={cn('space-y-3 w-full', className)}>
      {/* Progress indicator */}
      {output.progress && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            {Array.from({ length: output.progress.total }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors',
                  i < output.progress!.current ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>
          <span className="whitespace-nowrap">
            Step {output.progress.current} of {output.progress.total}
          </span>
        </div>
      )}

      {/* Question with icon */}
      {output.question && (
        <div className="flex items-start gap-2">
          <StepIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium break-words">{output.question}</p>
        </div>
      )}

      {/* Hint */}
      {output.hint && (
        <p className="text-xs text-muted-foreground ml-6 sm:ml-7 break-words">
          {output.hint}
        </p>
      )}

      {/* Options */}
      {output.options && output.options.length > 0 && (
        <div className="ml-0 sm:ml-7">
          {isYesNoQuestion ? (
            <InlineOptions
              options={output.options}
              onSelect={onOptionSelect}
              disabled={!isInteractive}
            />
          ) : (
            <ConversationalOptions
              options={output.options}
              onSelect={onOptionSelect}
              columns={2}
              showDescriptions={true}
              disabled={!isInteractive}
            />
          )}
        </div>
      )}

      {/* Collected data summary */}
      {output.collected && Object.keys(output.collected).length > 0 && (
        <CollectedDataSummary collected={output.collected} />
      )}
    </div>
  );
}

// =============================================================================
// COLLECTED DATA SUMMARY
// =============================================================================

function CollectedDataSummary({ collected }: { collected: Record<string, unknown> }) {
  const entries = Object.entries(collected).filter(([, value]) => value !== undefined);

  if (entries.length === 0) return null;

  const formatValue = (key: string, value: unknown): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string') {
      if (key === 'timeRange') {
        return value === 'all' ? 'All Time' : `Last ${value.replace('d', ' days')}`;
      }
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return String(value);
  };

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2 ml-0 sm:ml-7">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="secondary" className="text-[10px] sm:text-xs">
          {formatValue(key, value)}
        </Badge>
      ))}
    </div>
  );
}

// =============================================================================
// ANALYTICS GENERATION PROGRESS
// =============================================================================

interface AnalyticsGenerationProgressProps {
  params: LearningAnalyticsToolOutput['params'];
  onComplete: (analytics: LearningAnalyticsResult) => void;
  onError: (error: string) => void;
  onProgress?: (progress: ProgressEvent) => void;
  className?: string;
}

function AnalyticsGenerationProgress({
  params,
  onComplete,
  onError,
  onProgress,
  className,
}: AnalyticsGenerationProgressProps) {
  const [progress, setProgress] = useState<ProgressEvent>({
    stage: 'starting',
    percent: 0,
    message: 'Initializing analytics...',
  });
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateAnalytics = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setProgress({
      stage: 'starting',
      percent: 0,
      message: 'Connecting to analytics service...',
    });

    try {
      const response = await fetch('/api/sam/learning-analytics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Generation failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            const nextLine = lines[i + 1];

            if (nextLine?.startsWith('data: ')) {
              try {
                const data = JSON.parse(nextLine.slice(6));

                switch (eventType) {
                  case 'progress':
                    setProgress(data as ProgressEvent);
                    onProgress?.(data as ProgressEvent);
                    break;
                  case 'analytics':
                    onComplete(data as LearningAnalyticsResult);
                    break;
                  case 'error':
                    setError(data.message || 'Generation failed');
                    onError(data.message || 'Generation failed');
                    break;
                  case 'done':
                    break;
                }
              } catch {
                // Skip malformed JSON
              }
              i++;
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') return;
        setError(err.message);
        onError(err.message);
      } else {
        setError('An unexpected error occurred');
        onError('An unexpected error occurred');
      }
    } finally {
      setIsRetrying(false);
    }
  }, [params, onComplete, onError, onProgress]);

  useEffect(() => {
    generateAnalytics();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [generateAnalytics]);

  const handleRetry = () => {
    setIsRetrying(true);
    generateAnalytics();
  };

  if (error) {
    return (
      <Card className={cn('border-destructive/50 bg-destructive/5', className)}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-destructive">Generation Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isComplete = progress.stage === 'complete';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-full',
              isComplete
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-primary/10 text-primary'
            )}
          >
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <BarChart3 className={cn('h-5 w-5', !isComplete && 'animate-pulse')} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {progress.stage === 'starting' && 'Initializing'}
              {progress.stage === 'fetching' && 'Fetching Data'}
              {progress.stage === 'analyzing' && 'Analyzing Patterns'}
              {progress.stage === 'generating' && 'Generating Insights'}
              {progress.stage === 'complete' && 'Complete!'}
            </p>
            <p className="text-sm text-muted-foreground truncate">{progress.message}</p>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {progress.percent}%
          </span>
        </div>

        <Progress
          value={progress.percent}
          className={cn('h-2 transition-all', isComplete && '[&>div]:bg-green-500')}
        />

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {params?.scope}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {params?.timeRange === 'all' ? 'All time' : `Last ${params?.timeRange.replace('d', ' days')}`}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {params?.metricFocus === 'all' ? 'All metrics' : params?.metricFocus}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// ANALYTICS DASHBOARD
// =============================================================================

interface AnalyticsDashboardProps {
  analytics: LearningAnalyticsResult;
  className?: string;
}

function AnalyticsDashboard({ analytics, className }: AnalyticsDashboardProps) {
  return (
    <div className={cn('space-y-4 w-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-base">Learning Analytics</h3>
        <Badge variant="secondary" className="text-[10px]">
          {analytics.timeRange === 'all' ? 'All Time' : `Last ${analytics.timeRange.replace('d', ' days')}`}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard
          icon={BookOpen}
          label="Courses"
          value={analytics.overview.totalCourses}
        />
        <StatCard
          icon={Clock}
          label="Hours Learned"
          value={analytics.overview.totalHoursLearned}
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={analytics.overview.currentStreak}
          suffix=" days"
        />
        <StatCard
          icon={Trophy}
          label="Level"
          value={analytics.overview.level}
        />
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Progress Overview
            <TrendBadge trend={analytics.progress.progressTrend} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Completion Rate</span>
            <span className="font-medium">{analytics.progress.completionRate}%</span>
          </div>
          <Progress value={analytics.progress.completionRate} className="h-2" />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold">{analytics.progress.chaptersCompleted}</div>
              <div className="text-xs text-muted-foreground">Chapters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{analytics.progress.sectionsCompleted}</div>
              <div className="text-xs text-muted-foreground">Sections</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mastery Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Mastery Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Average Mastery</span>
            <span className="font-medium">{analytics.mastery.averageMasteryLevel}/10</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-primary">{analytics.mastery.skillsMastered}</div>
              <div className="text-xs text-muted-foreground">Skills Mastered</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-amber-500">{analytics.mastery.skillsInProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          </div>

          {/* Blooms Distribution */}
          {Object.keys(analytics.mastery.bloomsDistribution).length > 0 && (
            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-2">Cognitive Levels</div>
              <div className="space-y-1">
                {Object.entries(analytics.mastery.bloomsDistribution)
                  .filter(([, value]) => value > 0)
                  .map(([level, percent]) => (
                    <div key={level} className="flex items-center gap-2">
                      <span className="text-xs w-20">{level}</span>
                      <Progress value={percent} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8">{percent}%</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Engagement Patterns
            <TrendBadge trend={analytics.engagement.engagementTrend} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Sessions/Week</div>
              <div className="text-lg font-semibold">{analytics.engagement.sessionsPerWeek}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg Duration</div>
              <div className="text-lg font-semibold">{analytics.engagement.averageSessionDuration} min</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Most Active Day</div>
              <div className="text-lg font-semibold">{analytics.engagement.mostActiveDay}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Peak Time</div>
              <div className="text-lg font-semibold">{analytics.engagement.mostActiveTime}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Section */}
      {analytics.goals && analytics.goals.goalProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-medium text-green-600">{analytics.goals.completedGoals}</span>
                <span className="text-muted-foreground"> completed</span>
              </div>
              <div>
                <span className="font-medium text-primary">{analytics.goals.activeGoals}</span>
                <span className="text-muted-foreground"> active</span>
              </div>
            </div>

            <div className="space-y-2">
              {analytics.goals.goalProgress.slice(0, 3).map((goal) => (
                <div key={goal.id} className="flex items-center gap-2">
                  <Progress value={goal.progress} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground w-8">{goal.progress}%</span>
                  <span className="text-xs truncate max-w-[120px]">{goal.title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Section */}
      {analytics.comparison && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              vs Previous Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <ComparisonStat
                label="Progress"
                delta={analytics.comparison.previousPeriod.progressDelta}
              />
              <ComparisonStat
                label="Time"
                delta={analytics.comparison.previousPeriod.timeDelta}
              />
              <ComparisonStat
                label="Engagement"
                delta={analytics.comparison.previousPeriod.engagementDelta}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analytics.recommendations && analytics.recommendations.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analytics.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  suffix = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
      <div className="text-lg font-bold">
        {value}
        <span className="text-xs text-muted-foreground">{suffix}</span>
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return (
      <Badge variant="secondary" className="text-[10px] text-green-600 bg-green-100 dark:bg-green-900/30">
        <ArrowUp className="h-3 w-3 mr-0.5" />
        Up
      </Badge>
    );
  }
  if (trend === 'down') {
    return (
      <Badge variant="secondary" className="text-[10px] text-red-600 bg-red-100 dark:bg-red-900/30">
        <ArrowDown className="h-3 w-3 mr-0.5" />
        Down
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px]">
      <Minus className="h-3 w-3 mr-0.5" />
      Stable
    </Badge>
  );
}

function ComparisonStat({ label, delta }: { label: string; delta: number }) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <div className="text-center">
      <div
        className={cn(
          'text-lg font-bold',
          isPositive && 'text-green-600',
          !isPositive && !isNeutral && 'text-red-600',
          isNeutral && 'text-muted-foreground'
        )}
      >
        {isPositive && '+'}
        {delta}%
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { LearningAnalyticsToolOutput, LearningAnalyticsResult };
