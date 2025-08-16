"use client";

import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    freezeOnceVisible = false,
  } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Don't observe if already visible and freeze is enabled
    if (freezeOnceVisible && hasBeenVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible) {
          setHasBeenVisible(true);
        }

        // If freezeOnceVisible is true and element becomes visible, disconnect observer
        if (freezeOnceVisible && isVisible && observerRef.current) {
          observerRef.current.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    observerRef.current = observer;
    observer.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [elementRef, threshold, rootMargin, root, freezeOnceVisible, hasBeenVisible]);

  return { isIntersecting, hasBeenVisible };
}

// Hook for observing multiple elements
export function useMultipleIntersectionObserver(
  elementsRef: React.RefObject<Element>[],
  options: UseIntersectionObserverOptions = {}
) {
  const [intersections, setIntersections] = useState<boolean[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    freezeOnceVisible = false,
  } = options;

  useEffect(() => {
    const elements = elementsRef.map(ref => ref.current).filter(Boolean);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = elements.indexOf(entry.target);
          if (index !== -1) {
            setIntersections(prev => {
              const newIntersections = [...prev];
              newIntersections[index] = entry.isIntersecting;
              return newIntersections;
            });
          }
        });
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    observerRef.current = observer;
    elements.forEach(element => observer.observe(element));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [elementsRef, threshold, rootMargin, root, freezeOnceVisible]);

  return intersections;
}

// Hook for lazy loading with intersection observer
export function useLazyLoading(
  callback: () => void,
  options: UseIntersectionObserverOptions & { dependencies?: any[] } = {}
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { dependencies = [], ...observerOptions } = options;

  const { isIntersecting } = useIntersectionObserver(elementRef, {
    ...observerOptions,
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (isIntersecting && !hasLoaded) {
      callback();
      setHasLoaded(true);
    }
  }, [isIntersecting, hasLoaded, callback, dependencies]);

  return { elementRef, hasLoaded };
}