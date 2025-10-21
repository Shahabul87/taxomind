"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, ChevronUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SAMBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

type SheetState = 'collapsed' | 'half' | 'full';

export function SAMBottomSheet({
  isOpen,
  onClose,
  children,
  title = 'SAM AI Assistant',
  subtitle = 'Your course creation companion',
  className
}: SAMBottomSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>('collapsed');
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Sheet height configurations (in vh)
  const heights = {
    collapsed: 15,  // 15vh - Just peek
    half: 50,       // 50vh - Half screen
    full: 90        // 90vh - Almost full
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (!isDragging) return;

    const deltaY = startY - currentY;
    const threshold = 50; // pixels

    if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        // Swiped up
        if (sheetState === 'collapsed') setSheetState('half');
        else if (sheetState === 'half') setSheetState('full');
      } else {
        // Swiped down
        if (sheetState === 'full') setSheetState('half');
        else if (sheetState === 'half') setSheetState('collapsed');
        else onClose(); // Close if already collapsed
      }
    }

    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  // Get current height based on state
  const getCurrentHeight = () => {
    if (!isOpen) return 0;

    let baseHeight = heights[sheetState];

    // Adjust height while dragging
    if (isDragging && startY > 0) {
      const dragDelta = (startY - currentY) / window.innerHeight * 100;
      baseHeight = Math.max(0, Math.min(95, baseHeight + dragDelta));
    }

    return baseHeight;
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && sheetState !== 'collapsed') {
      setSheetState('collapsed');
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (sheetState === 'full') setSheetState('half');
        else if (sheetState === 'half') setSheetState('collapsed');
        else onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, sheetState, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden',
          'transition-opacity duration-300',
          sheetState === 'collapsed' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 lg:hidden',
          'bg-white dark:bg-slate-900',
          'border-t-2 border-slate-200 dark:border-slate-800',
          'rounded-t-2xl shadow-2xl',
          'transition-all duration-300 ease-out',
          className
        )}
        style={{
          height: `${getCurrentHeight()}vh`,
          touchAction: 'none'
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag Handle */}
        <div
          className="absolute top-0 left-0 right-0 h-8 cursor-grab active:cursor-grabbing flex items-center justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Drag to resize panel"
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-white animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Expand/Collapse Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (sheetState === 'full') setSheetState('half');
                else setSheetState('full');
              }}
              className="h-8 w-8 p-0 rounded-lg"
              aria-label={sheetState === 'full' ? 'Minimize panel' : 'Maximize panel'}
            >
              <ChevronUp
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  sheetState === 'full' && 'rotate-180'
                )}
              />
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label="Close SAM assistant"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-5rem)] overflow-y-auto p-4 overscroll-contain">
          {children}
        </div>

        {/* Quick State Indicators (collapsed view only) */}
        {sheetState === 'collapsed' && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Bot className="h-4 w-4" />
              <span>Swipe up for SAM assistance</span>
              <ChevronUp className="h-4 w-4 animate-bounce" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Trigger button for opening the bottom sheet
export function SAMBottomSheetTrigger({
  onClick,
  hasNotification = false,
  className
}: {
  onClick: () => void;
  hasNotification?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 right-4 z-30 lg:hidden',
        'w-14 h-14 rounded-full',
        'bg-gradient-to-br from-indigo-600 to-purple-600',
        'shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        className
      )}
      aria-label="Open SAM AI Assistant"
    >
      <Bot className="h-6 w-6 text-white" />

      {hasNotification && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-pulse">
          <Sparkles className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}
