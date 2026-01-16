'use client';

/**
 * PresenceTrackingProvider
 *
 * Wrapper component that integrates the usePresence hook from @sam-ai/react
 * to track user presence and activity across learning pages.
 *
 * Features:
 * - Automatic activity detection (mouse, keyboard, scroll, visibility)
 * - Status transitions (online -> idle -> away)
 * - Context-aware presence (tracks current course/section)
 * - API sync for ActiveLearnersWidget consumption
 *
 * Usage:
 * ```tsx
 * <PresenceTrackingProvider
 *   courseId="course-123"
 *   chapterId="chapter-456"
 * >
 *   <YourLearningContent />
 * </PresenceTrackingProvider>
 * ```
 */

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import { usePresence, type UsePresenceReturn } from '@sam-ai/react';
import type { PresenceStatus, ActivityPayload } from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

interface PresenceTrackingContextValue extends UsePresenceReturn {
  /** Update presence location context */
  updateLocation: (location: PresenceLocation) => void;
  /** Set studying mode (active learning) */
  setStudying: () => void;
  /** Set break mode */
  setOnBreak: () => void;
  /** Resume normal online status */
  resume: () => void;
}

interface PresenceLocation {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  pageUrl?: string;
}

interface PresenceTrackingProviderProps {
  children: ReactNode;
  /** Course ID for context tracking */
  courseId?: string;
  /** Chapter ID for context tracking */
  chapterId?: string;
  /** Section ID for context tracking */
  sectionId?: string;
  /** Whether to auto-set studying mode on learning pages */
  autoStudyingMode?: boolean;
  /** Idle timeout in ms (default: 60000 = 1 min) */
  idleTimeout?: number;
  /** Away timeout in ms (default: 300000 = 5 min) */
  awayTimeout?: number;
  /** Sync interval in ms (default: 30000 = 30 sec) */
  syncInterval?: number;
}

// ============================================================================
// CONTEXT
// ============================================================================

const PresenceTrackingContext = createContext<PresenceTrackingContextValue | null>(null);

/**
 * Hook to access presence tracking context
 */
export function usePresenceTracking(): PresenceTrackingContextValue {
  const context = useContext(PresenceTrackingContext);
  if (!context) {
    throw new Error('usePresenceTracking must be used within a PresenceTrackingProvider');
  }
  return context;
}

/**
 * Optional version that returns null if not in provider
 */
export function usePresenceTrackingOptional(): PresenceTrackingContextValue | null {
  return useContext(PresenceTrackingContext);
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function PresenceTrackingProvider({
  children,
  courseId,
  chapterId,
  sectionId,
  autoStudyingMode = true,
  idleTimeout = 60000,
  awayTimeout = 300000,
  syncInterval = 30000,
}: PresenceTrackingProviderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date | null>(null);
  const locationRef = useRef<PresenceLocation>({
    courseId,
    chapterId,
    sectionId,
    pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
  });

  // Send activity to API
  const sendActivity = useCallback(async (activity: ActivityPayload) => {
    if (!session?.user?.id) return;

    try {
      // This would typically go through a WebSocket, but we use HTTP for now
      // The activity data is handled by the presence update
    } catch (error) {
      console.error('[PresenceTracking] Failed to send activity:', error);
    }
  }, [session?.user?.id]);

  // Handle status changes
  const handleStatusChange = useCallback(async (
    newStatus: PresenceStatus,
    previousStatus: PresenceStatus
  ) => {
    if (!session?.user?.id) return;

    try {
      await fetch('/api/sam/realtime/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          metadata: {
            location: locationRef.current,
          },
        }),
      });
    } catch (error) {
      console.error('[PresenceTracking] Failed to sync status:', error);
    }
  }, [session?.user?.id]);

  // Initialize presence hook
  const presence = usePresence({
    userId: session?.user?.id ?? '',
    sessionId: session?.user?.id ? `session-${session.user.id}` : undefined,
    initialStatus: autoStudyingMode && courseId ? 'studying' : 'online',
    trackVisibility: true,
    trackActivity: true,
    idleTimeout,
    awayTimeout,
    sendActivity,
    onStatusChange: handleStatusChange,
    onIdle: () => {
      console.debug('[PresenceTracking] User went idle');
    },
    onAway: () => {
      console.debug('[PresenceTracking] User went away');
    },
    onActive: () => {
      console.debug('[PresenceTracking] User became active');
    },
  });

  // Update location context
  const updateLocation = useCallback((location: PresenceLocation) => {
    locationRef.current = {
      ...locationRef.current,
      ...location,
    };

    // Update metadata with new location
    presence.updateMetadata({
      location: locationRef.current,
    });
  }, [presence]);

  // Set studying mode
  const setStudying = useCallback(() => {
    presence.setStatus('studying');
  }, [presence]);

  // Set break mode
  const setOnBreak = useCallback(() => {
    presence.setStatus('on_break');
  }, [presence]);

  // Resume normal online status
  const resume = useCallback(() => {
    presence.setStatus('online');
  }, [presence]);

  // Sync presence to API periodically
  useEffect(() => {
    if (!session?.user?.id || sessionStatus !== 'authenticated') return;

    const syncPresence = async () => {
      const now = new Date();
      if (lastSyncRef.current && now.getTime() - lastSyncRef.current.getTime() < syncInterval / 2) {
        return; // Don't sync too frequently
      }

      try {
        await fetch('/api/sam/realtime/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: presence.status,
            metadata: {
              ...presence.metadata,
              location: locationRef.current,
            },
          }),
        });
        lastSyncRef.current = now;
      } catch (error) {
        console.error('[PresenceTracking] Failed to sync presence:', error);
      }
    };

    // Initial sync
    syncPresence();

    // Set up periodic sync
    syncIntervalRef.current = setInterval(syncPresence, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [session?.user?.id, sessionStatus, presence.status, presence.metadata, syncInterval]);

  // Update location when props change
  useEffect(() => {
    if (courseId || chapterId || sectionId) {
      updateLocation({
        courseId,
        chapterId,
        sectionId,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      });
    }
  }, [courseId, chapterId, sectionId, updateLocation]);

  // Auto-set studying mode when on course pages
  useEffect(() => {
    if (autoStudyingMode && courseId && presence.status === 'online') {
      setStudying();
    }
  }, [autoStudyingMode, courseId, presence.status, setStudying]);

  // Mark as offline when unmounting (user leaves page)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!session?.user?.id) return;

      // Use sendBeacon for reliable delivery during page unload
      const data = JSON.stringify({
        status: 'offline',
        metadata: {
          location: locationRef.current,
        },
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/sam/realtime/presence', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session?.user?.id]);

  // Don't render until we have a session
  if (sessionStatus === 'loading' || !session?.user?.id) {
    return <>{children}</>;
  }

  const contextValue: PresenceTrackingContextValue = {
    ...presence,
    updateLocation,
    setStudying,
    setOnBreak,
    resume,
  };

  return (
    <PresenceTrackingContext.Provider value={contextValue}>
      {children}
    </PresenceTrackingContext.Provider>
  );
}

export default PresenceTrackingProvider;
