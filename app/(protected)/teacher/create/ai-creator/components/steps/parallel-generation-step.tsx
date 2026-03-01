"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StepComponentProps } from '../../types/sam-creator.types';
import type { CreationProgress } from '@/hooks/use-sam-sequential-creation/types';
import type { ChapterDetailState } from '@/lib/sam/course-creation/types';
import { ChapterDetailModal } from './chapter-detail-modal';
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  Layers,
  Target,
  Clock,
  Play,
  RotateCcw,
  XCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface ParallelGenerationStepProps extends StepComponentProps {
  sequentialProgress: CreationProgress;
  isSequentialCreating: boolean;
  sequentialError: string | null;
  onStartGeneration: () => Promise<void>;
  onRetry: () => Promise<void>;
  onCancel: () => void;
  regeneratingChapterId: string | null;
  onRegenerate: (chapterId: string, position: number) => void;
  onApproveContinue: () => void;
  onApproveHeal: () => void;
  onAbortPaused: () => void;
  resumableCourseId: string | null;
  onResume: () => void;
}

type ChapterStatus = 'pending' | 'generating' | 'complete' | 'failed' | 'fallback';

interface ChapterCard {
  position: number;
  title: string;
  status: ChapterStatus;
  qualityScore?: number;
  stage?: string;
  id?: string;
  /** Error snippet for display on failed cards */
  errorSnippet?: string;
  /** Is this a fallback chapter? */
  isFallback?: boolean;
}

