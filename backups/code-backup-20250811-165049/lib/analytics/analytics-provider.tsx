'use client';

// Analytics Context Provider for React

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { EventTracker } from './event-tracker';
import { ClickTracker } from './collectors/click-tracker';
import { ScrollTracker } from './collectors/scroll-tracker';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

interface AnalyticsContextValue {
  tracker: EventTracker;
  clickTracker: ClickTracker;
  scrollTracker: ScrollTracker;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  config?: {
    enabled?: boolean;
    debug?: boolean;
    endpoint?: string;
  };
}

export function AnalyticsProvider({ children, config = {} }: AnalyticsProviderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const trackersRef = useRef<AnalyticsContextValue | null>(null);
  const lastPathname = useRef(pathname);

  useEffect(() => {
    // Initialize trackers only once
    if (!trackersRef.current && config.enabled !== false) {
      const tracker = EventTracker.getInstance({
        debug: config.debug,
        endpoint: config.endpoint
      });

      const clickTracker = new ClickTracker(tracker);
      const scrollTracker = new ScrollTracker(tracker);

      trackersRef.current = {
        tracker,
        clickTracker,
        scrollTracker
      };

      // Set user context if available
      if (session?.user?.id) {
        tracker.track({
          eventType: 'custom',
          eventName: 'session_start',
          userId: session.user.id,
          properties: {
            userEmail: session.user.email,
            userName: session.user.name
          }
        });
      }
    }

    return () => {
      // Cleanup on unmount
      if (trackersRef.current) {
        trackersRef.current.tracker.destroy();
        trackersRef.current.clickTracker.destroy();
        trackersRef.current.scrollTracker.destroy();
      }
    };
  }, [session, config]);

  // Track page views on route change
  useEffect(() => {
    if (pathname !== lastPathname.current && trackersRef.current) {
      // Track page exit for previous page
      if (lastPathname.current) {
        trackersRef.current.tracker.track({
          eventType: 'view',
          eventName: 'page_exit',
          properties: {
            pagePath: lastPathname.current,
            nextPage: pathname,
            timeOnPage: Date.now() - performance.now()
          }
        });
      }

      // Track page view for new page
      trackersRef.current.tracker.trackPageView(pathname, {
        referrer: lastPathname.current,
        title: document.title
      });

      lastPathname.current = pathname;
    }
  }, [pathname]);

  // Update user context when session changes
  useEffect(() => {
    if (session?.user?.id && trackersRef.current) {
      // Update tracker with user context
      const tracker = trackersRef.current.tracker;
      
      // We'll need to modify the EventTracker to support setting user context
      // For now, track a user identification event
      tracker.track({
        eventType: 'custom',
        eventName: 'user_identified',
        userId: session.user.id,
        properties: {
          email: session.user.email,
          name: session.user.name
        }
      });
    }
  }, [session]);

  if (!trackersRef.current) {
    return <>{children}</>;
  }

  return (
    <AnalyticsContext.Provider value={trackersRef.current}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hooks for using analytics in components
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

export function useEventTracker() {
  const { tracker } = useAnalytics();
  return tracker;
}

export function useClickTracking() {
  const { tracker } = useAnalytics();
  
  return {
    trackClick: (elementName: string, properties?: Record<string, any>) => {
      tracker.trackClick(elementName, properties);
    },
    trackButtonClick: (buttonName: string, action?: string) => {
      tracker.track({
        eventType: 'click',
        eventName: 'button_click',
        properties: {
          buttonName,
          action
        }
      });
    },
    trackLinkClick: (href: string, text?: string) => {
      tracker.track({
        eventType: 'click',
        eventName: 'link_click',
        properties: {
          href,
          text,
          isExternal: !href.startsWith('/')
        }
      });
    }
  };
}

export function usePageTracking(pageName?: string) {
  const { tracker } = useAnalytics();
  const pathname = usePathname();
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const name = pageName || pathname;
    
    // Track page view
    tracker.trackPageView(name, {
      pathname,
      timestamp: new Date().toISOString()
    });

    // Reset start time
    startTimeRef.current = Date.now();

    return () => {
      // Track page exit
      const timeSpent = Date.now() - startTimeRef.current;
      tracker.track({
        eventType: 'view',
        eventName: 'page_time_spent',
        properties: {
          pageName: name,
          timeSpent,
          pathname
        }
      });
    };
  }, [pathname, pageName, tracker]);
}

// Hook for tracking course interactions
export function useCourseTracking(courseId?: string, chapterId?: string, sectionId?: string) {
  const { tracker } = useAnalytics();
  
  return {
    trackVideoPlay: (videoId: string, currentTime: number) => {
      tracker.track({
        eventType: 'video',
        eventName: 'video_play',
        courseId,
        chapterId,
        sectionId,
        properties: {
          videoId,
          currentTime
        }
      });
    },
    trackVideoPause: (videoId: string, currentTime: number, duration: number) => {
      tracker.track({
        eventType: 'video',
        eventName: 'video_pause',
        courseId,
        chapterId,
        sectionId,
        properties: {
          videoId,
          currentTime,
          duration,
          percentWatched: (currentTime / duration) * 100
        }
      });
    },
    trackQuizStart: (quizId: string) => {
      tracker.track({
        eventType: 'quiz',
        eventName: 'quiz_start',
        courseId,
        chapterId,
        sectionId,
        properties: {
          quizId,
          startTime: new Date().toISOString()
        }
      });
    },
    trackQuizComplete: (quizId: string, score: number, timeSpent: number) => {
      tracker.track({
        eventType: 'quiz',
        eventName: 'quiz_complete',
        courseId,
        chapterId,
        sectionId,
        properties: {
          quizId,
          score,
          timeSpent,
          passed: score >= 70
        }
      });
    }
  };
}