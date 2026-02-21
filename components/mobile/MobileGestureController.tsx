'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EdgeSwipeHandler } from './EdgeSwipeHandler';
import { SmartBottomBar } from './SmartBottomBar';
import { useViewportHeight } from '@/hooks/useViewportHeight';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';

interface MobileGestureControllerProps {
  children: React.ReactNode;
  onSidebarOpen: () => void;
  onQuickAction?: (action: string) => void;
  enableEdgeSwipe?: boolean;
  enableBottomBar?: boolean;
  enablePullToRefresh?: boolean;
}

export function MobileGestureController({
  children,
  onSidebarOpen,
  onQuickAction,
  enableEdgeSwipe = true,
  enableBottomBar = true,
  enablePullToRefresh = false,
}: MobileGestureControllerProps) {
  const { isMobile, height: viewportHeight } = useViewportHeight();
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [isBottomBarVisible, setIsBottomBarVisible] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const touchStartY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout>();

  // Prevent hydration mismatch by only rendering mobile features after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-hide bottom bar on scroll — debounced to avoid per-frame re-renders.
  // Only depends on scrollDirection and isAtTop (both change infrequently),
  // NOT on scrollY which changed every frame and caused the cascade.
  useEffect(() => {
    if (!isMobile || !enableBottomBar) return;

    clearTimeout(visibilityTimeoutRef.current);
    visibilityTimeoutRef.current = setTimeout(() => {
      if (isAtTop) {
        setIsBottomBarVisible(true);
      } else if (scrollDirection === 'down') {
        // Check if near bottom at evaluation time (no reactive dep)
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
        setIsBottomBarVisible(atBottom);
      } else if (scrollDirection === 'up') {
        setIsBottomBarVisible(true);
      }
    }, 100);

    return () => clearTimeout(visibilityTimeoutRef.current);
  }, [scrollDirection, isAtTop, isMobile, enableBottomBar]);

  // Pull to refresh handlers — use window.scrollY directly (non-reactive read)
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enablePullToRefresh || window.scrollY > 0) return;
    touchStartY.current = e.touches[0].clientY;
  }, [enablePullToRefresh]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enablePullToRefresh || window.scrollY > 0) return;

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;

    if (distance > 0) {
      setIsPulling(true);
      setPullDistance(Math.min(distance, 150));

      // Add resistance effect
      if (distance > 100) {
        setPullDistance(100 + (distance - 100) * 0.3);
      }
    }
  }, [enablePullToRefresh]);

  const handleTouchEnd = useCallback(() => {
    if (!enablePullToRefresh || !isPulling) return;

    if (pullDistance > 80) {
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
      window.location.reload();
    }

    setIsPulling(false);
    setPullDistance(0);
  }, [enablePullToRefresh, isPulling, pullDistance]);

  // Add touch event listeners
  useEffect(() => {
    if (!enablePullToRefresh) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enablePullToRefresh, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Only apply mobile features on mobile devices after mounting
  if (!isMounted || !isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      suppressHydrationWarning
      style={{
        minHeight: viewportHeight || '100vh',
        overflowX: 'clip',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Pull to refresh indicator */}
      {enablePullToRefresh && isPulling && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: pullDistance > 20 ? 1 : 0,
            scale: pullDistance > 80 ? 1.2 : 1,
            y: pullDistance * 0.5
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          suppressHydrationWarning
        >
          <div className={cn(
            "p-3 rounded-full shadow-lg",
            pullDistance > 80
              ? "bg-green-500 text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          )}>
            <svg
              className={cn(
                "h-6 w-6",
                pullDistance > 80 && "animate-spin"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </motion.div>
      )}

      {/* Edge swipe wrapper */}
      {enableEdgeSwipe ? (
        <EdgeSwipeHandler
          onSwipeRight={onSidebarOpen}
          isLeftSwipeEnabled={true}
          isRightSwipeEnabled={false}
          className="h-full"
        >
          <motion.div
            animate={{
              transform: `translateY(${isPulling ? pullDistance * 0.3 : 0}px)`,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="h-full"
            suppressHydrationWarning
          >
            {children}
          </motion.div>
        </EdgeSwipeHandler>
      ) : (
        <motion.div
          animate={{
            transform: `translateY(${isPulling ? pullDistance * 0.3 : 0}px)`,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="h-full"
          suppressHydrationWarning
        >
          {children}
        </motion.div>
      )}

      {/* Bottom navigation bar */}
      {enableBottomBar && (
        <SmartBottomBar
          onMenuClick={onSidebarOpen}
          onQuickAction={onQuickAction}
          isVisible={isBottomBarVisible}
          className="safe-area-bottom"
        />
      )}

      {/* First-time user hint */}
      <FirstTimeHint />
    </div>
  );
}

// First-time user gesture hints
function FirstTimeHint() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenMobileGestureHint');
    if (!hasSeenHint) {
      setTimeout(() => setShowHint(true), 1500);
      setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('hasSeenMobileGestureHint', 'true');
      }, 6000);
    }
  }, []);

  if (!showHint) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
        suppressHydrationWarning
      >
        {/* Left edge hint */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            repeat: 3,
            repeatType: 'reverse',
            duration: 1,
            delay: 0.5
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2"
          suppressHydrationWarning
        >
          <div className="bg-blue-500 text-white px-3 py-2 rounded-r-lg text-sm">
            Swipe from edge →
          </div>
        </motion.div>

        {/* Bottom hint */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2"
          suppressHydrationWarning
        >
          <div className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap">
            Tap + for quick actions
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
