"use client";

import { useEffect, useRef, useCallback, useState } from 'react';

interface ReadingAnalyticsEvent {
  type: 'reading_started' | 'reading_progress' | 'reading_completed' | 'chapter_viewed' | 'mode_changed' | 'bookmark_added' | 'share_clicked';
  data?: Record<string, unknown>;
  timestamp: number;
}

interface UseReadingAnalyticsOptions {
  postId: string;
  totalChapters: number;
  enabled?: boolean;
  /** Callback when event is tracked */
  onEvent?: (event: ReadingAnalyticsEvent) => void;
}

/**
 * Hook for tracking reading analytics and engagement metrics
 * Tracks: time spent, scroll depth, chapters read, mode changes, etc.
 */
export function useReadingAnalytics({
  postId,
  totalChapters,
  enabled = true,
  onEvent,
}: UseReadingAnalyticsOptions) {
  const [sessionStartTime] = useState(() => Date.now());
  const [readingTime, setReadingTime] = useState(0);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [chaptersViewed, setChaptersViewed] = useState<Set<string>>(new Set());
  const [hasStartedReading, setHasStartedReading] = useState(false);
  const [hasCompletedReading, setHasCompletedReading] = useState(false);

  const lastScrollTime = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);
  // Use browser-safe timer type
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enabledRef = useRef<boolean>(enabled);
  // Track which progress milestones have been sent
  const progressMilestones = useRef<Set<number>>(new Set());

  // Keep enabled flag in a ref to avoid effect re-runs
  useEffect(() => {
    enabledRef.current = !!enabled;
  }, [enabled]);

  // Track event
  const trackEvent = useCallback(
    (type: ReadingAnalyticsEvent['type'], data?: Record<string, unknown>) => {
      if (!enabled) return;

      const event: ReadingAnalyticsEvent = {
        type,
        data: {
          postId,
          ...data,
        },
        timestamp: Date.now(),
      };

      // Call custom event handler
      onEvent?.(event);

      // Send to analytics API (optional)
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        }).catch(() => {
          // Silently fail - analytics should not break the app
        });
      }
    },
    [enabled, postId, onEvent]
  );

  // Track reading time
  useEffect(() => {
    // Single interval; gated by refs to avoid dependency loops
    timerRef.current = setInterval(() => {
      if (enabledRef.current && isActiveRef.current) {
        setReadingTime((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Track scroll depth
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = documentHeight - windowHeight;
      const depth = Math.min((scrollTop / trackLength) * 100, 100);

      setScrollDepth(depth);
      lastScrollTime.current = Date.now();
      isActiveRef.current = true;

      // Track reading started
      if (!hasStartedReading && depth > 5) {
        setHasStartedReading(true);
        trackEvent('reading_started', {
          sessionStart: sessionStartTime,
        });
      }

      // Track reading completed
      if (!hasCompletedReading && depth > 90) {
        setHasCompletedReading(true);
        trackEvent('reading_completed', {
          totalTime: Math.floor((Date.now() - sessionStartTime) / 1000),
          scrollDepth: depth,
          chaptersViewed: chaptersViewed.size,
        });
      }

      // Track progress milestones (25%, 50%, 75%) - only once per milestone
      const milestones = [25, 50, 75];
      for (const milestone of milestones) {
        if (depth >= milestone && !progressMilestones.current.has(milestone)) {
          progressMilestones.current.add(milestone);
          trackEvent('reading_progress', {
            progress: milestone,
            timeElapsed: Math.floor((Date.now() - sessionStartTime) / 1000),
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, hasStartedReading, hasCompletedReading, chaptersViewed, sessionStartTime, trackEvent]);

  // Detect user inactivity
  useEffect(() => {
    if (!enabled) return;

    const checkInactivity = setInterval(() => {
      const timeSinceLastScroll = Date.now() - lastScrollTime.current;
      // Mark as inactive after 30 seconds of no scrolling
      if (timeSinceLastScroll > 30000) {
        isActiveRef.current = false;
      }
    }, 5000);

    return () => clearInterval(checkInactivity);
  }, [enabled]);

  // Track page visibility
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled]);

  // Track chapter view
  const trackChapterView = useCallback(
    (chapterId: string) => {
      if (!enabled) return;

      setChaptersViewed((prev) => {
        const newSet = new Set(prev);
        if (!newSet.has(chapterId)) {
          newSet.add(chapterId);
          trackEvent('chapter_viewed', {
            chapterId,
            totalViewed: newSet.size,
            completionRate: (newSet.size / totalChapters) * 100,
          });
        }
        return newSet;
      });
    },
    [enabled, totalChapters, trackEvent]
  );

  // Track mode change
  const trackModeChange = useCallback(
    (mode: string) => {
      if (!enabled) return;
      trackEvent('mode_changed', { mode });
    },
    [enabled, trackEvent]
  );

  // Track bookmark action
  const trackBookmark = useCallback(
    (action: 'added' | 'removed') => {
      if (!enabled) return;
      trackEvent('bookmark_added', { action });
    },
    [enabled, trackEvent]
  );

  // Track share action
  const trackShare = useCallback(
    (platform: string) => {
      if (!enabled) return;
      trackEvent('share_clicked', { platform });
    },
    [enabled, trackEvent]
  );

  return {
    // State
    readingTime,
    scrollDepth,
    chaptersViewed: chaptersViewed.size,
    totalChapters,
    completionRate: (chaptersViewed.size / totalChapters) * 100,
    hasStartedReading,
    hasCompletedReading,

    // Methods
    trackChapterView,
    trackModeChange,
    trackBookmark,
    trackShare,
    trackEvent,
  };
}

/**
 * Hook for generating reading statistics
 */
export function useReadingStats(readingTime: number, scrollDepth: number) {
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }, []);

  const getEngagementLevel = useCallback((): 'low' | 'medium' | 'high' => {
    if (scrollDepth < 25) return 'low';
    if (scrollDepth < 75) return 'medium';
    return 'high';
  }, [scrollDepth]);

  return {
    formattedTime: formatTime(readingTime),
    engagementLevel: getEngagementLevel(),
  };
}
