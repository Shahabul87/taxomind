"use client";

import { useEffect, useRef, useCallback } from "react";
import { useLearningMode } from "../../../../_components/learning-mode-context";
import { usePathname } from "next/navigation";
import { debounce } from "lodash";

interface AnalyticsEvent {
  eventType: string;
  eventData?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface LearningAnalyticsProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  contentType?: string;
  contentId?: string;
}

// Event types for analytics
export const ANALYTICS_EVENTS = {
  // Page events
  SECTION_VIEWED: "section_viewed",
  SECTION_COMPLETED: "section_completed",
  SECTION_EXITED: "section_exited",

  // Video events
  VIDEO_STARTED: "video_started",
  VIDEO_PAUSED: "video_paused",
  VIDEO_RESUMED: "video_resumed",
  VIDEO_COMPLETED: "video_completed",
  VIDEO_SEEKED: "video_seeked",
  VIDEO_SPEED_CHANGED: "video_speed_changed",

  // Content interaction events
  TAB_SWITCHED: "tab_switched",
  CONTENT_VIEWED: "content_viewed",
  CONTENT_COPIED: "content_copied",
  CONTENT_DOWNLOADED: "content_downloaded",

  // Quiz/Exam events
  QUIZ_STARTED: "quiz_started",
  QUIZ_SUBMITTED: "quiz_submitted",
  QUIZ_RETRIED: "quiz_retried",
  QUESTION_ANSWERED: "question_answered",

  // Engagement events
  TIME_SPENT: "time_spent",
  SCROLL_DEPTH: "scroll_depth",
  FOCUS_TIME: "focus_time",
  IDLE_TIME: "idle_time",

  // Navigation events
  NAVIGATION_NEXT: "navigation_next",
  NAVIGATION_PREV: "navigation_prev",
  SIDEBAR_TOGGLED: "sidebar_toggled",
  KEYBOARD_SHORTCUT_USED: "keyboard_shortcut_used",
} as const;

export function useLearningAnalyticsTracker({
  courseId,
  chapterId,
  sectionId,
  contentType,
  contentId,
}: LearningAnalyticsProps) {
  const { user, canTrackProgress, mode } = useLearningMode();
  const pathname = usePathname();
  const sessionId = useRef<string>("");
  const startTime = useRef<number>(Date.now());
  const lastActivityTime = useRef<number>(Date.now());
  const totalFocusTime = useRef<number>(0);
  const totalIdleTime = useRef<number>(0);
  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const isPageVisible = useRef<boolean>(true);
  const scrollDepth = useRef<number>(0);

  // Generate unique session ID
  const generateSessionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Flush events to server
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];

    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: eventsToSend,
          courseId,
          chapterId,
          sectionId,
        }),
      });
    } catch (error) {
      console.error("Failed to send analytics:", error);
      // Re-queue events on failure
      eventQueue.current.unshift(...eventsToSend);
    }
  }, [courseId, chapterId, sectionId]);

  // Track event
  const trackEvent = useCallback(
    (eventType: string, eventData?: Record<string, any>) => {
      if (!canTrackProgress || mode !== "learning") return;

      const event: AnalyticsEvent = {
        eventType,
        eventData: {
          ...eventData,
          pathname,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
        },
        timestamp: Date.now(),
        sessionId: sessionId.current,
        userId: user?.id,
      };

      eventQueue.current.push(event);

      // Batch events and send every 10 events or 5 seconds
      if (eventQueue.current.length >= 10) {
        flushEvents();
      }
    },
    [canTrackProgress, mode, user, pathname, flushEvents]
  );

  // Initialize session
  useEffect(() => {
    sessionId.current = generateSessionId();
    startTime.current = Date.now();

    // Track initial page view
    trackEvent(ANALYTICS_EVENTS.SECTION_VIEWED, {
      courseId,
      chapterId,
      sectionId,
      contentType,
      contentId,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });

    return () => {
      // Track exit and time spent when component unmounts
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      trackEvent(ANALYTICS_EVENTS.SECTION_EXITED, {
        timeSpent,
        totalFocusTime: Math.floor(totalFocusTime.current / 1000),
        totalIdleTime: Math.floor(totalIdleTime.current / 1000),
        maxScrollDepth: scrollDepth.current,
      });

      // Flush any remaining events
      flushEvents();
    };
  }, [courseId, chapterId, sectionId, contentType, contentId, trackEvent, flushEvents]);

  // Track page visibility (for accurate time tracking)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;

      if (document.hidden) {
        // Page became hidden
        totalFocusTime.current += Date.now() - lastActivityTime.current;
      } else {
        // Page became visible
        lastActivityTime.current = Date.now();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Track user activity (mouse, keyboard)
  useEffect(() => {
    const updateActivity = debounce(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime.current;

      // Consider user idle after 30 seconds of no activity
      if (timeSinceLastActivity > 30000) {
        totalIdleTime.current += timeSinceLastActivity;
      }

      lastActivityTime.current = now;
    }, 1000);

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = debounce(() => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      const currentScrollDepth = Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100
      );

      if (currentScrollDepth > scrollDepth.current) {
        scrollDepth.current = currentScrollDepth;

        // Track milestones (25%, 50%, 75%, 100%)
        const milestones = [25, 50, 75, 100];
        const milestone = milestones.find(
          (m) => currentScrollDepth >= m && scrollDepth.current < m
        );

        if (milestone) {
          trackEvent(ANALYTICS_EVENTS.SCROLL_DEPTH, {
            depth: milestone,
            courseId,
            sectionId,
          });
        }
      }
    }, 500);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [courseId, sectionId, trackEvent]);

  // Periodically send time spent data
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPageVisible.current) {
        const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
        trackEvent(ANALYTICS_EVENTS.TIME_SPENT, {
          timeSpent,
          courseId,
          chapterId,
          sectionId,
          focusTime: Math.floor(totalFocusTime.current / 1000),
          idleTime: Math.floor(totalIdleTime.current / 1000),
        });
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [courseId, chapterId, sectionId, trackEvent]);

  // Auto-flush events periodically
  useEffect(() => {
    const interval = setInterval(flushEvents, 5000);
    return () => {
      clearInterval(interval);
      flushEvents();
    };
  }, [flushEvents]);

  // Expose tracking methods
  return {
    trackEvent,
    trackVideoEvent: (action: string, data?: Record<string, any>) => {
      trackEvent(action, { ...data, contentType: "video" });
    },
    trackContentInteraction: (action: string, data?: Record<string, any>) => {
      trackEvent(action, { ...data, contentType });
    },
    trackQuizEvent: (action: string, data?: Record<string, any>) => {
      trackEvent(action, { ...data, contentType: "quiz" });
    },
    trackNavigation: (direction: "next" | "prev" | "jump", targetSection?: string) => {
      trackEvent(
        direction === "next"
          ? ANALYTICS_EVENTS.NAVIGATION_NEXT
          : ANALYTICS_EVENTS.NAVIGATION_PREV,
        { direction, targetSection }
      );
    },
  };
}

// Export the hook with a simpler name for ease of use
export const useAnalytics = useLearningAnalyticsTracker;