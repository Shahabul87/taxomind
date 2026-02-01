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
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThemeMode } from './types';
import type { UserProgress } from '@/lib/sam/gamification';
import { HEADER_HEIGHT } from './types';
import { getModeById, getAllModes, MODE_CATEGORIES } from '@/lib/sam/modes';
import type { SAMModeId } from '@/lib/sam/modes';

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
  dragHandlers,
  className,
}: ChatHeaderProps) {
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
      setModeDropdownOpen(false);
    },
    [onModeChange]
  );

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

  const allModes = getAllModes();
  const leftCategories = MODE_CATEGORIES.filter((c) => c.column === 'left');
  const rightCategories = MODE_CATEGORIES.filter((c) => c.column === 'right');

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
      {/* Left: Logo + title + mode selector */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
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
          {/* Mode selector trigger (replaces breadcrumbs) */}
          <button
            ref={triggerRef}
            onClick={toggleModeDropdown}
            className="flex items-center gap-0.5 text-[10px] text-white/60 hover:text-white/90 transition-colors leading-none mt-0.5 max-w-[160px]"
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
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-0.5">
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

      {/* Mode Dropdown */}
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
              maxHeight: '360px',
              overflowY: 'auto',
            }}
          >
            <div className="grid grid-cols-2 gap-0 p-1.5">
              {/* Left column */}
              <div className="pr-1 border-r" style={{ borderColor: 'var(--sam-border)' }}>
                {leftCategories.map((cat) => {
                  const catModes = allModes.filter((m) => m.category === cat.id);
                  if (catModes.length === 0) return null;
                  return (
                    <div key={cat.id} className="mb-1.5 last:mb-0">
                      <div
                        className="text-[9px] uppercase tracking-wider px-2 py-0.5"
                        style={{ color: 'var(--sam-text-muted)' }}
                      >
                        {cat.label}
                      </div>
                      {catModes.map((mode) => (
                        <ModeItem
                          key={mode.id}
                          label={mode.label}
                          isActive={mode.id === activeMode}
                          onClick={() => handleModeSelect(mode.id)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
              {/* Right column */}
              <div className="pl-1">
                {rightCategories.map((cat) => {
                  const catModes = allModes.filter((m) => m.category === cat.id);
                  if (catModes.length === 0) return null;
                  return (
                    <div key={cat.id} className="mb-1.5 last:mb-0">
                      <div
                        className="text-[9px] uppercase tracking-wider px-2 py-0.5"
                        style={{ color: 'var(--sam-text-muted)' }}
                      >
                        {cat.label}
                      </div>
                      {catModes.map((mode) => (
                        <ModeItem
                          key={mode.id}
                          label={mode.label}
                          isActive={mode.id === activeMode}
                          onClick={() => handleModeSelect(mode.id)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeItem({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] text-left',
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
      <span className="truncate">{label}</span>
      {isActive && <Check className="h-3 w-3 shrink-0 ml-1" style={{ color: 'var(--sam-accent)' }} />}
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
