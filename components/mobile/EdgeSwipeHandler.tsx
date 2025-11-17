'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EdgeSwipeHandlerProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  isLeftSwipeEnabled?: boolean;
  isRightSwipeEnabled?: boolean;
  edgeWidth?: number;
  swipeThreshold?: number;
  className?: string;
}

export function EdgeSwipeHandler({
  children,
  onSwipeRight,
  onSwipeLeft,
  isLeftSwipeEnabled = true,
  isRightSwipeEnabled = false,
  edgeWidth = 20,
  swipeThreshold = 80,
  className,
}: EdgeSwipeHandlerProps) {
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Show edge indicators on hover or touch
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const relativeX = e.clientX - rect.left;

      if (isLeftSwipeEnabled && relativeX < edgeWidth) {
        setShowLeftIndicator(true);
      } else {
        setShowLeftIndicator(false);
      }

      if (isRightSwipeEnabled && relativeX > rect.width - edgeWidth) {
        setShowRightIndicator(true);
      } else {
        setShowRightIndicator(false);
      }
    },
    [edgeWidth, isLeftSwipeEnabled, isRightSwipeEnabled]
  );

  const handlePointerLeave = useCallback(() => {
    setShowLeftIndicator(false);
    setShowRightIndicator(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [handlePointerMove, handlePointerLeave]);

  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const startX = info.point.x;
    const viewportWidth = window.innerWidth;

    // Check if drag started from edge
    const isLeftEdge = startX < edgeWidth;
    const isRightEdge = startX > viewportWidth - edgeWidth;

    if (!isLeftEdge && !isRightEdge) {
      // Cancel drag if not from edge
      controls.start({ x: 0 });
      return false;
    }
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const progress = Math.abs(info.offset.x / swipeThreshold);
    setSwipeProgress(Math.min(progress, 1));
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeVelocity = info.velocity.x;
    const swipeDistance = info.offset.x;

    setSwipeProgress(0);

    // Check for right swipe (from left edge)
    if (isLeftSwipeEnabled && (swipeDistance > swipeThreshold || swipeVelocity > 500)) {
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onSwipeRight?.();
    }
    // Check for left swipe (from right edge)
    else if (isRightSwipeEnabled && (swipeDistance < -swipeThreshold || swipeVelocity < -500)) {
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onSwipeLeft?.();
    }

    // Animate back to center
    await controls.start({
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    });
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative h-full w-full overflow-hidden', className)}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x }}
      suppressHydrationWarning
    >
      {/* Left Edge Indicator */}
      {isLeftSwipeEnabled && (
        <>
          <div
            className={cn(
              'fixed left-0 top-0 h-full w-1 z-50',
              'bg-gradient-to-r from-blue-500/20 to-transparent',
              'pointer-events-none transition-opacity duration-300',
              showLeftIndicator ? 'opacity-100' : 'opacity-0'
            )}
          />
          {swipeProgress > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: swipeProgress }}
              className="fixed left-0 top-0 h-full w-20 z-40 pointer-events-none"
            >
              <div className="h-full bg-gradient-to-r from-blue-500/30 to-transparent" />
              <div
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white"
                style={{ opacity: swipeProgress }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="animate-pulse"
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Right Edge Indicator */}
      {isRightSwipeEnabled && (
        <>
          <div
            className={cn(
              'fixed right-0 top-0 h-full w-1 z-50',
              'bg-gradient-to-l from-blue-500/20 to-transparent',
              'pointer-events-none transition-opacity duration-300',
              showRightIndicator ? 'opacity-100' : 'opacity-0'
            )}
          />
          {swipeProgress > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: swipeProgress }}
              className="fixed right-0 top-0 h-full w-20 z-40 pointer-events-none"
            >
              <div className="h-full bg-gradient-to-l from-blue-500/30 to-transparent" />
              <div
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white"
                style={{ opacity: swipeProgress }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="animate-pulse"
                >
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Main Content */}
      {children}
    </motion.div>
  );
}