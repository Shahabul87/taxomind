"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Sparkles,
  Star,
  Flame,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Check,
  ListChecks,
  Zap,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThemeMode } from './types';
import type { UserProgress } from '@/lib/sam/gamification';
import { HEADER_HEIGHT } from './types';
import { getModeById, getAllModes, MODE_CATEGORIES, getModeMaturity } from '@/lib/sam/modes';
import type { SAMModeId, EngineMaturityLevel } from '@/lib/sam/modes';
import { useModePreferences } from './hooks/use-mode-preferences';
import { ModeSearch } from './ModeSearch';

interface ChatHeaderProps {
  breadcrumbs: string[];
  pageName: string;
  // Window controls
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onClear: () => void;
  isMaximized: boolean;
  // Theme
  theme: ThemeMode;
  onToggleTheme: () => void;
  // Mode selector
  activeMode: SAMModeId;
  onModeChange: (modeId: SAMModeId) => void;
  // Gamification
  userProgress?: UserProgress | null;
  enableGamification?: boolean;
  // Confidence
  confidenceScore?: number;
  // Plan panel
  hasPlan?: boolean;
  showPlanPanel?: boolean;
  onTogglePlanPanel?: () => void;
  // Engine details
  showEngineDetails?: boolean;
  onToggleEngineDetails?: () => void;
  // Drag handlers
  dragHandlers?: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  className?: string;
}

