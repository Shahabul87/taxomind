'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | 'idle';

interface UseScrollDirectionOptions {
  threshold?: number;
  debounce?: number;
  initialDirection?: ScrollDirection;
}

/**
 * Tracks scroll direction without exposing scrollY as reactive state.
 *
 * scrollY is kept in a ref so that consumers like MobileGestureController
 * don't re-render on every scroll frame. Only direction changes (up/down/idle)
 * and boundary flags (isAtTop/isNearTop) trigger re-renders.
 */
export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): {
  scrollDirection: ScrollDirection;
  scrollY: number;
  isAtTop: boolean;
  isNearTop: boolean;
} {
  const {
    threshold = 5,
    debounce = 30,
    initialDirection = 'idle'
  } = options;

  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isNearTop, setIsNearTop] = useState(true);
  const scrollYRef = useRef(0);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const timeout = useRef<NodeJS.Timeout>();

  const updateScrollDirection = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (Math.abs(currentScrollY - lastScrollY.current) < threshold) {
      ticking.current = false;
      return;
    }

    scrollYRef.current = currentScrollY;

    const newDirection: ScrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
    const newIsAtTop = currentScrollY < 10;
    const newIsNearTop = currentScrollY < 100;

    lastScrollY.current = currentScrollY;
    ticking.current = false;

    // Batch state updates — only set if changed to avoid re-renders
    setScrollDirection(prev => prev === newDirection ? prev : newDirection);
    setIsAtTop(prev => prev === newIsAtTop ? prev : newIsAtTop);
    setIsNearTop(prev => prev === newIsNearTop ? prev : newIsNearTop);

    // Set to idle after debounce
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      setScrollDirection('idle');
    }, debounce * 2);
  }, [threshold, debounce]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(updateScrollDirection);
      ticking.current = true;
    }
  }, [updateScrollDirection]);

  useEffect(() => {
    scrollYRef.current = window.scrollY;
    lastScrollY.current = window.scrollY;
    setIsAtTop(window.scrollY < 10);
    setIsNearTop(window.scrollY < 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout.current);
    };
  }, [handleScroll]);

  return {
    scrollDirection,
    scrollY: scrollYRef.current,
    isAtTop,
    isNearTop
  };
}
