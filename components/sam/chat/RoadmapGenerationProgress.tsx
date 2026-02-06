'use client';

/**
 * RoadmapGenerationProgress
 *
 * Displays SSE (Server-Sent Events) progress during skill roadmap generation.
 * Connects to /api/sam/skill-roadmap/generate and shows real-time updates.
 *
 * Features:
 * - Real-time progress updates via SSE
 * - Stage-based progress visualization
 * - Error handling with retry option
 * - Completion callback with roadmap data
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Search,
  Layers,
  Database,
  BookOpen,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ProgressEvent {
  stage: 'analyzing' | 'designing' | 'parsing' | 'matching' | 'building' | 'saving' | 'complete' | 'starting';
  percent: number;
  message: string;
  provider?: string;
}

interface RoadmapResult {
  id: string;
  title: string;
  description?: string;
  totalEstimatedHours: number;
  milestoneCount: number;
  milestones: Array<{
    id: string;
    order: number;
    title: string;
    status: string;
    estimatedHours: number;
  }>;
}

interface RoadmapGenerationProgressProps {
  params: {
    skillName: string;
    currentLevel: string;
    targetLevel: string;
    hoursPerWeek: number;
    learningStyle: string;
    includeAssessments: boolean;
    prioritizeQuickWins: boolean;
  };
  onComplete: (roadmap: RoadmapResult) => void;
  onError: (error: string) => void;
  className?: string;
}

// =============================================================================
// STAGE ICONS
// =============================================================================

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  analyzing: Search,
  designing: Sparkles,
  parsing: Layers,
  matching: BookOpen,
  building: Database,
  saving: Database,
  complete: CheckCircle2,
  starting: Loader2,
};

const STAGE_LABELS: Record<string, string> = {
  analyzing: 'Analyzing Skill',
  designing: 'AI Designing Phases',
  parsing: 'Validating Structure',
  matching: 'Finding Courses',
  building: 'Building Roadmap',
  saving: 'Saving Progress',
  complete: 'Complete!',
  starting: 'Initializing',
};

// =============================================================================
// COMPONENT
// =============================================================================

export function RoadmapGenerationProgress({
  params,
  onComplete,
  onError,
  className,
}: RoadmapGenerationProgressProps) {
  const [progress, setProgress] = useState<ProgressEvent>({
    stage: 'starting',
    percent: 0,
    message: 'Initializing roadmap generation...',
  });
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateRoadmap = useCallback(async () => {
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setProgress({
      stage: 'starting',
      percent: 0,
      message: 'Connecting to AI service...',
    });

    try {
      const response = await fetch('/api/sam/skill-roadmap/generate', {
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
        buffer = lines.pop() || '';

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
                    break;
                  case 'roadmap':
                    onComplete(data as RoadmapResult);
                    break;
                  case 'error':
                    setError(data.message || 'Generation failed');
                    onError(data.message || 'Generation failed');
                    break;
                  case 'done':
                    // Generation complete
                    break;
                }
              } catch {
                // Skip malformed JSON
              }
              i++; // Skip the data line we just processed
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          // Request was aborted, don't show error
          return;
        }
        setError(err.message);
        onError(err.message);
      } else {
        setError('An unexpected error occurred');
        onError('An unexpected error occurred');
      }
    } finally {
      setIsRetrying(false);
    }
  }, [params, onComplete, onError]);

  useEffect(() => {
    generateRoadmap();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [generateRoadmap]);

  const handleRetry = () => {
    setIsRetrying(true);
    generateRoadmap();
  };

  // Get current stage icon
  const StageIcon = STAGE_ICONS[progress.stage] || Loader2;
  const stageLabel = STAGE_LABELS[progress.stage] || progress.stage;

  // Error state
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

  // Progress state
  const isComplete = progress.stage === 'complete';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-4 space-y-4">
        {/* Header with icon and stage */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-full',
              isComplete
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-primary/10 text-primary'
            )}
          >
            <StageIcon
              className={cn(
                'h-5 w-5',
                !isComplete && progress.stage !== 'complete' && 'animate-pulse'
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{stageLabel}</p>
            <p className="text-sm text-muted-foreground truncate">
              {progress.message}
            </p>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {progress.percent}%
          </span>
        </div>

        {/* Progress bar */}
        <Progress
          value={progress.percent}
          className={cn(
            'h-2 transition-all',
            isComplete && '[&>div]:bg-green-500'
          )}
        />

        {/* AI Provider badge */}
        {progress.provider && (
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Powered by {progress.provider}
            </span>
          </div>
        )}

        {/* Skill info */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {params.skillName}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {params.currentLevel} → {params.targetLevel}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {params.hoursPerWeek} hrs/week
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// COMPACT PROGRESS INDICATOR
// =============================================================================

interface CompactProgressProps {
  stage: string;
  percent: number;
  message?: string;
  className?: string;
}

export function CompactProgress({
  stage,
  percent,
  message,
  className,
}: CompactProgressProps) {
  const StageIcon = STAGE_ICONS[stage] || Loader2;
  const isComplete = stage === 'complete';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <StageIcon
        className={cn(
          'h-4 w-4',
          isComplete ? 'text-green-500' : 'text-primary animate-pulse'
        )}
      />
      <Progress value={percent} className="h-1.5 flex-1" />
      <span className="text-xs text-muted-foreground w-8">{percent}%</span>
      {message && (
        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
          {message}
        </span>
      )}
    </div>
  );
}
