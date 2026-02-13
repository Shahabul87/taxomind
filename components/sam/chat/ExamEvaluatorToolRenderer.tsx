'use client';

/**
 * ExamEvaluatorToolRenderer
 *
 * Renders exam evaluator (DIAGNOSE) tool output in SAM chat messages.
 * Handles conversation mode (4-step collection), evaluation mode
 * (5-stage SSE pipeline), completed mode, and error mode.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  FileSearch,
  Brain,
  Microscope,
  Settings2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Target,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  MessageSquare,
  Map,
  Shield,
} from 'lucide-react';
import {
  ConversationalOptions,
  InlineOptions,
  type ConversationalOption,
} from './ConversationalOptions';

// =============================================================================
// TYPES
// =============================================================================

interface ExamEvaluatorToolOutput {
  type: 'conversation' | 'evaluate_exam';
  conversationId?: string;
  step?: string;
  question?: string;
  options?: ConversationalOption[];
  hint?: string;
  collected?: Record<string, unknown>;
  message?: string;
  retryReason?: string;
  progress?: { current: number; total: number };
  // Evaluation mode
  params?: Record<string, unknown>;
  summary?: string;
  apiEndpoint?: string;
  triggerEvaluation?: boolean;
}

interface CognitiveMapEntry {
  score: number;
  status: string;
  keyFinding: string;
}

interface EvalResult {
  success: boolean;
  attemptId?: string;
  cognitiveProfile?: {
    bloomsCognitiveMap: Record<string, CognitiveMapEntry>;
    cognitiveCeiling: string;
    growthEdge: string;
    criticalGap?: string;
    thinkingPatternAnalysis: {
      dominantStyle: string;
      description: string;
      limitations: string[];
    };
    strengthMap: string[];
    vulnerabilityMap: string[];
    misconceptionSummary: Array<{ id: string; name: string; frequency: number }>;
  };
  improvementRoadmap?: {
    priorities: Array<{
      priority: number;
      title: string;
      actions: string[];
      successMetric: string;
    }>;
    estimatedTimeToNextLevel: string;
  };
  echoBackCount?: number;
  stats?: {
    totalAnswers: number;
    averageComposite: number;
    bloomsGapAverage: number;
    misconceptionsFound: number;
    fragileCorrectCount: number;
  };
}

interface ExamEvaluatorToolRendererProps {
  output: ExamEvaluatorToolOutput;
  onSendMessage: (message: string) => void;
  isInteractive?: boolean;
  className?: string;
}

// =============================================================================
// STEP ICONS
// =============================================================================

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  attemptId: FileSearch,
  evaluationMode: Microscope,
  options: Settings2,
  confirm: CheckCircle2,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExamEvaluatorToolRenderer({
  output,
  onSendMessage,
  isInteractive = true,
  className,
}: ExamEvaluatorToolRendererProps) {
  const [textInput, setTextInput] = useState('');
  const [completedEval, setCompletedEval] = useState<EvalResult | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const handleOptionSelect = useCallback(
    (value: string) => {
      onSendMessage(value);
    },
    [onSendMessage],
  );

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onSendMessage(textInput.trim());
      setTextInput('');
    }
  }, [textInput, onSendMessage]);

  const handleEvalComplete = useCallback((result: EvalResult) => {
    setCompletedEval(result);
  }, []);

  const handleEvalError = useCallback((error: string) => {
    setEvaluationError(error);
  }, []);

  // Evaluation mode
  const shouldEvaluate =
    output.type === 'evaluate_exam' &&
    output.triggerEvaluation &&
    !completedEval &&
    !evaluationError;

  if (shouldEvaluate && output.params) {
    return (
      <div className={cn('space-y-3 sm:space-y-4 w-full', className)}>
        {output.message && (
          <p className="text-xs sm:text-sm text-muted-foreground break-words">{output.message}</p>
        )}
        <EvalGenerationProgress
          params={output.params}
          apiEndpoint={output.apiEndpoint ?? '/api/sam/exam-evaluator/orchestrate'}
          onComplete={handleEvalComplete}
          onError={handleEvalError}
        />
      </div>
    );
  }

  // Completed evaluation
  if (completedEval) {
    return <CompletedEvalCard result={completedEval} className={className} />;
  }

  // Evaluation error
  if (evaluationError) {
    return (
      <Card className={cn('border-destructive/50 w-full', className)}>
        <CardContent className="pt-4 px-3 sm:px-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-destructive">Evaluation Failed</p>
              <p className="text-sm text-muted-foreground mt-1 break-words">{evaluationError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setEvaluationError(null)}
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

  // Conversation mode
  if (output.type === 'conversation') {
    return (
      <ConversationRenderer
        output={output}
        textInput={textInput}
        onTextInputChange={setTextInput}
        onTextSubmit={handleTextSubmit}
        onOptionSelect={handleOptionSelect}
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
  output: ExamEvaluatorToolOutput;
  textInput: string;
  onTextInputChange: (value: string) => void;
  onTextSubmit: () => void;
  onOptionSelect: (value: string) => void;
  isInteractive?: boolean;
  className?: string;
}

function ConversationRenderer({
  output,
  textInput,
  onTextInputChange,
  onTextSubmit,
  onOptionSelect,
  isInteractive = true,
  className,
}: ConversationRendererProps) {
  const StepIcon = output.step ? STEP_ICONS[output.step] ?? Brain : Brain;
  const needsTextInput = output.step === 'attemptId';
  const isConfirmStep = output.step === 'confirm';

  return (
    <div className={cn('space-y-3 w-full', className)}>
      {/* Progress dots */}
      {output.progress && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            {Array.from({ length: output.progress.total }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors',
                  i < output.progress!.current ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>
          <span className="whitespace-nowrap">
            Step {output.progress.current} of {output.progress.total}
          </span>
        </div>
      )}

      {/* Retry reason */}
      {output.retryReason && (
        <p className="text-xs text-amber-600 dark:text-amber-400 break-words">
          {output.retryReason}
        </p>
      )}

      {/* Question */}
      {output.question && (
        <div className="flex items-start gap-2">
          <StepIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium break-words">{output.question}</p>
        </div>
      )}

      {/* Hint */}
      {output.hint && (
        <p className="text-xs text-muted-foreground ml-6 sm:ml-7 break-words">{output.hint}</p>
      )}

      {/* Text input for attemptId */}
      {needsTextInput && (
        <div className="flex flex-col sm:flex-row gap-2 ml-6 sm:ml-7">
          <Input
            placeholder="Enter attempt ID..."
            value={textInput}
            onChange={(e) => onTextInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isInteractive) {
                onTextSubmit();
              }
            }}
            disabled={!isInteractive}
            className="flex-1 min-w-0"
          />
          <Button
            onClick={onTextSubmit}
            disabled={!isInteractive || !textInput.trim()}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </div>
      )}

      {/* Options */}
      {output.options && output.options.length > 0 && !needsTextInput && (
        <div className="ml-0 sm:ml-7">
          {isConfirmStep ? (
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
    if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
    if (typeof value === 'string') return value.replace(/_/g, ' ');
    return String(value);
  };

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2 ml-0 sm:ml-7">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="secondary" className="text-[10px] sm:text-xs capitalize">
          {formatValue(key, value)}
        </Badge>
      ))}
    </div>
  );
}

