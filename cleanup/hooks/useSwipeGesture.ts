'use client';

import { useRef, useEffect, useCallback } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: (direction: SwipeDirection) => void;
  onSwipeMove?: (deltaX: number, deltaY: number, direction: SwipeDirection) => void;
  onSwipeEnd?: (direction: SwipeDirection) => void;
}

interface UseSwipeGestureOptions {
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean;
  enabledOnlyForTouch?: boolean;
  edgeThreshold?: number;
  edgeOnly?: boolean;
}

export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  handlers: SwipeHandlers,
  options: UseSwipeGestureOptions = {}
) {
  const {
    threshold = 50,
    preventDefaultTouchmoveEvent = false,
    trackMouse = false,
    enabledOnlyForTouch = true,
    edgeThreshold = 20,
    edgeOnly = false,
  } = options;

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const startTime = useRef<number>(0);
  const isSwipeInProgress = useRef<boolean>(false);

  const getSwipeDirection = useCallback(
    (deltaX: number, deltaY: number): SwipeDirection => {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < threshold && absY < threshold) return null;

      if (absX > absY) {
        return deltaX > 0 ? 'right' : 'left';
      } else {
        return deltaY > 0 ? 'down' : 'up';
      }
    },
    [threshold]
  );

  const handleSwipeStart = useCallback((clientX: number, clientY: number) => {
    if (edgeOnly) {
      const viewportWidth = window.innerWidth;
      if (clientX > edgeThreshold && clientX < viewportWidth - edgeThreshold) {
        return false;
      }
    }

    touchStartX.current = clientX;
    touchStartY.current = clientY;
    touchEndX.current = clientX;
    touchEndY.current = clientY;
    startTime.current = Date.now();
    isSwipeInProgress.current = true;

    return true;
  }, [edgeOnly, edgeThreshold]);

  const handleSwipeMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isSwipeInProgress.current) return;

      touchEndX.current = clientX;
      touchEndY.current = clientY;

      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;
      const direction = getSwipeDirection(deltaX, deltaY);

      handlers.onSwipeMove?.(deltaX, deltaY, direction);
    },
    [getSwipeDirection, handlers]
  );

  const handleSwipeEnd = useCallback(() => {
    if (!isSwipeInProgress.current) return;

    isSwipeInProgress.current = false;

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const direction = getSwipeDirection(deltaX, deltaY);
    const duration = Date.now() - startTime.current;

    // Quick swipe detection (velocity-based)
    const velocity = Math.sqrt(deltaX ** 2 + deltaY ** 2) / duration;
    const isQuickSwipe = velocity > 0.5;

    if (direction || isQuickSwipe) {
      handlers.onSwipeEnd?.(direction);

      // Call specific direction handlers
      if (direction === 'left') handlers.onSwipeLeft?.();
      if (direction === 'right') handlers.onSwipeRight?.();
      if (direction === 'up') handlers.onSwipeUp?.();
      if (direction === 'down') handlers.onSwipeDown?.();
    }
  }, [getSwipeDirection, handlers]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (handleSwipeStart(touch.clientX, touch.clientY)) {
        const deltaX = touchEndX.current - touchStartX.current;
        const deltaY = touchEndY.current - touchStartY.current;
        const direction = getSwipeDirection(deltaX, deltaY);
        handlers.onSwipeStart?.(direction);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent && isSwipeInProgress.current) {
        e.preventDefault();
      }
      const touch = e.changedTouches[0];
      handleSwipeMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
      handleSwipeEnd();
    };

    // Mouse event handlers (optional)
    const handleMouseDown = (e: MouseEvent) => {
      if (enabledOnlyForTouch) return;
      if (handleSwipeStart(e.clientX, e.clientY)) {
        const deltaX = touchEndX.current - touchStartX.current;
        const deltaY = touchEndY.current - touchStartY.current;
        const direction = getSwipeDirection(deltaX, deltaY);
        handlers.onSwipeStart?.(direction);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (enabledOnlyForTouch) return;
      handleSwipeMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (enabledOnlyForTouch) return;
      handleSwipeEnd();
    };

    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    if (trackMouse && !enabledOnlyForTouch) {
      element.addEventListener('mousedown', handleMouseDown);
      element.addEventListener('mousemove', handleMouseMove);
      element.addEventListener('mouseup', handleMouseUp);
      element.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      if (trackMouse && !enabledOnlyForTouch) {
        element.removeEventListener('mousedown', handleMouseDown);
        element.removeEventListener('mousemove', handleMouseMove);
        element.removeEventListener('mouseup', handleMouseUp);
        element.removeEventListener('mouseleave', handleMouseUp);
      }
    };
  }, [
    elementRef,
    handlers,
    preventDefaultTouchmoveEvent,
    trackMouse,
    enabledOnlyForTouch,
    handleSwipeStart,
    handleSwipeMove,
    handleSwipeEnd,
    getSwipeDirection,
  ]);
}