'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | 'idle';

interface UseScrollDirectionOptions {
  threshold?: number;
  debounce?: number;
  initialDirection?: ScrollDirection;
}

export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): {
  scrollDirection: ScrollDirection;
  scrollY: number;
  isAtTop: boolean;
  isNearTop: boolean;
} {
  const {
    threshold = 5,  // More sensitive to scroll changes
    debounce = 30,  // Faster response
    initialDirection = 'idle'
  } = options;

  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection);
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const timeout = useRef<NodeJS.Timeout>();

  const updateScrollDirection = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (Math.abs(currentScrollY - lastScrollY.current) < threshold) {
      ticking.current = false;
      return;
    }

    setScrollY(currentScrollY);
    setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
    lastScrollY.current = currentScrollY;
    ticking.current = false;

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
    // Set initial scroll position
    setScrollY(window.scrollY);
    lastScrollY.current = window.scrollY;

    // Add passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout.current);
    };
  }, [handleScroll]);

  return {
    scrollDirection,
    scrollY,
    isAtTop: scrollY < 10,
    isNearTop: scrollY < 100
  };
}