// =============================================================================
// EVALUATION GENERATION PROGRESS
// =============================================================================

const EVAL_STAGES = [
  { name: 'Answer Retrieval', icon: FileSearch },
  { name: 'DIAGNOSE Evaluation', icon: Microscope },
  { name: 'Echo-Back Teaching', icon: MessageSquare },
  { name: 'Cognitive Profile', icon: Brain },
  { name: 'Improvement Roadmap', icon: Map },
];

interface EvalGenerationProgressProps {
  params: Record<string, unknown>;
  apiEndpoint: string;
  onComplete: (result: EvalResult) => void;
  onError: (error: string) => void;
  className?: string;
}

function EvalGenerationProgress({
  params,
  apiEndpoint,
  onComplete,
  onError,
  className,
}: EvalGenerationProgressProps) {
  const [percent, setPercent] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Connecting to evaluator...');
  const [activeStage, setActiveStage] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const evaluate = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setPercent(0);
    setActiveStage(0);
    setCompletedStages([]);
    setCurrentMessage('Connecting to evaluator...');

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paramsRef.current),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as Record<string, string>).error || `Evaluation failed (${response.status})`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

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
                  case 'stage_start':
                    setActiveStage(data.stage as number);
                    break;
                  case 'stage_complete':
                    setCompletedStages((prev) => [...prev, data.stage as number]);
                    break;
                  case 'progress':
                    setPercent(data.percent as number);
                    if (data.message) setCurrentMessage(data.message as string);
                    break;
                  case 'complete':
                    onCompleteRef.current(data as unknown as EvalResult);
                    break;
                  case 'error':
                    setError((data.message as string) ?? 'Evaluation failed');
                    onErrorRef.current((data.message as string) ?? 'Evaluation failed');
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
        onErrorRef.current(err.message);
      } else {
        setError('An unexpected error occurred');
        onErrorRef.current('An unexpected error occurred');
      }
    } finally {
      setIsRetrying(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    evaluate();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [evaluate]);

  if (error) {
    return (
      <Card className={cn('border-destructive/50 bg-destructive/5', className)}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-destructive">Evaluation Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setIsRetrying(true);
                  evaluate();
                }}
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

  const isComplete = percent >= 100;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-4 space-y-4">
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium truncate">{currentMessage}</p>
            <span className="text-sm font-medium text-muted-foreground ml-2">{percent}%</span>
          </div>
          <Progress
            value={percent}
            className={cn('h-2 transition-all', isComplete && '[&>div]:bg-green-500')}
          />
        </div>

        {/* 5-stage timeline */}
        <div className="space-y-1.5">
          {EVAL_STAGES.map((stage, idx) => {
            const stageNum = idx + 1;
            const isActive = activeStage === stageNum;
            const isDone = completedStages.includes(stageNum);
            const StageIcon = stage.icon;

            return (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm',
                  isActive && 'bg-primary/5',
                  isDone && 'opacity-70',
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                ) : (
                  <StageIcon className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span
                  className={cn(
                    'flex-1 truncate',
                    !isActive && !isDone && 'text-muted-foreground/50',
                    isActive && 'font-medium',
                  )}
                >
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Params badges */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs capitalize">
            {String(params.evaluationMode ?? 'standard').replace(/_/g, ' ')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// COMPLETED EVALUATION CARD
// =============================================================================

const STATUS_COLORS: Record<string, string> = {
  mastery: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  solid: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  developing: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  emerging: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  gap: 'text-red-600 bg-red-100 dark:bg-red-900/30',
};

function CompletedEvalCard({
  result,
  className,
}: {
  result: EvalResult;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20 w-full',
        className,
      )}
    >
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
          <CardTitle className="text-sm sm:text-base">DIAGNOSE Evaluation Complete!</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-3 sm:px-6">
        {/* Stats summary */}
        {result.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold">{result.stats.totalAnswers}</div>
              <div className="text-[10px] text-muted-foreground">Answers</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold">{result.stats.averageComposite.toFixed(1)}/10</div>
              <div className="text-[10px] text-muted-foreground">Avg Score</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold">{result.stats.misconceptionsFound}</div>
              <div className="text-[10px] text-muted-foreground">Misconceptions</div>
            </div>
          </div>
        )}

        {/* Cognitive profile highlights */}
        {result.cognitiveProfile && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <p className="text-xs font-medium">Cognitive Profile</p>
            </div>

            {/* Ceiling + Growth Edge */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px]">
                <Target className="h-3 w-3 mr-1" />
                Ceiling: {result.cognitiveProfile.cognitiveCeiling}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <TrendingUp className="h-3 w-3 mr-1" />
                Growth Edge: {result.cognitiveProfile.growthEdge}
              </Badge>
              {result.cognitiveProfile.criticalGap && (
                <Badge variant="outline" className="text-[10px] border-red-300 dark:border-red-700">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Gap: {result.cognitiveProfile.criticalGap}
                </Badge>
              )}
            </div>

            {/* Bloom's cognitive map */}
            <div className="space-y-1">
              {Object.entries(result.cognitiveProfile.bloomsCognitiveMap).map(
                ([level, entry]) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className="text-[10px] w-20 font-medium">{level}</span>
                    <Progress value={entry.score} className="h-1.5 flex-1" />
                    <Badge
                      className={cn(
                        'text-[9px] px-1.5 py-0',
                        STATUS_COLORS[entry.status] ?? 'bg-muted',
                      )}
                    >
                      {entry.status}
                    </Badge>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Improvement priorities */}
        {result.improvementRoadmap &&
          result.improvementRoadmap.priorities.length > 0 && (
            <div className="pt-2 border-t space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <p className="text-xs font-medium">Top Priorities</p>
              </div>
              {result.improvementRoadmap.priorities.slice(0, 3).map((p) => (
                <div key={p.priority} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center flex-shrink-0">
                    {p.priority}
                  </span>
                  <span className="flex-1 truncate">{p.title}</span>
                </div>
              ))}
              {result.improvementRoadmap.estimatedTimeToNextLevel && (
                <p className="text-[10px] text-muted-foreground ml-6">
                  Est. time to next level: {result.improvementRoadmap.estimatedTimeToNextLevel}
                </p>
              )}
            </div>
          )}

        {result.echoBackCount !== undefined && result.echoBackCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {result.echoBackCount} echo-back teaching moment{result.echoBackCount > 1 ? 's' : ''} generated.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { ExamEvaluatorToolOutput, EvalResult };
