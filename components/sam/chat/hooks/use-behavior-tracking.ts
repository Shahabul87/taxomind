import { useCallback, useEffect, useRef } from 'react';
import type { PageContext, EntityContextState } from '../types';

type BehaviorEventType =
  | 'session_start'
  | 'session_end'
  | 'page_view'
  | 'content_interaction'
  | 'help_requested'
  | 'frustration_signal';

interface UseBehaviorTrackingOptions {
  userId?: string;
  isOpen: boolean;
  pathname?: string | null;
  pageContext: PageContext;
  entityContext: EntityContextState;
  messageCount: number;
}

interface UseBehaviorTrackingReturn {
  trackEvent: (
    type: BehaviorEventType,
    data?: Record<string, unknown>
  ) => Promise<void>;
}

export function useBehaviorTracking(
  options: UseBehaviorTrackingOptions
): UseBehaviorTrackingReturn {
  const { userId, isOpen, pathname, pageContext, entityContext, messageCount } = options;

  const sessionStartTimeRef = useRef<number | null>(null);

  // Refs for stable access in effects without triggering re-runs
  const trackEventRef = useRef<(
    type: BehaviorEventType,
    data?: Record<string, unknown>
  ) => Promise<void>>();
  const messageCountRef = useRef(messageCount);
  messageCountRef.current = messageCount;
  const pageContextRef = useRef(pageContext);
  pageContextRef.current = pageContext;

  const trackEvent = useCallback(
    async (
      type: BehaviorEventType,
      data?: Record<string, unknown>
    ) => {
      if (!userId) return;

      try {
        await fetch('/api/sam/agentic/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            data: {
              ...data,
              sessionDuration: sessionStartTimeRef.current
                ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
                : undefined,
            },
            timestamp: new Date().toISOString(),
            pageContext: {
              type: pageContext.pageType,
              path: pageContext.path,
              entityId: pageContext.entityId,
              entityType: entityContext.entityType,
            },
          }),
        });
      } catch (error) {
        console.error('[SAM] Failed to track behavior event:', error);
      }
    },
    [userId, pageContext, entityContext.entityType]
  );
  trackEventRef.current = trackEvent;

  // Track session start/end when SAM panel opens/closes
  useEffect(() => {
    if (!userId) return;

    if (isOpen) {
      sessionStartTimeRef.current = Date.now();
      trackEventRef.current?.('session_start', {
        source: 'sam_panel_open',
        pageName: pageContextRef.current.pageName,
      });
    } else if (sessionStartTimeRef.current) {
      trackEventRef.current?.('session_end', {
        source: 'sam_panel_close',
        pageName: pageContextRef.current.pageName,
        messageCount: messageCountRef.current,
      });
      sessionStartTimeRef.current = null;
    }
  }, [isOpen, userId]);

  // Track page navigation while SAM is open
  useEffect(() => {
    if (!isOpen || !userId) return;

    trackEventRef.current?.('page_view', {
      pageName: pageContextRef.current.pageName,
      pageType: pageContextRef.current.pageType,
      entityId: pageContextRef.current.entityId,
    });
  }, [pathname, isOpen, userId]);

  return { trackEvent };
}
