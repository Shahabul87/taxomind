"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ChapterDetailState, ChapterTimelineEvent } from '@/lib/sam/course-creation/types';
import {
  CheckCircle2,
  Loader2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  Brain,
  RotateCcw,
  FileText,
  Activity,
  Zap,
} from 'lucide-react';

// ============================================================================
// Props
// ============================================================================

interface ChapterDetailModalProps {
  /** The chapter detail state (null = closed) */
  chapter: ChapterDetailState | null;
  /** Whether the modal is open */
  open: boolean;
  /** Close the modal */
  onClose: () => void;
  /** Retry a failed chapter */
  onRetry?: (position: number) => void;
  /** Model info for display */
  modelInfo?: {
    provider: string;
    model: string;
    isReasoningModel: boolean;
    batchSize: number;
  };
}

// ============================================================================
// Helpers
// ============================================================================

function getStatusIcon(status: ChapterDetailState['status']) {
  switch (status) {
    case 'pending':
      return <Clock className="h-5 w-5 text-slate-400" />;
    case 'generating':
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'complete':
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'fallback':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  }
}

function getStatusLabel(status: ChapterDetailState['status']) {
  switch (status) {
    case 'pending': return 'Pending';
    case 'generating': return 'Generating';
    case 'complete': return 'Complete';
    case 'failed': return 'Failed';
    case 'fallback': return 'Fallback';
  }
}

function getStatusBadgeClass(status: ChapterDetailState['status']) {
  switch (status) {
    case 'pending':
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    case 'generating':
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
    case 'complete':
      return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300';
    case 'failed':
      return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
    case 'fallback':
      return 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300';
  }
}