export function ChatHeader({
  breadcrumbs,
  pageName,
  onMinimize,
  onMaximize,
  onClose,
  onClear,
  isMaximized,
  theme,
  onToggleTheme,
  activeMode,
  onModeChange,
  userProgress,
  enableGamification = true,
  confidenceScore,
  hasPlan,
  showPlanPanel,
  onTogglePlanPanel,
  showEngineDetails,
  onToggleEngineDetails,
  dragHandlers,
  className,
}: ChatHeaderProps) {
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [modeSearch, setModeSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showMoreCategories, setShowMoreCategories] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { recentModes, isFavorite, recordModeUsage, toggleFavorite } = useModePreferences();

  const activeModeDef = getModeById(activeMode);
  const activeModeLabel = activeModeDef?.label ?? 'General Assistant';

  // Close dropdown on outside click
  useEffect(() => {
    if (!modeDropdownOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setModeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [modeDropdownOpen]);

  const handleModeSelect = useCallback(
    (modeId: string) => {
      onModeChange(modeId as SAMModeId);
      recordModeUsage(modeId as SAMModeId);
      setModeDropdownOpen(false);
      setModeSearch('');
    },
    [onModeChange, recordModeUsage]
  );

  const toggleCategory = useCallback((catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  }, []);

  const toggleShowMore = useCallback((catId: string) => {
    setShowMoreCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  }, []);

  const toggleModeDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setModeDropdownOpen((prev) => !prev);
  }, []);

  const themeIcon =
    theme === 'dark' ? (
      <Moon className="h-3 w-3" />
    ) : theme === 'light' ? (
      <Sun className="h-3 w-3" />
    ) : (
      <Monitor className="h-3 w-3" />
    );

  const HIDDEN_MODES = new Set(['alignment-checker', 'scaffolding', 'zpd-evaluator']);
  // Essential modes shown by default — rest hidden behind "Show More" per category
  const ESSENTIAL_MODES = new Set([
    // Analysis & Taxonomy (1 of 3) — core platform feature
    'blooms-analyzer',
    // Learning & Coaching (3 of 7)
    'learning-coach', 'socratic-tutor', 'study-planner',
    // Assessment (2 of 4)
    'exam-builder', 'practice-problems',
    // Research & Resources (2 of 3)
    'research-assistant', 'resource-finder',
    // Course Design (1 of 3)
    'course-architect',
    // Insights & Analytics (2 of 4)
    'analytics', 'predictive',
  ]);
  const allModes = getAllModes().filter(
    (m) => m.category !== 'content' && !HIDDEN_MODES.has(m.id)
  );

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 shrink-0 select-none relative',
        'cursor-grab active:cursor-grabbing',
        className
      )}
      style={{
        height: `${HEADER_HEIGHT}px`,
        background: 'var(--sam-accent)',
        color: 'white',
      }}
      {...dragHandlers}
    >
      {/* Left: Logo + title */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold">SAM</span>
          {/* Confidence dot */}
          {confidenceScore != null && (
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                confidenceScore >= 0.7 && 'bg-green-400',
                confidenceScore >= 0.4 && confidenceScore < 0.7 && 'bg-yellow-400',
                confidenceScore < 0.4 && 'bg-red-400'
              )}
              title={`Confidence: ${Math.round(confidenceScore * 100)}%`}
            />
          )}
          {/* Level badge */}
          {enableGamification && userProgress && (
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 text-yellow-300" />
              Lv.{userProgress.level}
              {userProgress.streak > 0 && (
                <>
                  <Flame className="h-2.5 w-2.5 text-orange-300 ml-0.5" />
                  {userProgress.streak}
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Center: Mode selector */}
      <div className="flex-1 flex justify-center min-w-0">
        <button
          ref={triggerRef}
          onClick={toggleModeDropdown}
          className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full transition-colors max-w-[180px]"
        >
          <span className="truncate">{activeModeLabel}</span>
          <ChevronDown
            className={cn(
              'h-2.5 w-2.5 shrink-0 transition-transform duration-150',
              modeDropdownOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-0.5">
        {/* Plan toggle */}
        {hasPlan && onTogglePlanPanel && (
          <HeaderButton onClick={onTogglePlanPanel} title={showPlanPanel ? 'Hide plan' : 'Show plan'}>
            <ListChecks className={cn('h-3 w-3', showPlanPanel && 'text-yellow-300')} />
          </HeaderButton>
        )}

        {/* Engine details toggle */}
        {onToggleEngineDetails && (
          <HeaderButton
            onClick={onToggleEngineDetails}
            title={showEngineDetails ? 'Hide engine details' : 'Show engine details'}
          >
            <Cpu className={cn('h-3 w-3', showEngineDetails && 'text-yellow-300')} />
          </HeaderButton>
        )}

        {/* Theme toggle */}
        <HeaderButton onClick={onToggleTheme} title={`Theme: ${theme}`}>
          {themeIcon}
        </HeaderButton>

        {/* Clear */}
        <HeaderButton onClick={onClear} title="Clear conversation">
          <RefreshCw className="h-3 w-3" />
        </HeaderButton>

        {/* Maximize */}
        <HeaderButton onClick={onMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
          {isMaximized ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </HeaderButton>

        {/* Close */}
        <HeaderButton onClick={onClose} title="Close">
          <X className="h-3.5 w-3.5" />
        </HeaderButton>
      </div>

      {/* Mode Dropdown — Enhanced with search, recents, favorites, collapsible categories */}
      {modeDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 z-50 sam-animate-in"
          style={{ top: `${HEADER_HEIGHT}px` }}
        >
          <div
            className="mx-1 rounded-b-xl overflow-hidden shadow-lg"
            style={{
              background: 'var(--sam-surface-solid)',
              border: '1px solid var(--sam-border)',
              borderTop: 'none',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {/* Smart Auto button */}
            <div className="px-1.5 pt-1.5">
              <button
                onClick={() => handleModeSelect('general-assistant')}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px]',
                  'transition-colors duration-100',
                  activeMode === 'general-assistant'
                    ? 'font-medium'
                    : 'hover:bg-[var(--sam-accent)]/10',
                )}
                style={{
                  color: activeMode === 'general-assistant' ? 'var(--sam-accent)' : 'var(--sam-text)',
                  background: activeMode === 'general-assistant' ? 'rgba(124, 58, 237, 0.08)' : undefined,
                }}
              >
                <Zap className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left">Smart Auto</span>
                {activeMode === 'general-assistant' && (
                  <Check className="h-3 w-3 shrink-0" style={{ color: 'var(--sam-accent)' }} />
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="mx-2 my-1 h-px" style={{ background: 'var(--sam-border)' }} />

            {/* Recent modes */}
            {recentModes.length > 0 && !modeSearch && (
              <>
                <div className="px-1.5">
                  <div
                    className="text-[9px] uppercase tracking-wider px-2 py-0.5"
                    style={{ color: 'var(--sam-text-muted)' }}
                  >
                    Recent
                  </div>
                  {recentModes.slice(0, 3).map((modeId) => {
                    const mode = getModeById(modeId);
                    if (!mode || modeId === 'general-assistant') return null;
                    return (
                      <ModeItem
                        key={`recent-${mode.id}`}
                        modeId={mode.id}
                        label={mode.label}
                        isActive={mode.id === activeMode}
                        maturity={getModeMaturity(mode.enginePreset)}
                        isFavorite={isFavorite(mode.id as SAMModeId)}
                        onToggleFavorite={() => toggleFavorite(mode.id as SAMModeId)}
                        onClick={() => handleModeSelect(mode.id)}
                      />
                    );
                  })}
                </div>
                <div className="mx-2 my-1 h-px" style={{ background: 'var(--sam-border)' }} />
              </>
            )}

            {/* Favorite modes */}
            {!modeSearch && (() => {
              const favModes = allModes.filter((m) => isFavorite(m.id as SAMModeId) && m.id !== 'general-assistant');
              if (favModes.length === 0) return null;
              return (
                <>
                  <div className="px-1.5">
                    <div
                      className="text-[9px] uppercase tracking-wider px-2 py-0.5"
                      style={{ color: 'var(--sam-text-muted)' }}
                    >
                      Favorites
                    </div>
                    {favModes.map((mode) => (
                      <ModeItem
                        key={`fav-${mode.id}`}
                        modeId={mode.id}
                        label={mode.label}
                        isActive={mode.id === activeMode}
                        maturity={getModeMaturity(mode.enginePreset)}
                        isFavorite
                        onToggleFavorite={() => toggleFavorite(mode.id as SAMModeId)}
                        onClick={() => handleModeSelect(mode.id)}
                      />
                    ))}
                  </div>
                  <div className="mx-2 my-1 h-px" style={{ background: 'var(--sam-border)' }} />
                </>
              );
            })()}

            {/* Search */}
            <ModeSearch query={modeSearch} onQueryChange={setModeSearch} />

            {/* Filtered flat list when searching */}
            {modeSearch ? (
              <div className="px-1.5 pb-1.5">
                {allModes
                  .filter((m) =>
                    m.label.toLowerCase().includes(modeSearch.toLowerCase()) ||
                    m.id.toLowerCase().includes(modeSearch.toLowerCase())
                  )
                  .map((mode) => (
                    <ModeItem
                      key={mode.id}
                      modeId={mode.id}
                      label={mode.label}
                      isActive={mode.id === activeMode}
                      maturity={getModeMaturity(mode.enginePreset)}
                      isFavorite={isFavorite(mode.id as SAMModeId)}
                      onToggleFavorite={() => toggleFavorite(mode.id as SAMModeId)}
                      onClick={() => handleModeSelect(mode.id)}
                    />
                  ))}
              </div>
            ) : (
              /* Collapsible categories */
              <div className="px-1.5 pb-1.5">
                {MODE_CATEGORIES.map((cat) => {
                  const catModes = allModes.filter((m) => m.category === cat.id && m.id !== 'general-assistant');
                  if (catModes.length === 0) return null;
                  const isExpanded = expandedCategories.has(cat.id);
                  const essentialModes = catModes.filter((m) => ESSENTIAL_MODES.has(m.id));
                  const advancedModes = catModes.filter((m) => !ESSENTIAL_MODES.has(m.id));
                  const showingMore = showMoreCategories.has(cat.id);
                  const visibleModes = showingMore ? catModes : essentialModes;
                  const displayCount = showingMore ? catModes.length : essentialModes.length;
                  return (
                    <div key={cat.id} className="mb-0.5 last:mb-0">
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="w-full flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[var(--sam-accent)]/5 transition-colors"
                      >
                        <ChevronRight
                          className={cn(
                            'h-2.5 w-2.5 shrink-0 transition-transform duration-150',
                            isExpanded && 'rotate-90',
                          )}
                          style={{ color: 'var(--sam-text-muted)' }}
                        />
                        <span
                          className="text-[9px] uppercase tracking-wider"
                          style={{ color: 'var(--sam-text-muted)' }}
                        >
                          {cat.label}
                        </span>
                        <span
                          className="text-[9px] ml-auto"
                          style={{ color: 'var(--sam-text-muted)' }}
                        >
                          {displayCount}
                        </span>
                      </button>
                      {isExpanded && (() => {
                        return (
                          <>
                            {visibleModes.map((mode) => (
                              <ModeItem
                                key={mode.id}
                                modeId={mode.id}
                                label={mode.label}
                                isActive={mode.id === activeMode}
                                maturity={getModeMaturity(mode.enginePreset)}
                                isFavorite={isFavorite(mode.id as SAMModeId)}
                                onToggleFavorite={() => toggleFavorite(mode.id as SAMModeId)}
                                onClick={() => handleModeSelect(mode.id)}
                              />
                            ))}
                            {/* "Show more" toggle hidden for now — re-enable later */}
                          </>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ModeDifferentiation = 'deep' | 'configured' | 'prompt-only';

function getModeDifferentiation(modeId: string): ModeDifferentiation {
  const mode = getModeById(modeId);
  if (!mode) return 'prompt-only';
  const hasSpecializedEngines = mode.enginePreset.some(
    (e: string) => !['context', 'response'].includes(e),
  );
  if (hasSpecializedEngines && mode.engineConfig) return 'deep';
  if (mode.engineConfig) return 'configured';
  return 'prompt-only';
}

function ModeItem({
  label,
  modeId,
  isActive,
  maturity,
  isFavorite: isFav,
  onToggleFavorite,
  onClick,
}: {
  label: string;
  modeId: string;
  isActive: boolean;
  maturity?: EngineMaturityLevel;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClick: () => void;
}) {
  const differentiation = getModeDifferentiation(modeId);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-left group',
        'transition-colors duration-100',
        isActive
          ? 'font-medium'
          : 'hover:bg-[var(--sam-accent)]/10'
      )}
      style={{
        color: isActive ? 'var(--sam-accent)' : 'var(--sam-text)',
        background: isActive ? 'rgba(124, 58, 237, 0.08)' : undefined,
      }}
    >
      <span className="flex items-center gap-1 truncate">
        {label}
        {/* Mode differentiation indicator */}
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full shrink-0',
            differentiation === 'deep' && 'bg-green-400',
            differentiation === 'configured' && 'bg-blue-400',
            differentiation === 'prompt-only' && 'bg-gray-300',
          )}
          title={
            differentiation === 'deep'
              ? 'Deep integration (unique engine pipeline)'
              : differentiation === 'configured'
                ? 'Configured (engine config + prompt)'
                : 'Prompt-only mode'
          }
        />
        {maturity && maturity !== 'production' && (
          <span
            className={cn(
              'text-[8px] px-1 py-px rounded-sm shrink-0 leading-none font-medium',
              maturity === 'beta' && 'bg-amber-400/20 text-amber-600 dark:text-amber-400',
              maturity === 'experimental' && 'bg-gray-400/20 text-gray-500 dark:text-gray-400',
              maturity === 'scaffold' && 'bg-gray-300/20 text-gray-400 dark:text-gray-500',
            )}
            title={
              maturity === 'beta'
                ? 'This mode uses engines still in beta testing'
                : maturity === 'experimental'
                  ? 'This mode uses experimental engines that may change'
                  : 'This mode uses early-stage placeholder engines'
            }
          >
            {maturity === 'beta' ? 'Beta' : maturity === 'experimental' ? 'Exp' : 'Early'}
          </span>
        )}
      </span>
      <span className="flex items-center gap-0.5 shrink-0 ml-1">
        {onToggleFavorite && (
          <span
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={cn(
              'h-4 w-4 flex items-center justify-center rounded',
              isFav
                ? 'text-yellow-500'
                : 'text-transparent group-hover:text-[var(--sam-text-muted)] hover:text-yellow-500',
              'transition-colors cursor-pointer',
            )}
            title={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className="h-2.5 w-2.5" fill={isFav ? 'currentColor' : 'none'} />
          </span>
        )}
        {isActive && <Check className="h-3 w-3 shrink-0" style={{ color: 'var(--sam-accent)' }} />}
      </span>
    </button>
  );
}

function HeaderButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'h-6 w-6 rounded-md flex items-center justify-center',
        'text-white/80 hover:text-white hover:bg-white/20',
        'transition-all duration-150 active:scale-90'
      )}
    >
      {children}
    </button>
  );
}
