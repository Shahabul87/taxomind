'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useEventTracker } from '@/lib/analytics/analytics-provider';
import { usePathname } from 'next/navigation';
import { throttle, debounce } from '@/lib/utils';

interface ScrollTrackingOptions {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  container?: HTMLElement | null; // Track specific container instead of window
  thresholds?: number[]; // Percentage thresholds to track (e.g., [25, 50, 75, 100])
  throttleMs?: number; // Throttle scroll events (default: 500ms)
  trackDepth?: boolean; // Track maximum scroll depth
  trackTime?: boolean; // Track time spent at different scroll positions
  trackDirection?: boolean; // Track scroll direction changes
}

interface ScrollMetrics {
  scrollPercentage: number;
  maxScrollDepth: number;
  scrollDirection: 'up' | 'down' | null;
  timeAtPosition: Record<string, number>;
  totalScrollDistance: number;
  scrollVelocity: number;
}

export function useScrollTracking(options: ScrollTrackingOptions = {}) {
  const {
    container = null,
    thresholds = [25, 50, 75, 100],
    throttleMs = 500,
    trackDepth = true,
    trackTime = true,
    trackDirection = true
  } = options;

  const tracker = useEventTracker();
  const pathname = usePathname();
  
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    scrollPercentage: 0,
    maxScrollDepth: 0,
    scrollDirection: null,
    timeAtPosition: {},
    totalScrollDistance: 0,
    scrollVelocity: 0
  });

  const metricsRef = useRef(metrics);
  const lastScrollPosition = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const positionTimers = useRef<Record<string, number>>({});
  const reachedMilestones = useRef(new Set<number>());
  const scrollStartTime = useRef(Date.now());

  // Update metrics ref when state changes
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // Calculate scroll percentage
  const calculateScrollPercentage = useCallback((element?: HTMLElement | null): number => {
    if (element) {
      return Math.round((element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100);
    } else {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      return scrollHeight > 0 
        ? Math.round((window.scrollY / scrollHeight) * 100)
        : 0;
    }
  }, []);

  // Track time at scroll position
  const updateTimeAtPosition = useCallback(() => {
    if (!trackTime) return;

    const currentPosition = Math.floor(metricsRef.current.scrollPercentage / 10) * 10;
    const positionKey = `${currentPosition}-${currentPosition + 10}`;

    // Clear previous timer
    Object.keys(positionTimers.current).forEach(key => {
      if (key !== positionKey) {
        clearInterval(positionTimers.current[key]);
        delete positionTimers.current[key];
      }
    });

    // Start new timer if not exists
    if (!positionTimers.current[positionKey]) {
      positionTimers.current[positionKey] = window.setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          timeAtPosition: {
            ...prev.timeAtPosition,
            [positionKey]: (prev.timeAtPosition[positionKey] || 0) + 1
          }
        }));
      }, 1000);
    }
  }, [trackTime]);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    const element = container;
    const currentScrollY = element ? element.scrollTop : window.scrollY;
    const currentTime = Date.now();
    const scrollPercentage = calculateScrollPercentage(element);

    // Calculate scroll velocity
    const timeDiff = currentTime - lastScrollTime.current;
    const scrollDiff = Math.abs(currentScrollY - lastScrollPosition.current);
    const velocity = timeDiff > 0 ? scrollDiff / timeDiff : 0;

    // Determine scroll direction
    let scrollDirection: 'up' | 'down' | null = null;
    if (trackDirection) {
      if (currentScrollY > lastScrollPosition.current) {
        scrollDirection = 'down';
      } else if (currentScrollY < lastScrollPosition.current) {
        scrollDirection = 'up';
      }
    }

    // Update metrics
    setMetrics(prev => ({
      scrollPercentage,
      maxScrollDepth: trackDepth ? Math.max(prev.maxScrollDepth, scrollPercentage) : prev.maxScrollDepth,
      scrollDirection: scrollDirection || prev.scrollDirection,
      timeAtPosition: prev.timeAtPosition,
      totalScrollDistance: prev.totalScrollDistance + scrollDiff,
      scrollVelocity: velocity
    }));

    // Track milestone events
    thresholds.forEach(threshold => {
      if (scrollPercentage >= threshold && !reachedMilestones.current.has(threshold)) {
        reachedMilestones.current.add(threshold);
        
        tracker.track({
          eventType: 'scroll',
          eventName: 'scroll_milestone',
          properties: {
            milestone: threshold,
            timeToReach: Date.now() - scrollStartTime.current,
            scrollDirection,
            velocity,
            pathname
          },
          courseId: options.courseId,
          chapterId: options.chapterId,
          sectionId: options.sectionId
        });
      }
    });

    // Update tracking variables
    lastScrollPosition.current = currentScrollY;
    lastScrollTime.current = currentTime;

    // Update time tracking
    updateTimeAtPosition();
  }, [
    container,
    calculateScrollPercentage,
    trackDepth,
    trackDirection,
    thresholds,
    tracker,
    pathname,
    options,
    updateTimeAtPosition
  ]);

  // Throttled scroll handler
  const throttledHandleScroll = useRef(
    throttle(handleScroll, throttleMs)
  ).current;

  // Track scroll end event
  const handleScrollEnd = useRef(
    debounce(() => {
      // Send comprehensive scroll analytics
      tracker.track({
        eventType: 'scroll',
        eventName: 'scroll_session_end',
        properties: {
          maxDepth: metricsRef.current.maxScrollDepth,
          totalDistance: metricsRef.current.totalScrollDistance,
          timeAtPosition: metricsRef.current.timeAtPosition,
          sessionDuration: Date.now() - scrollStartTime.current,
          pathname
        },
        courseId: options.courseId,
        chapterId: options.chapterId,
        sectionId: options.sectionId
      });
    }, 2000)
  ).current;

  // Set up scroll listeners
  useEffect(() => {
    const element = container || window;
    
    // Initial calculation
    handleScroll();

    // Add listeners
    element.addEventListener('scroll', throttledHandleScroll);
    element.addEventListener('scroll', handleScrollEnd);

    return () => {
      element.removeEventListener('scroll', throttledHandleScroll);
      element.removeEventListener('scroll', handleScrollEnd);
      
      // Clear all position timers
      Object.values(positionTimers.current).forEach(timer => {
        clearInterval(timer);
      });
      
      // Send final metrics
      handleScrollEnd.flush();
    };
  }, [container, throttledHandleScroll, handleScrollEnd, handleScroll]);

  // Reset tracking when pathname changes
  useEffect(() => {
    reachedMilestones.current.clear();
    scrollStartTime.current = Date.now();
    setMetrics({
      scrollPercentage: 0,
      maxScrollDepth: 0,
      scrollDirection: null,
      timeAtPosition: {},
      totalScrollDistance: 0,
      scrollVelocity: 0
    });
  }, [pathname]);

  // Manual tracking functions
  const trackScrollTo = useCallback((targetId: string) => {
    tracker.track({
      eventType: 'scroll',
      eventName: 'scroll_to_element',
      properties: {
        targetId,
        fromPosition: metrics.scrollPercentage,
        pathname
      },
      courseId: options.courseId,
      chapterId: options.chapterId,
      sectionId: options.sectionId
    });
  }, [tracker, metrics.scrollPercentage, pathname, options]);

  const trackReadingComplete = useCallback(() => {
    tracker.track({
      eventType: 'scroll',
      eventName: 'reading_complete',
      properties: {
        maxDepth: metrics.maxScrollDepth,
        totalTime: Date.now() - scrollStartTime.current,
        averageVelocity: metrics.totalScrollDistance / (Date.now() - scrollStartTime.current),
        pathname
      },
      courseId: options.courseId,
      chapterId: options.chapterId,
      sectionId: options.sectionId
    });
  }, [tracker, metrics, pathname, options]);

  return {
    metrics,
    trackScrollTo,
    trackReadingComplete
  };
}

