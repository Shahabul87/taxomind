'use client';

/**
 * ExamBuilderToolRenderer
 *
 * Renders exam builder tool output in SAM chat messages.
 * Handles conversation mode (8-step collection), generation mode
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
  BookOpen,
  GitBranch,
  MapPin,
  Target,
  BarChart3,
  Hash,
  Clock,
  ListChecks,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Brain,
  FileText,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  ConversationalOptions,
  InlineOptions,
  type ConversationalOption,
} from './ConversationalOptions';

// =============================================================================
// TYPES
// =============================================================================

interface ExamBuilderToolOutput {
  type: 'conversation' | 'generate_exam';
  conversationId?: string;
  step?: string;
  question?: string;
  options?: ConversationalOption[];
  hint?: string;
  collected?: Record<string, unknown>;
  message?: string;
  retryReason?: string;
  progress?: { current: number; total: number };
  // Generation mode
  params?: Record<string, unknown>;
  summary?: string;
  apiEndpoint?: string;
  triggerGeneration?: boolean;
}

interface ExamBuilderResult {
  success: boolean;
  examId?: string;
  questionCount?: number;
  bloomsProfile?: Record<string, number>;
  stats?: {
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number;
    averageQualityScore: number;
    conceptsCovered: number;
    bloomsLevelsCovered: number;
  };
}

interface ExamBuilderToolRendererProps {
  output: ExamBuilderToolOutput;
  onSendMessage: (message: string) => void;
  isInteractive?: boolean;
  className?: string;
}

// =============================================================================
// STEP ICONS
// =============================================================================

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  topic: BookOpen,
  subtopics: GitBranch,
  studentLevel: MapPin,
  examPurpose: Target,
  bloomsDistribution: BarChart3,
  questionCount: Hash,
  timeLimit: Clock,
  questionFormats: ListChecks,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExamBuilderToolRenderer({
  output,
  onSendMessage,
  isInteractive = true,
  className,
}: ExamBuilderToolRendererProps) {
  const [textInput, setTextInput] = useState('');
  const [completedExam, setCompletedExam] = useState<ExamBuilderResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

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

  const handleGenerationComplete = useCallback((result: ExamBuilderResult) => {
    setCompletedExam(result);
  }, []);

  const handleGenerationError = useCallback((error: string) => {
    setGenerationError(error);
  }, []);

  // Generation mode
  const shouldGenerate =
    output.type === 'generate_exam' &&
    output.triggerGeneration &&
    !completedExam &&
    !generationError;

  if (shouldGenerate && output.params) {
    return (
      <div className={cn('space-y-3 sm:space-y-4 w-full', className)}>
        {output.message && (
          <p className="text-xs sm:text-sm text-muted-foreground break-words">{output.message}</p>
        )}
        <ExamGenerationProgress
          params={output.params}
          apiEndpoint={output.apiEndpoint ?? '/api/sam/exam-builder/orchestrate'}
          onComplete={handleGenerationComplete}
          onError={handleGenerationError}
        />
      </div>
    );
  }

  // Completed exam
  if (completedExam) {
    return <CompletedExamCard result={completedExam} className={className} />;
  }

  // Generation error
  if (generationError) {
    return (
      <Card className={cn('border-destructive/50 w-full', className)}>
        <CardContent className="pt-4 px-3 sm:px-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-destructive">Exam Generation Failed</p>
              <p className="text-sm text-muted-foreground mt-1 break-words">{generationError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setGenerationError(null)}
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
  output: ExamBuilderToolOutput;
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
  const needsTextInput = output.step === 'topic' || output.step === 'subtopics';

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

      {/* Text input for topic / subtopics */}
      {needsTextInput && (
        <div className="flex flex-col sm:flex-row gap-2 ml-6 sm:ml-7">
          <Input
            placeholder={
              output.step === 'topic'
                ? 'Enter exam topic...'
                : 'Enter subtopics (comma-separated) or type "auto"...'
            }
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
          <ConversationalOptions
            options={output.options}
            onSelect={onOptionSelect}
            columns={2}
            showDescriptions={true}
            disabled={!isInteractive}
          />
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
    if (typeof value === 'number') {
      if (key === 'questionCount') return `${value} questions`;
      if (key === 'timeLimit') return value === 0 ? 'No limit' : `${value} min`;
      return String(value);
    }
    if (typeof value === 'string') {
      if (value === 'auto') return 'Auto';
      return value.replace(/_/g, ' ').replace(/-/g, ' ');
    }
    if (Array.isArray(value)) {
      return value.map((v) => String(v).replace(/_/g, ' ')).join(', ');
    }
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
// EXAM GENERATION PROGRESS
// =============================================================================

const EXAM_STAGES = [
  { name: 'Knowledge Decomposition', icon: GitBranch },
  { name: 'Question Distribution', icon: BarChart3 },
  { name: 'Question Generation', icon: Sparkles },
  { name: 'Quality Assurance', icon: Shield },
  { name: 'Assembly & Profile', icon: FileText },
];

interface ExamGenerationProgressProps {
  params: Record<string, unknown>;
  apiEndpoint: string;
  onComplete: (result: ExamBuilderResult) => void;
  onError: (error: string) => void;
  className?: string;
}

function ExamGenerationProgress({
  params,
  apiEndpoint,
  onComplete,
  onError,
  className,
}: ExamGenerationProgressProps) {
  const [percent, setPercent] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Connecting to exam builder...');
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

  const generate = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError(null);
    setPercent(0);
    setActiveStage(0);
    setCompletedStages([]);
    setCurrentMessage('Connecting to exam builder...');

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
          (errorData as Record<string, string>).error || `Generation failed (${response.status})`,
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
                    onCompleteRef.current(data as unknown as ExamBuilderResult);
                    break;
                  case 'error':
                    setError((data.message as string) ?? 'Generation failed');
                    onErrorRef.current((data.message as string) ?? 'Generation failed');
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
    generate();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [generate]);

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
                onClick={() => {
                  setIsRetrying(true);
                  generate();
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
          {EXAM_STAGES.map((stage, idx) => {
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
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {String(params.topic ?? 'Exam')}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
            {String(params.questionCount ?? '?')} questions
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs capitalize">
            {String(params.studentLevel ?? '').replace(/_/g, ' ')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// COMPLETED EXAM CARD
// =============================================================================

function CompletedExamCard({
  result,
  className,
}: {
  result: ExamBuilderResult;
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
          <CardTitle className="text-sm sm:text-base">Exam Created!</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-3 sm:px-6">
        {/* Stats */}
        {result.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold">{result.stats.totalQuestions}</div>
              <div className="text-[10px] text-muted-foreground">Questions</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold">{result.stats.totalPoints}</div>
              <div className="text-[10px] text-muted-foreground">Points</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold">{result.stats.estimatedDuration}m</div>
              <div className="text-[10px] text-muted-foreground">Duration</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold">{result.stats.averageQualityScore}%</div>
              <div className="text-[10px] text-muted-foreground">Quality</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold">{result.stats.conceptsCovered}</div>
              <div className="text-[10px] text-muted-foreground">Concepts</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold">{result.stats.bloomsLevelsCovered}/6</div>
              <div className="text-[10px] text-muted-foreground">Bloom&apos;s</div>
            </div>
          </div>
        )}

        {/* Bloom's distribution */}
        {result.bloomsProfile && Object.keys(result.bloomsProfile).length > 0 && (
          <div className="pt-2 border-t space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Bloom&apos;s Distribution</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(result.bloomsProfile).map(([level, count]) => (
                <Badge key={level} variant="outline" className="text-[10px]">
                  {level}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          The exam has been saved. You can view and edit it in the Exam Creator panel.
        </p>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { ExamBuilderToolOutput, ExamBuilderResult };
