'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2, SkipForward, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhaseCard } from './PhaseCard';
import { PhaseNode } from './PhaseNode';
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
    // Auto-expand current milestone
    const current = milestones.find(m => m.status === 'IN_PROGRESS' || m.status === 'AVAILABLE');
    return current?.id ?? null;
  });

  const handleToggle = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  // SVG path dimensions
  const nodeSpacing = 120;
  const svgHeight = (milestones.length + 1) * nodeSpacing + 80;
  const svgWidth = 60;
  const centerX = 30;
  const startY = 40;

  // Empty state when no milestones exist
  if (milestones.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-slate-400 text-lg">🗺️</span>
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

  return (
    <div className="relative">
      {/* Start marker */}
      <div className="flex items-center gap-3 mb-4 pl-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/25">
          <span className="text-white text-xs font-bold">S</span>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">You Are Here</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatLevel(currentLevel) || 'Starting Point'}
          </p>
        </div>
      </div>

      {/* Timeline with SVG path + cards */}
      <div className="relative ml-[15px]">
        {/* SVG vertical path */}
        <svg
          className="absolute left-0 top-0 w-[30px]"
          style={{ height: `${milestones.length * 200 + 40}px` }}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Background path */}
          <line
            x1={centerX} y1={startY}
            x2={centerX} y2={svgHeight - 40}
            stroke="currentColor"
            strokeWidth="3"
            className="text-slate-200 dark:text-slate-700"
          />

          {/* Progress path */}
          {(() => {
            const lastCompletedIdx = milestones
              .map((m, i) => m.status === 'COMPLETED' ? i : -1)
              .filter(i => i >= 0)
              .pop() ?? -1;
            const progressY = startY + (lastCompletedIdx + 1) * nodeSpacing;
            return (
              <line
                x1={centerX} y1={startY}
                x2={centerX} y2={progressY + nodeSpacing / 2}
                stroke="url(#pathGrad)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })()}

          {/* Milestone nodes on the path */}
          {milestones.map((m, idx) => {
            const y = startY + idx * nodeSpacing;
            return (
              <PhaseNode
                key={m.id}
                order={m.order}
                status={m.status as 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'}
                cx={centerX}
                cy={y}
              />
            );
          })}
        </svg>

        {/* Phase cards positioned alongside the SVG */}
        <div className="ml-10 space-y-4">
          {milestones.map((m) => (
            <div key={m.id}>
              <PhaseCard
                milestone={m}
                isExpanded={expandedId === m.id}
                onToggle={() => handleToggle(m.id)}
                matchedCourses={matchedCourses}
              />

              {/* Action buttons for expandable milestones */}
              {expandedId === m.id && m.status !== 'LOCKED' && m.status !== 'COMPLETED' && (
                <div className="flex items-center gap-2 mt-2 ml-4">
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
          ))}
        </div>
      </div>

      {/* End marker */}
      <div className="flex items-center gap-3 mt-6 pl-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/25">
          <Target className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Destination</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {formatLevel(targetLevel) || 'Goal'}
          </p>
        </div>
      </div>
    </div>
  );
}
