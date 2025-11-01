"use client";

import { useEffect, useState, useRef, useCallback } from 'react';

interface UseScrollSpyOptions {
  /** Array of section IDs to track */
  sectionIds: string[];
  /** Offset from top in pixels (default: 100) */
  offset?: number;
  /** Root margin for IntersectionObserver (default: '0px 0px -80% 0px') */
  rootMargin?: string;
  /** Threshold for IntersectionObserver (default: 0) */
  threshold?: number | number[];
}

/**
 * Hook to track which section is currently in view
 * Uses IntersectionObserver for performance
 */
export function useScrollSpy({
  sectionIds,
  offset = 100,
  rootMargin = '0px 0px -80% 0px',
  threshold = 0,
}: UseScrollSpyOptions) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionIdsRef = useRef<string[]>([]);

  // Create a stable string key from sectionIds for dependency comparison
  const sectionIdsKey = sectionIds.join(',');

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionIds.length) return;

    // Only update if the actual content has changed
    const idsHaveChanged = sectionIdsRef.current.join(',') !== sectionIdsKey;
    if (!idsHaveChanged && observerRef.current) {
      return;
    }
    sectionIdsRef.current = sectionIds;

    // Cleanup previous observer
    observerRef.current?.disconnect();

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // Find the most visible section
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);

      if (visibleEntries.length === 0) return;

      const mostVisibleEntry = visibleEntries.reduce((prev, current) => {
        return current.intersectionRatio > prev.intersectionRatio ? current : prev;
      });

      const target = mostVisibleEntry.target as HTMLElement;
      if (target?.id) {
        setActiveId(target.id);
      }
    };

    // Create IntersectionObserver
    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin,
      threshold,
    });

    // Observe all sections
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    // Cleanup
    return () => {
      observerRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIdsKey, rootMargin, threshold]);

  const scrollToSection = useCallback(
    (id: string) => {
      const element = document.getElementById(id);
      if (!element) return;

      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    },
    [offset]
  );

  return {
    activeId,
    scrollToSection,
  };
}

/**
 * Hook for tracking scroll progress through sections
 */
export function useScrollProgress(sectionIds: string[]) {
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !sectionIds.length) return;

    const handleScroll = () => {
      const newProgress: Record<string, number> = {};

      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Calculate how much of the element has been scrolled through
        if (rect.top < windowHeight && rect.bottom > 0) {
          const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
          const elementHeight = rect.height;
          const percentage = Math.min((visibleHeight / elementHeight) * 100, 100);
          newProgress[id] = Math.round(percentage);
        } else if (rect.bottom <= 0) {
          newProgress[id] = 100;
        } else {
          newProgress[id] = 0;
        }
      });

      setProgress(newProgress);
    };

    handleScroll(); // Initial calculation
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds]);

  return progress;
}

/**
 * Hook for smooth scrolling with easing
 */
export function useSmoothScroll() {
  const scrollTo = useCallback((target: number | string, offset = 0) => {
    let targetPosition: number;

    if (typeof target === 'string') {
      const element = document.getElementById(target) || document.querySelector(target);
      if (!element) return;
      targetPosition = element.getBoundingClientRect().top + window.scrollY - offset;
    } else {
      targetPosition = target - offset;
    }

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth',
    });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  return {
    scrollTo,
    scrollToTop,
    scrollToBottom,
  };
}
