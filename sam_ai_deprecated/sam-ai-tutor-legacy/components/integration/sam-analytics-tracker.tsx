"use client";

import React, { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSamAITutor } from '@/app/(protected)/teacher/_components/sam-ai-tutor-provider';
import { recordAnalyticsSession } from '@/sam/engines/advanced/sam-analytics-engine';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

interface SAMAnalyticsTrackerProps {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
}

export function SAMAnalyticsTracker({ 
  courseId, 
  chapterId, 
  sectionId 
}: SAMAnalyticsTrackerProps) {
  const { data: session } = useSession();
  const { trackInteraction } = useSamAITutor();
  
  const sessionIdRef = useRef<string>(uuidv4());
  const sessionStartRef = useRef<Date>(new Date());
  const interactionCountRef = useRef<number>(0);
  const lastActivityRef = useRef<Date>(new Date());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // End analytics session
  const endAnalyticsSession = useCallback(async () => {
    if (!session?.user?.id || interactionCountRef.current === 0) return;

    const sessionEnd = new Date();
    const sessionDuration = sessionEnd.getTime() - sessionStartRef.current.getTime();
    
    try {
      await recordAnalyticsSession(session.user.id, {
        sessionId: sessionIdRef.current,
        interactionCount: interactionCountRef.current,
        responseTime: sessionDuration / 1000, // in seconds
        courseId,
        chapterId,
        sectionId,
      });
      
      // Reset for new session
      sessionIdRef.current = uuidv4();
      sessionStartRef.current = new Date();
      interactionCountRef.current = 0;
    } catch (error: any) {
      logger.error('Error recording analytics session:', error);
    }
  }, [session?.user?.id, courseId, chapterId, sectionId]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // End session after 30 minutes of inactivity
    inactivityTimerRef.current = setTimeout(() => {
      endAnalyticsSession();
    }, 30 * 60 * 1000);
  }, [endAnalyticsSession]);
  
  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause tracking
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      } else {
        // Page is visible, resume tracking
        lastActivityRef.current = new Date();
        resetInactivityTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetInactivityTimer]);

  // Track user activity
  useEffect(() => {
    const trackActivity = () => {
      lastActivityRef.current = new Date();
      resetInactivityTimer();
    };

    // Track various user activities
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, trackActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, [resetInactivityTimer]);

  // Track interactions
  useEffect(() => {
    const originalTrackInteraction = trackInteraction;
    
    // Wrap trackInteraction to count interactions
    const wrappedTrackInteraction = (type: string, data: any) => {
      interactionCountRef.current++;
      lastActivityRef.current = new Date();
      resetInactivityTimer();
      
      // Call original function
      return originalTrackInteraction(type, data);
    };

    // Override the function (this is a simplified approach)
    // In production, you'd want to use a more robust method
    (window as any).__samTrackInteraction = wrappedTrackInteraction;

    return () => {
      delete (window as any).__samTrackInteraction;
    };
  }, [trackInteraction, resetInactivityTimer]);

  // End session on unmount or navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      endAnalyticsSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endAnalyticsSession();
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [endAnalyticsSession]);

  // Track page-specific metrics
  useEffect(() => {
    if (!session?.user?.id) return;

    const trackPageMetrics = () => {
      // Track time spent on page
      const timeOnPage = new Date().getTime() - sessionStartRef.current.getTime();
      
      // Track scroll depth
      const scrollDepth = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      
      // Track form completion (if applicable)
      const forms = document.querySelectorAll('form');
      const completedForms = Array.from(forms).filter(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        return Array.from(inputs).every(input => 
          (input as HTMLInputElement).value !== ''
        );
      }).length;

      // Send metrics
      trackInteraction('page_metrics', {
        timeOnPage: Math.round(timeOnPage / 1000),
        scrollDepth: Math.round(scrollDepth * 100),
        completedForms,
        courseId,
        chapterId,
        sectionId,
      });
    };

    // Track metrics every 5 minutes
    const metricsInterval = setInterval(trackPageMetrics, 5 * 60 * 1000);

    return () => {
      clearInterval(metricsInterval);
    };
  }, [session?.user?.id, courseId, chapterId, sectionId, trackInteraction]);

  // This component doesn't render anything
  return null;
}

// Hook to manually track custom analytics events
export function useAnalyticsTracking() {
  const { trackInteraction } = useSamAITutor();

  const trackEvent = useCallback((eventName: string, eventData?: any) => {
    trackInteraction(`analytics_${eventName}`, {
      timestamp: new Date().toISOString(),
      ...eventData,
    });
  }, [trackInteraction]);

  const trackTiming = useCallback((category: string, variable: string, time: number) => {
    trackInteraction('analytics_timing', {
      category,
      variable,
      time,
      timestamp: new Date().toISOString(),
    });
  }, [trackInteraction]);

  const trackError = useCallback((error: Error, context?: any) => {
    trackInteraction('analytics_error', {
      error: {
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    });
  }, [trackInteraction]);

  return {
    trackEvent,
    trackTiming,
    trackError,
  };
}