'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Map, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoadmapSummary } from '@/hooks/use-skill-roadmap-journey';

interface RoadmapSwitcherProps {
  roadmaps: RoadmapSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreateNew?: () => void;
}

/** Internal database type names that should never be shown to the user. */
const INTERNAL_NAMES = ['SKILL_SET', 'SKILL_DEFINITION', 'UNTITLED', 'UNDEFINED', 'NULL'];

/** Generate a clean display name for a roadmap, never showing raw DB values. */
function getDisplayName(r: RoadmapSummary, index: number): string {
  // Check skillName first
  if (r.skillName && !INTERNAL_NAMES.some(n => r.skillName.toUpperCase().includes(n))
      && r.skillName !== 'Untitled Roadmap') {
    return r.skillName;
  }
  // Check title
  if (r.title && !INTERNAL_NAMES.some(n => r.title.toUpperCase().includes(n))
      && r.title !== 'Untitled Roadmap') {
    return r.title;
  }
  return `Learning Path ${index + 1}`;
}

function formatLevel(level: string | undefined | null): string {
  if (!level) return '';
  if (INTERNAL_NAMES.some(n => level.toUpperCase().includes(n))) return '';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

export function RoadmapSwitcher({ roadmaps, activeId, onSelect, onCreateNew }: RoadmapSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (roadmaps.length === 0) return null;

  const activeRoadmap = roadmaps.find(r => r.id === activeId);
  const activeIndex = roadmaps.findIndex(r => r.id === activeId);
  const activeName = activeRoadmap ? getDisplayName(activeRoadmap, activeIndex) : 'Select Roadmap';
  const activePct = Math.round(activeRoadmap?.completionPercentage ?? 0);
  const activeLevel = activeRoadmap ? formatLevel(activeRoadmap.currentLevel) : '';
  const activeTarget = activeRoadmap ? formatLevel(activeRoadmap.targetLevel) : '';

  // Single roadmap — show compact badge, no dropdown
  if (roadmaps.length === 1) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border border-violet-200/60 dark:border-violet-800/60">
          <Map className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{activeName}</span>
          {activeLevel && activeTarget && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {activeLevel} &rarr; {activeTarget}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Multiple roadmaps — dropdown selector
  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all duration-200',
          'hover:shadow-md',
          isOpen
            ? 'border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-950/40 shadow-md'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-violet-300 dark:hover:border-violet-700',
        )}
      >
        <div className="relative w-8 h-8 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
              className="text-slate-100 dark:text-slate-800" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="url(#switcherGrad)" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 15}`}
              strokeDashoffset={`${2 * Math.PI * 15 * (1 - activePct / 100)}`}
              className="transition-all duration-500" />
            <defs>
              <linearGradient id="switcherGrad" x1="0%" y1="0%" x2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-300">
            {activePct}%
          </span>
        </div>
        <div className="text-left min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
            {activeName}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {activeRoadmap?.completedMilestones ?? 0}/{activeRoadmap?.milestoneCount ?? 0} phases
            {activeLevel && activeTarget ? ` \u00B7 ${activeLevel} \u2192 ${activeTarget}` : ''}
          </p>
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-slate-400 transition-transform duration-200 flex-shrink-0',
          isOpen && 'rotate-180',
        )} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/30 overflow-hidden">
          <div className="p-2 max-h-72 overflow-y-auto">
            {roadmaps.map((r, i) => {
              const name = getDisplayName(r, i);
              const pct = Math.round(r.completionPercentage);
              const isActive = r.id === activeId;
              const level = formatLevel(r.currentLevel);
              const target = formatLevel(r.targetLevel);

              return (
                <button
                  key={r.id}
                  onClick={() => { onSelect(r.id); setIsOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                    isActive
                      ? 'bg-violet-50 dark:bg-violet-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                  )}
                >
                  {/* Mini progress ring */}
                  <div className="relative w-9 h-9 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
                        className="text-slate-100 dark:text-slate-800" />
                      <circle cx="18" cy="18" r="14" fill="none"
                        stroke={isActive ? '#8b5cf6' : '#94a3b8'} strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 14}`}
                        strokeDashoffset={`${2 * Math.PI * 14 * (1 - pct / 100)}`} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-400">
                      {pct}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isActive ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300',
                    )}>
                      {name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {r.completedMilestones}/{r.milestoneCount} phases
                      {level && target ? ` \u00B7 ${level} \u2192 ${target}` : ''}
                    </p>
                  </div>

                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Create New Roadmap option */}
          {onCreateNew && (
            <div className="border-t border-slate-100 dark:border-slate-800 p-2">
              <button
                onClick={() => { onCreateNew(); setIsOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-violet-50 dark:hover:bg-violet-950/30"
              >
                <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  Create New Roadmap
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
