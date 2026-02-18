/**
 * SAM Sequential Course Creation Modal
 *
 * A comprehensive modal that shows real-time progress during the 3-stage
 * course creation process. Displays:
 * - Current stage and phase
 * - Chapter/section being generated
 * - SAM's thinking process
 * - Quality indicators
 * - Progress percentage
 */

'use client';

import { memo, useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  BookOpen,
  Layers,
  FileText,
  CheckCircle2,
  Loader2,
  XCircle,
  X,
  RotateCcw,
  ChevronRight,
  Target,
  Lightbulb,
  AlertTriangle,
  Zap,
  Clock,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreationProgress } from '@/lib/sam/course-creation/types';

// ============================================================================
// Types
// ============================================================================

interface SequentialCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: CreationProgress;
  isCreating: boolean;
  error: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
  onResume?: () => void;
  onRegenerate?: (chapterId: string, position: number) => void;
  regeneratingChapterId?: string | null;
  resumableCourseId?: string | null;
  formData: {
    courseTitle: string;
    targetAudience?: string;
    difficulty?: string;
    chapterCount?: number;
    sectionsPerChapter?: number;
  };
}

interface StageConfig {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

// ============================================================================
// Stage Configuration
// ============================================================================

const DF_STAGE_CONFIG: Record<1 | 2 | 3, StageConfig> = {
  1: {
    icon: BookOpen,
    title: 'Stage 1: Chapter Generation',
    description: 'Creating chapters with Bloom\'s taxonomy progression',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  2: {
    icon: Layers,
    title: 'Stage 2: Section Generation',
    description: 'Building unique sections for each chapter',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  3: {
    icon: FileText,
    title: 'Stage 3: Detail Generation',
    description: 'Filling in learning objectives and descriptions',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
};

function getStageConfig(): Record<1 | 2 | 3, StageConfig> {
  return DF_STAGE_CONFIG;
}

// ============================================================================
// Stage Progress Bar
// ============================================================================

const StageProgressBar = memo(function StageProgressBar({
  currentStage,
  percentage,
}: {
  currentStage: 1 | 2 | 3;
  percentage: number;
}) {
  const stageConfig = getStageConfig();

  const s1End = 30;
  const s2End = 60;

  // Calculate which segments are complete
  const stage1Complete = percentage >= s1End;
  const stage2Complete = percentage >= s2End;
  const stage3Complete = percentage >= 100;

  // Calculate segment progress
  const getSegmentProgress = (stage: 1 | 2 | 3) => {
    if (stage === 1) {
      return Math.min(100, (percentage / s1End) * 100);
    } else if (stage === 2) {
      if (percentage < s1End) return 0;
      return Math.min(100, ((percentage - s1End) / (s2End - s1End)) * 100);
    } else {
      if (percentage < s2End) return 0;
      return Math.min(100, ((percentage - s2End) / (100 - s2End)) * 100);
    }
  };

  return (
    <div className="space-y-3 w-full overflow-hidden">
      <div className="flex items-center gap-2 w-full">
        {[1, 2, 3].map((stage) => {
          const config = stageConfig[stage as 1 | 2 | 3];
          const Icon = config.icon;
          const isActive = currentStage === stage;
          const isComplete =
            (stage === 1 && stage1Complete) ||
            (stage === 2 && stage2Complete) ||
            (stage === 3 && stage3Complete);

          return (
            <div key={stage} className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    'p-1.5 rounded-lg transition-all duration-300 flex-shrink-0',
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? config.bgColor + ' ' + config.color
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium truncate',
                    isActive ? config.color : 'text-muted-foreground'
                  )}
                >
                  Stage {stage}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                <motion.div
                  className={cn(
                    'h-full rounded-full max-w-full',
                    stage === 1
                      ? 'bg-blue-500'
                      : stage === 2
                        ? 'bg-purple-500'
                        : 'bg-emerald-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, getSegmentProgress(stage as 1 | 2 | 3))}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ============================================================================
// Current Activity Display
// ============================================================================

const CurrentActivityDisplay = memo(function CurrentActivityDisplay({
  progress,
}: {
  progress: CreationProgress;
}) {
  const { state } = progress;
  const stageConfig = getStageConfig();
  const config = stageConfig[state.stage] ?? stageConfig[1];
  const Icon = config.icon;

  const activityText = useMemo(() => {
    if (state.phase === 'creating_course') {
      return 'Setting up course in database...';
    }
    if (state.phase === 'generating_chapter') {
      return `Generating Chapter ${state.currentChapter} of ${state.totalChapters}`;
    }
    if (state.phase === 'generating_section') {
      return `Creating Section ${state.currentSection} of ${state.totalSections}`;
    }
    if (state.phase === 'generating_details') {
      return `Adding details to Section ${state.currentSection} of Chapter ${state.currentChapter}`;
    }
    if (state.phase === 'complete') {
      return 'Course creation complete!';
    }
    if (state.phase === 'error') {
      return 'An error occurred';
    }
    return 'Preparing...';
  }, [state]);

  return (
    <motion.div
      key={activityText}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-xl border',
        config.bgColor,
        'border-current/10'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg bg-white/50', config.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className={cn('font-semibold text-sm', config.color)}>
            {config.title}
          </div>
          <div className="text-sm text-muted-foreground">{activityText}</div>
        </div>
        {state.phase !== 'complete' && state.phase !== 'error' && state.phase !== 'idle' && (
          <Loader2 className={cn('h-5 w-5 animate-spin', config.color)} />
        )}
        {state.phase === 'complete' && (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
      </div>

      {/* Current Item */}
      {progress.currentItem && (
        <div className="mt-3 pl-11">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ChevronRight className="h-3 w-3" />
            <span className="truncate">{progress.currentItem}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
});

// ============================================================================
// SAM Thinking Display
// ============================================================================

const SAMThinkingDisplay = memo(function SAMThinkingDisplay({
  thinking,
  isStreaming,
}: {
  thinking?: string;
  isStreaming?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thinking]);

  if (!thinking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        <span>SAM&apos;s Thinking</span>
      </div>
      <ScrollArea
        ref={scrollRef}
        className="h-24 rounded-lg bg-muted/50 p-3"
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          {thinking}
          {isStreaming && (
            <span className="inline-block w-1.5 h-3.5 bg-amber-500 ml-0.5 animate-pulse" />
          )}
        </p>
      </ScrollArea>
    </motion.div>
  );
});

// ============================================================================
// Timing / ETA Display
// ============================================================================

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

const TimingDisplay = memo(function TimingDisplay({
  timing,
  isCreating,
  startTime,
}: {
  timing?: CreationProgress['timing'];
  isCreating: boolean;
  startTime: number;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isCreating || startTime === 0) return;

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCreating, startTime]);

  if (!isCreating || startTime === 0) return null;

  const elapsedMs = elapsed || timing?.elapsedMs || 0;
  const hasEta = timing && timing.itemsCompleted >= 2 && timing.estimatedRemainingMs !== null;

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        <span>Elapsed: {formatDuration(elapsedMs)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Timer className="h-3.5 w-3.5" />
        {hasEta ? (
          <span>~{formatDuration(timing.estimatedRemainingMs!)} remaining</span>
        ) : (
          <span className="text-muted-foreground/60">Calculating ETA...</span>
        )}
      </div>
      {timing && timing.itemsCompleted > 0 && (
        <span>{timing.itemsCompleted}/{timing.totalItems} items</span>
      )}
    </div>
  );
});

// ============================================================================
// Completed Items List
// ============================================================================

const QUALITY_REGENERATE_THRESHOLD = 70;

const CompletedItemsList = memo(function CompletedItemsList({
  chapters,
  sections,
  isComplete,
  onRegenerate,
  regeneratingChapterId,
}: {
  chapters: Array<{ position: number; title: string; id?: string; qualityScore?: number }>;
  sections: Array<{ chapterPosition: number; position: number; title: string; id?: string; qualityScore?: number }>;
  isComplete?: boolean;
  onRegenerate?: (chapterId: string, position: number) => void;
  regeneratingChapterId?: string | null;
}) {
  const hasItems = chapters.length > 0 || sections.length > 0;

  if (!hasItems) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Target className="h-3.5 w-3.5 text-green-500" />
        <span>Created Items</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {chapters.length} chapters, {sections.length} sections
        </Badge>
      </div>
      <ScrollArea className="h-48 rounded-lg border bg-card p-2">
        <div className="space-y-1">
          {chapters.map((chapter, idx) => {
            const canRegenerate =
              isComplete && onRegenerate && chapter.id &&
              chapter.qualityScore != null && chapter.qualityScore < QUALITY_REGENERATE_THRESHOLD;
            const isRegenerating = regeneratingChapterId === chapter.id;

            return (
              <div key={`chapter-${idx}`}
                className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/50"
              >
                <BookOpen className="h-3 w-3 text-blue-500" />
                <span className="flex-1 truncate">{chapter.title}</span>
                {chapter.qualityScore != null && (
                  <Badge variant="outline" className={cn(
                    'text-[10px]',
                    chapter.qualityScore >= 80 ? 'text-green-600 border-green-500/30'
                      : chapter.qualityScore >= 60 ? 'text-amber-600 border-amber-500/30'
                        : 'text-red-600 border-red-500/30'
                  )}>
                    {chapter.qualityScore}%
                  </Badge>
                )}
                {canRegenerate && (
                  <Button variant="ghost" size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-amber-600"
                    disabled={!!regeneratingChapterId}
                    onClick={() => onRegenerate(chapter.id!, chapter.position)}
                    title="Regenerate this chapter (quality below 70%)"
                  >
                    {isRegenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            );
          })}
          {sections.slice(-5).map((section, idx) => (
            <div key={`section-${idx}`}
              className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30 ml-4"
            >
              <Layers className="h-3 w-3 text-purple-500" />
              <span className="flex-1 truncate">{section.title}</span>
              {section.qualityScore != null && (
                <Badge variant="outline" className={cn(
                  'text-[10px]',
                  section.qualityScore >= 80 ? 'text-green-600 border-green-500/30'
                    : section.qualityScore >= 60 ? 'text-amber-600 border-amber-500/30'
                      : 'text-red-600 border-red-500/30'
                )}>
                  {section.qualityScore}%
                </Badge>
              )}
            </div>
          ))}
          {sections.length > 5 && (
            <div className="text-xs text-muted-foreground text-center py-1">
              ...and {sections.length - 5} more sections
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

// ============================================================================
// Main Component
// ============================================================================

export const SequentialCreationModal = memo(function SequentialCreationModal({
  isOpen,
  onClose,
  progress,
  isCreating,
  error,
  onCancel,
  onRetry,
  onResume,
  onRegenerate,
  regeneratingChapterId,
  resumableCourseId,
  formData,
}: SequentialCreationModalProps) {
  const isComplete = progress.state.phase === 'complete';
  const isError = progress.state.phase === 'error' || !!error;
  const startTimeRef = useRef<number>(0);

  // Track when creation starts
  useEffect(() => {
    if (isCreating && startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }
    if (!isCreating) {
      startTimeRef.current = 0;
    }
  }, [isCreating]);

  // Prevent closing while creating
  const handleClose = () => {
    if (!isCreating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-xl',
                  isComplete
                    ? 'bg-green-500'
                    : isError
                      ? 'bg-red-500'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : isError ? (
                  <XCircle className="h-5 w-5 text-white" />
                ) : (
                  <Brain className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {isComplete
                    ? 'Course Created Successfully!'
                    : isError
                      ? 'Creation Failed'
                      : 'SAM Sequential Course Creation'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isComplete
                    ? 'Your course is ready for review'
                    : isError
                      ? 'Something went wrong during creation'
                      : 'Creating high-quality content with context awareness'}
                </p>
              </div>
            </div>
            {!isCreating && (
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4 overflow-x-hidden overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Course Info */}
          <Card className="border-dashed bg-muted/30">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Course:</span>
                  <p className="font-medium truncate">{formData.courseTitle}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Structure:</span>
                  <p className="font-medium">
                    {formData.chapterCount} chapters x{' '}
                    {formData.sectionsPerChapter} sections
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Target:</span>
                  <p className="font-medium">{formData.targetAudience || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Difficulty:</span>
                  <Badge variant="outline" className="capitalize">
                    {formData.difficulty || 'Intermediate'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Progress */}
          <div className="space-y-2 w-full overflow-hidden">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{Math.min(100, progress.percentage)}%</span>
            </div>
            <Progress
              value={Math.min(100, progress.percentage)}
              className={cn(
                'h-3 w-full',
                isError && '[&>div]:bg-red-500',
                isComplete && '[&>div]:bg-green-500'
              )}
            />
          </div>

          {/* Timing / ETA */}
          {!isComplete && !isError && (
            <TimingDisplay
              timing={progress.timing}
              isCreating={isCreating}
              startTime={startTimeRef.current}
            />
          )}

          {/* Stage Progress */}
          {!isComplete && !isError && (
            <StageProgressBar
              currentStage={progress.state.stage}
              percentage={progress.percentage}
            />
          )}

          {/* Current Activity */}
          <CurrentActivityDisplay progress={progress} />

          {/* SAM's Thinking */}
          <SAMThinkingDisplay thinking={progress.thinking} isStreaming={isCreating} />

          {/* Completed Items */}
          <CompletedItemsList
            chapters={progress.completedItems.chapters}
            sections={progress.completedItems.sections}
            isComplete={isComplete}
            onRegenerate={onRegenerate}
            regeneratingChapterId={regeneratingChapterId}
          />

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="border-red-500/30 bg-red-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1 min-w-0">
                        <div className="font-medium text-red-600">Error</div>
                        <div className="text-sm text-muted-foreground break-words">
                          {error}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/20">
                        <Zap className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-green-600">
                          Course Created Successfully!
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {progress.completedItems.chapters.length} chapters and{' '}
                          {progress.completedItems.sections.length} sections created
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            {isCreating && onCancel && (
              <Button variant="outline" onClick={onCancel}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            {isError && onResume && resumableCourseId && (
              <Button onClick={onResume} variant="default">
                <ChevronRight className="h-4 w-4 mr-2" />
                {progress.completedItems.chapters.length > 0
                  ? `Resume from Chapter ${progress.completedItems.chapters.length + 1}`
                  : 'Resume Course Creation'}
              </Button>
            )}
            {isError && onRetry && (
              <Button onClick={onRetry} variant={onResume && resumableCourseId ? 'outline' : 'default'}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {onResume && resumableCourseId ? 'Start Over' : 'Try Again'}
              </Button>
            )}
            {isComplete && (
              <Button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                View Course
              </Button>
            )}
            {!isCreating && !isComplete && !isError && (
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default SequentialCreationModal;