// Hook for tracking content visibility
export function useContentVisibility(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    threshold?: number;
    rootMargin?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    contentId: string;
    contentType: string;
  }
) {
  const tracker = useEventTracker();
  const [isVisible, setIsVisible] = useState(false);
  const [visibilityTime, setVisibilityTime] = useState(0);
  const visibilityTimer = useRef<NodeJS.Timeout>();
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        if (visible) {
          // Start visibility timer
          const startTime = Date.now();
          visibilityTimer.current = setInterval(() => {
            setVisibilityTime(Date.now() - startTime);
          }, 1000);

          // Track view event (only once)
          if (!hasTrackedView.current) {
            hasTrackedView.current = true;
            tracker.track({
              eventType: 'view',
              eventName: `${options.contentType}_view`,
              properties: {
                contentId: options.contentId,
                contentType: options.contentType,
                viewportHeight: window.innerHeight,
                elementHeight: entry.target.clientHeight,
                visiblePercentage: entry.intersectionRatio * 100
              },
              courseId: options.courseId,
              chapterId: options.chapterId,
              sectionId: options.sectionId
            });
          }
        } else {
          // Clear timer and track time spent
          if (visibilityTimer.current) {
            clearInterval(visibilityTimer.current);
            
            if (visibilityTime > 1000) { // Only track if visible for more than 1 second
              tracker.track({
                eventType: 'view',
                eventName: `${options.contentType}_view_time`,
                properties: {
                  contentId: options.contentId,
                  contentType: options.contentType,
                  timeSpent: visibilityTime
                },
                courseId: options.courseId,
                chapterId: options.chapterId,
                sectionId: options.sectionId
              });
            }
          }
        }
      },
      {
        threshold: options.threshold || 0.5,
        rootMargin: options.rootMargin || '0px'
      }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
      if (visibilityTimer.current) {
        clearInterval(visibilityTimer.current);
      }
    };
  }, [elementRef, options, tracker, visibilityTime]);

  return { isVisible, visibilityTime };
}