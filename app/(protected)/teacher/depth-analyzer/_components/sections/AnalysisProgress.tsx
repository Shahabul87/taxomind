'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  BookOpen,
  Brain,
  GitBranch,
  Wrench,
  CheckCircle2,
  Sparkles,
  Clock,
  ChevronDown,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisProgressState } from '../types';

const AI_STAGES = [
  { id: 'overview', label: 'Course Overview', icon: BookOpen, description: 'Analyzing overall structure' },
  { id: 'chapters', label: 'Chapter Analysis', icon: Brain, description: 'Deep dive into each chapter' },
  { id: 'cross-chapter', label: 'Cross-Chapter Flow', icon: GitBranch, description: 'Checking consistency' },
  { id: 'finalizing', label: 'Generating Report', icon: Wrench, description: 'Creating fix instructions' },
] as const;

interface AnalysisProgressProps {
  progressState: AnalysisProgressState;
}

export function AnalysisProgressDisplay({ progressState }: AnalysisProgressProps) {
  const [showThinking, setShowThinking] = useState(false);

  if (!progressState.isAnalyzing) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 border-violet-200/50 dark:border-violet-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl blur-lg opacity-40" />
            <div className="relative p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                AI-Powered Analysis
              </h2>
              <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <Zap className="h-3 w-3 mr-1" />
                {progressState.analysisMode === 'chapter-wise' ? 'Chapter-wise' : 'Full Course'}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {progressState.currentItem || 'Preparing AI analysis...'}
            </p>
          </div>
        </div>
        {progressState.estimatedTime && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Clock className="h-4 w-4" />
            <span>{progressState.estimatedTime}</span>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-slate-400">Overall Progress</span>
          <span className="font-medium text-violet-600 dark:text-violet-400">
            {progressState.percentComplete}%
          </span>
        </div>
        <Progress value={progressState.percentComplete} className="h-2.5" />
      </div>

      {/* 4-Stage Pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {AI_STAGES.map((stage, index) => {
          const stageOrder = AI_STAGES.findIndex((s) => s.id === progressState.currentStage);
          const currentStageIndex = AI_STAGES.findIndex((s) => s.id === stage.id);
          const isComplete =
            progressState.currentStage === 'complete' ||
            (stageOrder >= 0 && currentStageIndex < stageOrder);
          const isCurrent = progressState.currentStage === stage.id;
          const hasWarning = progressState.stageWarnings.some((w) => w.stage === stage.id);
          const Icon = stage.icon;

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative p-3 rounded-xl border-2 transition-all duration-300',
                isComplete && !hasWarning && 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700',
                isComplete && hasWarning && 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700',
                isCurrent && 'bg-violet-50 dark:bg-violet-900/30 border-violet-400 dark:border-violet-600 shadow-lg shadow-violet-200/50 dark:shadow-violet-900/30',
                !isComplete && !isCurrent && 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60'
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    isComplete && !hasWarning && 'bg-emerald-100 dark:bg-emerald-900/50',
                    isComplete && hasWarning && 'bg-orange-100 dark:bg-orange-900/50',
                    isCurrent && 'bg-violet-100 dark:bg-violet-900/50',
                    !isComplete && !isCurrent && 'bg-slate-100 dark:bg-slate-800'
                  )}
                >
                  {isComplete && hasWarning ? (
                    <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                  ) : isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </motion.div>
                  ) : (
                    <Icon className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      'text-xs font-semibold block',
                      isComplete && !hasWarning && 'text-emerald-700 dark:text-emerald-400',
                      isComplete && hasWarning && 'text-orange-700 dark:text-orange-400',
                      isCurrent && 'text-violet-700 dark:text-violet-400',
                      !isComplete && !isCurrent && 'text-slate-500'
                    )}
                  >
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                    {stage.description}
                  </span>
                </div>
              </div>

              {/* Chapter progress */}
              {isCurrent && stage.id === 'chapters' && progressState.currentChapter !== undefined && (
                <div className="mt-2 text-xs text-violet-600 dark:text-violet-400">
                  Chapter {(progressState.currentChapter || 0) + 1} of {progressState.totalChapters || '?'}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Issues Found Counter */}
      <AnimatePresence>
        {progressState.issueCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                <strong>{progressState.issueCount}</strong> issue{progressState.issueCount !== 1 ? 's' : ''} found so far
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage Warnings */}
      <AnimatePresence>
        {progressState.stageWarnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-2"
          >
            {progressState.stageWarnings.map((warning, idx) => (
              <div
                key={`${warning.stage}-${idx}`}
                className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
              >
                <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  <strong className="capitalize">{warning.stage}</strong> stage used fallback analysis
                  <span className="block text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                    Results may be less detailed — continuing with remaining stages
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Thinking (Collapsible) */}
      {progressState.thinking && (
        <Collapsible open={showThinking} onOpenChange={setShowThinking}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            <Brain className="h-4 w-4" />
            <span>AI Reasoning</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                showThinking && 'rotate-180'
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 italic">
              &quot;{progressState.thinking}&quot;
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Animated dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
            }}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
          />
        ))}
      </div>
    </Card>
  );
}