export function ParallelGenerationStep({
  formData,
  sequentialProgress,
  isSequentialCreating,
  sequentialError,
  onStartGeneration,
  onRetry,
  onCancel,
  regeneratingChapterId,
  onRegenerate,
  onApproveContinue,
  onApproveHeal,
  onAbortPaused,
  resumableCourseId,
  onResume,
}: ParallelGenerationStepProps) {
  const [selectedChapterPos, setSelectedChapterPos] = React.useState<number | null>(null);

  const blueprint = formData.teacherBlueprint;
  const totalChapters = blueprint?.chapters.length ?? formData.chapterCount;
  const totalSections = blueprint?.chapters.reduce((sum, ch) => sum + ch.sections.length, 0) ?? (formData.chapterCount * formData.sectionsPerChapter);
  const phase = sequentialProgress.state.phase;
  const hasStarted = phase !== 'idle';
  const isComplete = phase === 'complete';
  const isPaused = phase === 'paused';
  const parallelBatch = sequentialProgress.parallelBatch;
  const chapterDetails = sequentialProgress.chapterDetails;
  const completedChapters = React.useMemo(
    () => sequentialProgress.completedItems?.chapters ?? [],
    [sequentialProgress.completedItems?.chapters]
  );
  const completedSections = React.useMemo(
    () => sequentialProgress.completedItems?.sections ?? [],
    [sequentialProgress.completedItems?.sections]
  );

  // Build chapter cards from blueprint + progress state + chapterDetails.
  // chapterDetails provides richer status (failed, fallback, stage name, section progress)
  const chapterCards: ChapterCard[] = React.useMemo(() => {
    const activeChapters = parallelBatch?.activeChapters ?? [];

    const buildCard = (position: number, blueprintTitle?: string): ChapterCard => {
      const detail = chapterDetails?.[position];
      const completed = completedChapters.find(c => c.position === position);
      const defaultTitle = blueprintTitle ?? `Chapter ${position}`;

      // If chapterDetails has rich status, use it
      if (detail) {
        if (detail.status === 'failed') {
          return {
            position,
            title: detail.title || defaultTitle,
            status: 'failed',
            id: detail.id,
            stage: detail.stageName,
            errorSnippet: detail.error ? detail.error.slice(0, 60) : undefined,
          };
        }
        if (detail.status === 'fallback') {
          return {
            position,
            title: detail.title || defaultTitle,
            status: 'fallback',
            qualityScore: 30,
            id: detail.id,
            isFallback: true,
          };
        }
        if (detail.status === 'complete' || completed) {
          return {
            position,
            title: completed?.title || detail.title || defaultTitle,
            status: 'complete',
            qualityScore: completed?.qualityScore ?? detail.qualityScore,
            id: completed?.id || detail.id,
          };
        }
        if (detail.status === 'generating') {
          return {
            position,
            title: detail.title || defaultTitle,
            status: 'generating',
            stage: detail.stageName || 'Generating',
          };
        }
      }

      // Fallback to existing logic (no chapterDetails yet)
      if (completed) {
        return {
          position,
          title: completed.title || defaultTitle,
          status: 'complete',
          qualityScore: completed.qualityScore,
          id: completed.id,
        };
      }
      if (isSequentialCreating && activeChapters.includes(position)) {
        return { position, title: defaultTitle, status: 'generating', stage: 'Generating' };
      }
      // Sequential fallback: single currentChapter indicator
      const currentChapter = sequentialProgress.state.currentChapter;
      if (isSequentialCreating && currentChapter === position) {
        const stageNum = sequentialProgress.state.stage;
        const stageNames = ['Structure', 'Sections', 'Details'];
        return {
          position,
          title: defaultTitle,
          status: 'generating',
          stage: stageNames[(stageNum ?? 1) - 1] || 'Generating',
        };
      }
      return { position, title: defaultTitle, status: 'pending' };
    };

    if (!blueprint) {
      return Array.from({ length: totalChapters }, (_, i) => buildCard(i + 1));
    }

    return blueprint.chapters.map((ch) => buildCard(ch.position, ch.title));
  }, [blueprint, totalChapters, completedChapters, parallelBatch, chapterDetails, sequentialProgress, isSequentialCreating]);

  // Selected chapter detail for modal
  const selectedChapterDetail: ChapterDetailState | null = React.useMemo(() => {
    if (selectedChapterPos == null || !chapterDetails) return null;
    return chapterDetails[selectedChapterPos] ?? null;
  }, [selectedChapterPos, chapterDetails]);

  // Handle retry from modal
  const handleModalRetry = React.useCallback((position: number) => {
    const detail = chapterDetails?.[position];
    if (detail?.id) {
      onRegenerate(detail.id, position);
    }
  }, [chapterDetails, onRegenerate]);

  // Cap at 100% — defensive against any dedup failure in the SSE handler
  const completionPercentage = totalChapters > 0
    ? Math.min(100, Math.round((completedChapters.length / totalChapters) * 100))
    : 0;

  // Cap displayed count at totalChapters as a safety net
  const displayedCompletedCount = Math.min(completedChapters.length, totalChapters);

  return (
    <div className="space-y-6">
      {/* Blueprint Summary Card */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Course Generation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isComplete
                  ? 'All chapters generated successfully!'
                  : isSequentialCreating
                    ? 'Generating chapters in parallel...'
                    : 'Ready to generate your course'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          {!hasStarted && !isComplete && (
            <Button
              onClick={onStartGeneration}
              disabled={isSequentialCreating}
              className={cn(
                "h-11 px-6 rounded-xl font-semibold",
                "bg-gradient-to-r from-emerald-600 to-teal-600",
                "hover:from-emerald-700 hover:to-teal-700",
                "shadow-lg shadow-emerald-500/25",
                "disabled:opacity-50"
              )}
            >
              <Play className="h-4 w-4 mr-2" />
              Generate Course
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <BookOpen className="h-4 w-4 mx-auto mb-1 text-indigo-500" />
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalChapters}</div>
            <div className="text-[10px] text-slate-500">Chapters</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <Layers className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{totalSections}</div>
            <div className="text-[10px] text-slate-500">Sections</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <Target className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">{formData.courseGoals.length}</div>
            <div className="text-[10px] text-slate-500">Objectives</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">~{Math.round(Math.ceil(totalChapters / 3) * 3)}</div>
            <div className="text-[10px] text-slate-500">Est. min</div>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {hasStarted && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {displayedCompletedCount}/{totalChapters} chapters ({completionPercentage}%)
            </span>
          </div>
          <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
                isComplete
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {sequentialProgress.message && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {sequentialProgress.message}
            </p>
          )}
        </div>
      )}

      {/* Batch Progress Indicator */}
      {hasStarted && parallelBatch && parallelBatch.totalBatches > 1 && (
        <div className="flex items-center gap-2 px-1">
          {Array.from({ length: parallelBatch.totalBatches }, (_, i) => {
            const batchNum = i + 1;
            const isCurrent = batchNum === parallelBatch.currentBatch;
            const isCompleted = batchNum < parallelBatch.currentBatch || isComplete;
            return (
              <div key={batchNum} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isCompleted && "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
                  isCurrent && !isComplete && "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-600",
                  !isCurrent && !isCompleted && "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : isCurrent && !isComplete ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                  Batch {batchNum}
                </div>
                {i < parallelBatch.totalBatches - 1 && (
                  <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Healing Progress Banner */}
      {sequentialProgress.healingInProgress && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Improving Course Quality
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
              {sequentialProgress.healingMessage ?? 'Regenerating low-quality chapters...'}
            </p>
          </div>
          {sequentialProgress.healingChapters && sequentialProgress.healingChapters.length > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex-shrink-0">
              {sequentialProgress.healingChapters.length} chapter{sequentialProgress.healingChapters.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Chapter Progress Grid */}
      {hasStarted && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chapterCards.map((card) => {
            const detail = chapterDetails?.[card.position];

            return (
              <div
                key={card.position}
                onClick={() => setSelectedChapterPos(card.position)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedChapterPos(card.position); }}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer",
                  "hover:ring-2 hover:ring-offset-1 hover:ring-indigo-300 dark:hover:ring-indigo-600",
                  "focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-400",
                  "outline-none",
                  card.status === 'pending' && "bg-slate-50 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-700 opacity-60",
                  card.status === 'generating' && "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-md",
                  card.status === 'complete' && "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700",
                  card.status === 'failed' && "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700",
                  card.status === 'fallback' && "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700",
                )}
              >
                {/* Status Icon */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                      card.status === 'pending' && "bg-slate-200 dark:bg-slate-700 text-slate-500",
                      card.status === 'generating' && "bg-blue-500 text-white",
                      card.status === 'complete' && "bg-emerald-500 text-white",
                      card.status === 'failed' && "bg-red-500 text-white",
                      card.status === 'fallback' && "bg-amber-500 text-white",
                    )}>
                      {card.status === 'complete' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : card.status === 'generating' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : card.status === 'failed' ? (
                        <XCircle className="h-4 w-4" />
                      ) : card.status === 'fallback' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        card.position
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Ch. {card.position}
                    </span>
                  </div>

                  {/* Quality badge or Fallback badge */}
                  {card.status === 'fallback' ? (
                    <Badge className="text-[10px] font-bold border-0 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                      Fallback
                    </Badge>
                  ) : card.qualityScore !== undefined && (
                    <Badge className={cn(
                      "text-[10px] font-bold border-0",
                      card.qualityScore >= 80
                        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                        : card.qualityScore >= 60
                          ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                          : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                    )}>
                      {card.qualityScore}%
                    </Badge>
                  )}
                </div>

                <h4 className={cn(
                  "text-sm font-semibold truncate",
                  card.status === 'pending' && "text-slate-400 dark:text-slate-500",
                  card.status === 'generating' && "text-blue-800 dark:text-blue-200",
                  card.status === 'complete' && "text-emerald-800 dark:text-emerald-200",
                  card.status === 'failed' && "text-red-800 dark:text-red-200",
                  card.status === 'fallback' && "text-amber-800 dark:text-amber-200",
                )}>
                  {card.title}
                </h4>

                {/* Stage indicator for generating */}
                {card.status === 'generating' && card.stage && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      {card.stage}
                    </span>
                  </div>
                )}

                {/* Section progress for generating chapters */}
                {card.status === 'generating' && detail && detail.totalSections > 0 && detail.completedSections > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-blue-100 dark:bg-blue-900/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((detail.completedSections / detail.totalSections) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-blue-500 font-medium">
                      {detail.completedSections}/{detail.totalSections}
                    </span>
                  </div>
                )}

                {/* Error snippet for failed cards */}
                {card.status === 'failed' && card.errorSnippet && (
                  <p className="mt-1.5 text-[10px] text-red-500 dark:text-red-400 truncate">
                    {card.errorSnippet}
                  </p>
                )}

                {/* Retry button for failed */}
                {card.status === 'failed' && card.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerate(card.id!, card.position);
                    }}
                    disabled={regeneratingChapterId === card.id}
                    className="mt-2 h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Chapter Detail Modal */}
      <ChapterDetailModal
        chapter={selectedChapterDetail}
        open={selectedChapterPos != null}
        onClose={() => setSelectedChapterPos(null)}
        onRetry={handleModalRetry}
        modelInfo={sequentialProgress.modelInfo}
      />

      {/* Error State */}
      {sequentialError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Generation Error
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {sequentialError}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={onRetry}
                  className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancel}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paused State (Escalation) */}
      {isPaused && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Generation Paused — Quality Gate
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                The pipeline detected quality issues. Please choose how to proceed.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={onApproveContinue}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Continue
                </Button>
                <Button
                  size="sm"
                  onClick={onApproveHeal}
                  className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Heal &amp; Continue
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAbortPaused}
                  className="h-8 text-xs"
                >
                  Abort
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creating State — Cancel Button */}
      {isSequentialCreating && !isPaused && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-9 px-4 text-xs text-slate-500 hover:text-red-600 hover:border-red-300"
          >
            Cancel Generation
          </Button>
        </div>
      )}

      {/* Complete State — View Course */}
      {isComplete && sequentialProgress.completedItems?.chapters?.length > 0 && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-300 dark:border-emerald-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                  Course Created Successfully!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {completedChapters.length} chapters, {completedSections.length} sections generated
                </p>
              </div>
            </div>
            {sequentialProgress.state.courseId && (
              <Button
                asChild
                className={cn(
                  "h-11 px-6 rounded-xl font-semibold",
                  "bg-gradient-to-r from-emerald-600 to-teal-600",
                  "hover:from-emerald-700 hover:to-teal-700",
                  "shadow-lg shadow-emerald-500/25"
                )}
              >
                <a href={`/teacher/courses/${sequentialProgress.state.courseId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Course
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
