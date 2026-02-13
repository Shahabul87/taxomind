'use client';

/**
 * NavigatorGenerationProgress
 *
 * 6-stage NAVIGATOR pipeline progress UI.
 * Fetches from /api/sam/skill-navigator/orchestrate.
 * Handles SSE events: stage_start, stage_complete, thinking,
 * need_profile_generated, skill_graph_built, gap_analysis_complete,
 * path_sequenced, resource_matched, course_matched, roadmap_saved,
 * complete, error.
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
  Database,
  Brain,
  GitBranch,
  Target,
  BookOpen,
  Save,
} from 'lucide-react';
import type { NavigatorRoadmapResult } from './hooks/useSkillNavigatorTool';

// =============================================================================
// TYPES
// =============================================================================

interface StageState {
  number: number;
  name: string;
  status: 'pending' | 'active' | 'complete';
  thinkingMessage?: string;
}

interface NavigatorGenerationProgressProps {
  params: {
    skillName: string;
    goalOutcome: string;
    goalType: string;
    currentLevel: string;
    targetLevel: string;
    hoursPerWeek: number;
    deadline: string;
    learningStyle: string;
  };
  onComplete: (roadmap: NavigatorRoadmapResult) => void;
  onError: (error: string) => void;
  className?: string;
}

// =============================================================================
// STAGE CONFIG
// =============================================================================

const STAGES: Array<{ number: number; name: string; icon: React.ComponentType<{ className?: string }> }> = [
  { number: 1, name: 'Data Collection', icon: Database },
  { number: 2, name: 'Need Analysis & Skill Audit', icon: Brain },
  { number: 3, name: 'Validation & Skill Graph', icon: GitBranch },
  { number: 4, name: 'Gap Analysis & Path Architecture', icon: Target },
  { number: 5, name: 'Resource Optimization', icon: BookOpen },
  { number: 6, name: 'Report Assembly', icon: Save },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function NavigatorGenerationProgress({
  params,
  onComplete,
  onError,
  className,
}: NavigatorGenerationProgressProps) {
  const [stages, setStages] = useState<StageState[]>(
    STAGES.map((s) => ({ number: s.number, name: s.name, status: 'pending' })),
  );
  const [percent, setPercent] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing NAVIGATOR pipeline...');
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateRoadmap = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setPercent(0);
    setCurrentMessage('Connecting to NAVIGATOR pipeline...');
    setStages(STAGES.map((s) => ({ number: s.number, name: s.name, status: 'pending' })));

    try {
      const response = await fetch('/api/sam/skill-navigator/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as Record<string, string>).error || `Generation failed (${response.status})`,
        );
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
                const data = JSON.parse(nextLine.slice(6)) as Record<string, unknown>;

                switch (eventType) {
                  case 'stage_start': {
                    const stageNum = data.stage as number;
                    setStages((prev) =>
                      prev.map((s) =>
                        s.number === stageNum
                          ? { ...s, status: 'active' }
                          : s,
                      ),
                    );
                    break;
                  }

                  case 'stage_complete': {
                    const stageNum = data.stage as number;
                    setStages((prev) =>
                      prev.map((s) =>
                        s.number === stageNum
                          ? { ...s, status: 'complete', thinkingMessage: undefined }
                          : s,
                      ),
                    );
                    break;
                  }

                  case 'thinking': {
                    const stageNum = data.stage as number;
                    const msg = data.message as string;
                    setStages((prev) =>
                      prev.map((s) =>
                        s.number === stageNum
                          ? { ...s, thinkingMessage: msg }
                          : s,
                      ),
                    );
                    break;
                  }

                  case 'progress':
                    setPercent(data.percent as number);
                    setCurrentMessage(data.message as string);
                    break;

                  case 'complete': {
                    const roadmap = data.roadmap as NavigatorRoadmapResult;
                    onComplete(roadmap);
                    break;
                  }

                  case 'error':
                    setError((data.message as string) ?? 'Generation failed');
                    onError((data.message as string) ?? 'Generation failed');
                    break;

                  // Info events — update message for context
                  case 'need_profile_generated':
                  case 'skill_audit_complete':
                  case 'feasibility_check':
                  case 'skill_graph_built':
                  case 'gap_analysis_complete':
                  case 'path_sequenced':
                  case 'resource_matched':
                  case 'checkpoint_designed':
                  case 'course_matched':
                  case 'roadmap_saved':
                    // These are informational; currentMessage is already set via progress
                    break;
                }
              } catch {
                // Skip malformed JSON
              }
              i++; // Skip the data line
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

  // Error state
  if (error) {
    return (
      <Card className={cn('border-destructive/50 bg-destructive/5', className)}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-destructive">NAVIGATOR Pipeline Failed</p>
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
  const isComplete = percent >= 100;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-4 space-y-4">
        {/* Overall progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium truncate">{currentMessage}</p>
            <span className="text-sm font-medium text-muted-foreground ml-2">{percent}%</span>
          </div>
          <Progress
            value={percent}
            className={cn(
              'h-2 transition-all',
              isComplete && '[&>div]:bg-green-500',
            )}
          />
        </div>

        {/* 6-stage timeline */}
        <div className="space-y-1.5">
          {stages.map((stage) => {
            const stageConfig = STAGES.find((s) => s.number === stage.number);
            const StageIcon = stageConfig?.icon ?? Loader2;
            const statusIcon =
              stage.status === 'complete' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : stage.status === 'active' ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
              ) : (
                <StageIcon className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              );

            return (
              <div
                key={stage.number}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm',
                  stage.status === 'active' && 'bg-primary/5',
                  stage.status === 'complete' && 'opacity-70',
                )}
              >
                {statusIcon}
                <span
                  className={cn(
                    'flex-1 truncate',
                    stage.status === 'pending' && 'text-muted-foreground/50',
                    stage.status === 'active' && 'font-medium',
                  )}
                >
                  {stage.name}
                </span>
                {stage.thinkingMessage && stage.status === 'active' && (
                  <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {stage.thinkingMessage}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Skill info badges */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {params.skillName}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {params.currentLevel} &rarr; {params.targetLevel}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {params.hoursPerWeek} hrs/week
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs capitalize">
            {params.goalType.replace(/_/g, ' ')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
