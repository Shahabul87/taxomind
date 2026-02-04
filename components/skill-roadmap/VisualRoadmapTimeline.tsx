'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play,
  CheckCircle2,
  SkipForward,
  Target,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseCard } from './PhaseCard';
import type { RoadmapMilestone, MatchedCourse } from '@/hooks/use-skill-roadmap-journey';

interface VisualRoadmapTimelineProps {
  milestones: RoadmapMilestone[];
  matchedCourses: Record<string, MatchedCourse>;
  currentLevel: string;
  targetLevel: string;
  onStartMilestone: (milestoneId: string) => void;
  onCompleteMilestone: (milestoneId: string) => void;
  onSkipMilestone: (milestoneId: string) => void;
}

/** Internal DB type names that must never appear in the UI. */
const INTERNAL_NAMES = ['SKILL_SET', 'SKILL_DEFINITION', 'UNTITLED', 'UNDEFINED', 'NULL'];

function formatLevel(level: string | undefined | null): string {
  if (!level) return '';
  if (INTERNAL_NAMES.some(n => level.toUpperCase().includes(n))) return '';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

// Node color config by status
const NODE_STYLES: Record<string, { bg: string; ring: string; text: string }> = {
  COMPLETED: {
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-500/25',
    text: 'text-white',
  },
  IN_PROGRESS: {
    bg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    ring: 'ring-violet-500/25',
    text: 'text-white',
  },
  AVAILABLE: {
    bg: 'bg-blue-500',
    ring: 'ring-blue-500/25',
    text: 'text-white',
  },
  LOCKED: {
    bg: 'bg-slate-200 dark:bg-slate-700',
    ring: '',
    text: 'text-slate-500 dark:text-slate-400',
  },
  SKIPPED: {
    bg: 'bg-slate-200 dark:bg-slate-700',
    ring: '',
    text: 'text-slate-500 dark:text-slate-400',
  },
};

export function VisualRoadmapTimeline({
  milestones,
  matchedCourses,
  currentLevel,
  targetLevel,
  onStartMilestone,
  onCompleteMilestone,
  onSkipMilestone,
}: VisualRoadmapTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(() => {
    const current = milestones.find(m => m.status === 'IN_PROGRESS' || m.status === 'AVAILABLE');
    return current?.id ?? null;
  });

  const handleToggle = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  if (milestones.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-slate-400 text-lg">&#x1F5FA;&#xFE0F;</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No learning phases found for this roadmap.
        </p>
        <p className="text-xs text-slate-400">
          Create a new roadmap to get AI-generated learning phases.
        </p>
      </div>
    );
  }

  // Find where progress line should end (after last completed milestone)
  const lastCompletedIdx = milestones.reduce(
    (acc, m, i) => (m.status === 'COMPLETED' ? i : acc),
    -1,
  );

  return (
    <div className="w-full">
      {/* ── Start marker ── */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/25">
          <span className="text-white text-xs font-bold">S</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">You Are Here</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatLevel(currentLevel) || 'Starting Point'}
          </p>
        </div>
      </div>

      {/* ── Timeline rows ── */}
      <div className="relative">
        {milestones.map((m, idx) => {
          const nodeStyle = NODE_STYLES[m.status] ?? NODE_STYLES.LOCKED;
          const isActive = m.status === 'IN_PROGRESS' || m.status === 'AVAILABLE';
          const isLast = idx === milestones.length - 1;

          // Determine whether this segment of the line should be "completed" (colored)
          const lineCompleted = idx <= lastCompletedIdx;

          return (
            <div key={m.id} className="relative flex gap-3 sm:gap-4">
              {/* ── Left column: line + node ── */}
              <div className="flex flex-col items-center w-10 flex-shrink-0">
                {/* Top connector line */}
                <div
                  className={cn(
                    'w-0.5 h-4',
                    lineCompleted || idx === 0
                      ? 'bg-gradient-to-b from-blue-400 to-violet-400'
                      : 'bg-slate-200 dark:bg-slate-700',
                  )}
                />

                {/* Node circle */}
                <div className="relative flex-shrink-0">
                  {isActive && (
                    <div className={cn(
                      'absolute -inset-1.5 rounded-full animate-ping opacity-20',
                      m.status === 'IN_PROGRESS' ? 'bg-violet-500' : 'bg-blue-500',
                    )} />
                  )}
                  <div
                    className={cn(
                      'relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10',
                      nodeStyle.bg,
                      nodeStyle.text,
                      isActive && `ring-4 ${nodeStyle.ring}`,
                    )}
                  >
                    {m.status === 'COMPLETED' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : m.status === 'LOCKED' ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      m.order
                    )}
                  </div>
                </div>

                {/* Bottom connector line (skip for last item) */}
                {!isLast && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 min-h-[16px]',
                      lineCompleted
                        ? 'bg-gradient-to-b from-violet-400 to-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700',
                    )}
                  />
                )}
                {isLast && <div className="w-0.5 flex-1 min-h-[16px] bg-slate-200 dark:bg-slate-700" />}
              </div>

              {/* ── Right column: card + actions ── */}
              <div className="flex-1 min-w-0 pb-4">
                <PhaseCard
                  milestone={m}
                  isExpanded={expandedId === m.id}
                  onToggle={() => handleToggle(m.id)}
                  matchedCourses={matchedCourses}
                />

                {/* Action buttons for expandable milestones */}
                {expandedId === m.id && m.status !== 'LOCKED' && m.status !== 'COMPLETED' && (
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    {m.status === 'AVAILABLE' && (
                      <Button
                        size="sm"
                        onClick={() => onStartMilestone(m.id)}
                        className={cn(
                          'h-8 text-xs rounded-lg',
                          'bg-gradient-to-r from-violet-600 to-purple-600',
                          'hover:from-violet-700 hover:to-purple-700',
                        )}
                      >
                        <Play className="h-3 w-3 mr-1.5" />
                        Start This Phase
                      </Button>
                    )}
                    {m.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        onClick={() => onCompleteMilestone(m.id)}
                        className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1.5" />
                        Mark Complete
                      </Button>
                    )}
                    {(m.status === 'AVAILABLE' || m.status === 'IN_PROGRESS') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSkipMilestone(m.id)}
                        className="h-8 text-xs rounded-lg text-slate-500"
                      >
                        <SkipForward className="h-3 w-3 mr-1.5" />
                        Skip
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Destination marker ── */}
      <div className="flex items-center gap-3 mt-2">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/25">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Destination</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatLevel(targetLevel) || 'Goal'}
          </p>
        </div>
      </div>
    </div>
  );
}