function getQualityColor(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getQualityBgColor(score: number) {
  if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getTimelineEventIcon(type: ChapterTimelineEvent['type']) {
  switch (type) {
    case 'stage_start':
      return <Zap className="h-3.5 w-3.5 text-blue-500" />;
    case 'stage_complete':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case 'section_complete':
      return <Layers className="h-3.5 w-3.5 text-indigo-500" />;
    case 'retry':
      return <RotateCcw className="h-3.5 w-3.5 text-amber-500" />;
    case 'error':
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    case 'fallback':
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
    case 'complete':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  }
}

// ============================================================================
// Stage Stepper Component
// ============================================================================

function StageStepper({ currentStage, stagesCompleted }: {
  currentStage: number;
  stagesCompleted: number[];
}) {
  const stages = [
    { num: 1, label: 'Structure' },
    { num: 2, label: 'Sections' },
    { num: 3, label: 'Details' },
  ];

  return (
    <div className="flex items-center gap-2">
      {stages.map((stage, index) => {
        const isCompleted = stagesCompleted.includes(stage.num);
        const isCurrent = currentStage === stage.num && !isCompleted;

        return (
          <React.Fragment key={stage.num}>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                isCompleted && "bg-emerald-500 text-white",
                isCurrent && "bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-600",
                !isCompleted && !isCurrent && "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
              )}>
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isCurrent ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  stage.num
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isCompleted && "text-emerald-700 dark:text-emerald-300",
                isCurrent && "text-blue-700 dark:text-blue-300",
                !isCompleted && !isCurrent && "text-slate-400 dark:text-slate-500",
              )}>
                {stage.label}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 min-w-[20px] rounded-full transition-all",
                isCompleted ? "bg-emerald-400 dark:bg-emerald-600" : "bg-slate-200 dark:bg-slate-700",
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Modal Component
// ============================================================================

export function ChapterDetailModal({
  chapter,
  open,
  onClose,
  onRetry,
  modelInfo,
}: ChapterDetailModalProps) {
  if (!chapter) return null;

  const sectionProgress = chapter.totalSections > 0
    ? Math.round((chapter.completedSections / chapter.totalSections) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon(chapter.status)}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-bold truncate">
                Ch. {chapter.position}: {chapter.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-[10px] font-semibold border-0", getStatusBadgeClass(chapter.status))}>
                  {getStatusLabel(chapter.status)}
                </Badge>
                {chapter.qualityScore != null && (
                  <Badge className={cn(
                    "text-[10px] font-bold border-0",
                    getQualityBgColor(chapter.qualityScore),
                    getQualityColor(chapter.qualityScore),
                  )}>
                    {chapter.qualityScore}% quality
                  </Badge>
                )}
                {chapter.retryCount > 0 && (
                  <Badge className="text-[10px] font-medium border-0 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    {chapter.retryCount} {chapter.retryCount === 1 ? 'retry' : 'retries'}
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <FileText className="h-3 w-3" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sections" className="text-xs gap-1">
              <Layers className="h-3 w-3" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs gap-1">
              <Activity className="h-3 w-3" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-auto mt-4 space-y-4">
            {/* Stage Progress */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Generation Stages</h4>
              <StageStepper
                currentStage={chapter.currentStage}
                stagesCompleted={chapter.stagesCompleted}
              />
            </div>

            {/* Section Progress */}
            {chapter.totalSections > 0 && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400">Section Progress</h4>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {chapter.completedSections}/{chapter.totalSections}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${sectionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quality Score */}
            {chapter.qualityScore != null && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Quality</h4>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "text-3xl font-bold",
                    getQualityColor(chapter.qualityScore),
                  )}>
                    {chapter.qualityScore}%
                  </div>
                  <div className="flex flex-col gap-1">
                    {chapter.bloomsLevel && (
                      <div className="flex items-center gap-1.5">
                        <Brain className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Bloom&apos;s: <span className="font-semibold">{chapter.bloomsLevel}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Key Topics */}
            {chapter.keyTopics && chapter.keyTopics.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Key Topics</h4>
                <div className="flex flex-wrap gap-1.5">
                  {chapter.keyTopics.map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Error Alert */}
            {chapter.status === 'failed' && chapter.error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-red-800 dark:text-red-200">Generation Failed</h4>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{chapter.error}</p>
                    {chapter.errorType && (
                      <Badge className="mt-1.5 text-[9px] bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-0">
                        {chapter.errorType}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback Alert */}
            {chapter.isFallback && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-200">Fallback Content</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      This chapter uses template-generated fallback content (quality: 30%). Consider editing it to improve quality.
                    </p>
                    {chapter.fallbackReason && (
                      <p className="text-[10px] text-amber-500 dark:text-amber-500 mt-1">
                        Reason: {chapter.fallbackReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Model Info */}
            {modelInfo && (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">AI Model</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{modelInfo.provider}</span>
                  <span className="text-xs text-slate-400">/</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{modelInfo.model}</span>
                  {modelInfo.isReasoningModel && (
                    <Badge className="text-[9px] border-0 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                      Reasoning
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[350px]">
              {chapter.totalSections === 0 && chapter.status !== 'complete' ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Layers className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Section data will appear once generation progresses to Stage 2.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {Array.from({ length: chapter.totalSections || 0 }, (_, i) => {
                    const secNum = i + 1;
                    const isCompleted = secNum <= chapter.completedSections;
                    // Extract section event data if available
                    const sectionEvent = chapter.events.find(
                      e => e.type === 'section_complete' && e.data?.section === secNum
                    );
                    const sectionTitle = sectionEvent?.data?.title as string | undefined;

                    return (
                      <div
                        key={secNum}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60",
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500",
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <span className="text-[9px] font-bold">{secNum}</span>
                          )}
                        </div>
                        <span className={cn(
                          "text-xs font-medium truncate",
                          isCompleted
                            ? "text-emerald-800 dark:text-emerald-200"
                            : "text-slate-500 dark:text-slate-400",
                        )}>
                          {sectionTitle ?? `Section ${secNum}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[350px]">
              {chapter.events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Events will appear once generation begins.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 pr-4">
                  {[...chapter.events].reverse().map((event, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 py-2 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getTimelineEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 dark:text-slate-300">{event.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatRelativeTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="mt-4">
          {chapter.status === 'failed' && onRetry && (
            <Button
              size="sm"
              onClick={() => onRetry(chapter.position)}
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry Chapter
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="h-8 text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
