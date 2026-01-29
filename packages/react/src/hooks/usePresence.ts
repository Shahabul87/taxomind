/**
 * @sam-ai/react - usePresence Hook
 * React hook for tracking user presence and activity state
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type {
  PresenceStatus,
  UserPresence,
  PresenceMetadata,
  ActivityPayload,
} from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePresenceOptions {
  /** User ID for presence tracking */
  userId: string;
  /** Session ID for tracking */
  sessionId?: string;
  /** Initial presence status */
  initialStatus?: PresenceStatus;
  /** Auto-track page visibility */
  trackVisibility?: boolean;
  /** Auto-track user activity (mouse, keyboard) */
  trackActivity?: boolean;
  /** Idle timeout in ms (default: 60000 = 1 min) */
  idleTimeout?: number;
  /** Away timeout in ms (default: 300000 = 5 min) */
  awayTimeout?: number;
  /** Activity debounce in ms */
  activityDebounce?: number;
  /** WebSocket send function */
  sendActivity?: (activity: ActivityPayload) => void;
  /** Event handlers */
  onStatusChange?: (status: PresenceStatus, previousStatus: PresenceStatus) => void;
  onIdle?: () => void;
  onAway?: () => void;
  onActive?: () => void;
}

export interface UsePresenceReturn {
  /** Current presence status */
  status: PresenceStatus;
  /** Whether user is currently active */
  isActive: boolean;
  /** Whether user is idle */
  isIdle: boolean;
  /** Whether user is away */
  isAway: boolean;
  /** Whether user is online (active or idle) */
  isOnline: boolean;
  /** Last activity timestamp */
  lastActivityAt: Date | null;
  /** Presence metadata */
  metadata: PresenceMetadata | null;
  /** Manually set status */
  setStatus: (status: PresenceStatus) => void;
  /** Record activity (resets idle timer) */
  recordActivity: (type?: ActivityPayload['type']) => void;
  /** Update presence metadata */
  updateMetadata: (updates: Partial<PresenceMetadata>) => void;
  /** Current presence state */
  presence: UserPresence | null;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_OPTIONS: Required<
  Omit<
    UsePresenceOptions,
    'userId' | 'sendActivity' | 'onStatusChange' | 'onIdle' | 'onAway' | 'onActive'
  >
> = {
  sessionId: undefined as unknown as string,
  initialStatus: 'online',
  trackVisibility: true,
  trackActivity: true,
  idleTimeout: 60000, // 1 minute
  awayTimeout: 300000, // 5 minutes
  activityDebounce: 1000, // 1 second
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePresence(options: UsePresenceOptions): UsePresenceReturn {
  // Store callback-type options in refs so they never appear in dependency arrays.
  // This keeps useMemo/useCallback/useEffect deps limited to stable primitives.
  const onIdleRef = useRef(options.onIdle);
  onIdleRef.current = options.onIdle;
  const onAwayRef = useRef(options.onAway);
  onAwayRef.current = options.onAway;
  const onActiveRef = useRef(options.onActive);
  onActiveRef.current = options.onActive;
  const sendActivityRef = useRef(options.sendActivity);
  sendActivityRef.current = options.sendActivity;
  const onStatusChangeRef = useRef(options.onStatusChange);
  onStatusChangeRef.current = options.onStatusChange;

  const opts = useMemo(
    () => ({
      userId: options.userId,
      sessionId: options.sessionId ?? DEFAULT_OPTIONS.sessionId,
      initialStatus: options.initialStatus ?? DEFAULT_OPTIONS.initialStatus,
      trackVisibility: options.trackVisibility ?? DEFAULT_OPTIONS.trackVisibility,
      trackActivity: options.trackActivity ?? DEFAULT_OPTIONS.trackActivity,
      idleTimeout: options.idleTimeout ?? DEFAULT_OPTIONS.idleTimeout,
      awayTimeout: options.awayTimeout ?? DEFAULT_OPTIONS.awayTimeout,
      activityDebounce: options.activityDebounce ?? DEFAULT_OPTIONS.activityDebounce,
    }),
    [
      options.userId,
      options.sessionId,
      options.idleTimeout,
      options.awayTimeout,
      options.trackActivity,
      options.trackVisibility,
      options.initialStatus,
      options.activityDebounce,
    ]
  );

  // State
  const [status, setStatusState] = useState<PresenceStatus>(opts.initialStatus);
  const [lastActivityAt, setLastActivityAt] = useState<Date | null>(new Date());
  const [metadata, setMetadata] = useState<PresenceMetadata | null>(() => ({
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOS(),
  }));

  // Refs
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<PresenceStatus>(opts.initialStatus);

  // Detect device type
  function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // Detect browser
  function detectBrowser(): string {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'unknown';
  }

  // Detect OS
  function detectOS(): string {
    if (typeof window === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
    return 'unknown';
  }

  // Clear timers
  const clearTimers = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
      awayTimeoutRef.current = null;
    }
  }, []);

  // Reset timers on activity
  const resetTimers = useCallback(() => {
    clearTimers();

    // Set idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      if (previousStatusRef.current === 'online' || previousStatusRef.current === 'studying') {
        setStatusState('idle');
        onIdleRef.current?.();
      }
    }, opts.idleTimeout);

    // Set away timeout
    awayTimeoutRef.current = setTimeout(() => {
      if (previousStatusRef.current !== 'offline' && previousStatusRef.current !== 'do_not_disturb') {
        setStatusState('away');
        onAwayRef.current?.();
      }
    }, opts.awayTimeout);
  }, [clearTimers, opts.idleTimeout, opts.awayTimeout]);

  // Set status with callback
  const setStatus = useCallback(
    (newStatus: PresenceStatus) => {
      const prevStatus = previousStatusRef.current;
      if (newStatus !== prevStatus) {
        previousStatusRef.current = newStatus;
        setStatusState(newStatus);
        onStatusChangeRef.current?.(newStatus, prevStatus);

        // Send status update
        sendActivityRef.current?.({
          type: 'interaction',
          data: { statusChange: { from: prevStatus, to: newStatus } },
        });
      }
    },
    []
  );

  // Record activity
  const statusRef = useRef(status);
  statusRef.current = status;

  const recordActivity = useCallback(
    (type: ActivityPayload['type'] = 'interaction') => {
      // Debounce activity recording
      if (activityDebounceRef.current) {
        return;
      }

      activityDebounceRef.current = setTimeout(() => {
        activityDebounceRef.current = null;
      }, opts.activityDebounce);

      // Update last activity
      setLastActivityAt(new Date());

      // Reset to active if was idle/away
      if (statusRef.current === 'idle' || statusRef.current === 'away') {
        setStatus('online');
        onActiveRef.current?.();
      }

      // Reset timers
      resetTimers();

      // Send activity event
      sendActivityRef.current?.({
        type,
        data: { timestamp: new Date().toISOString() },
        pageContext: typeof window !== 'undefined' ? { url: window.location.href } : undefined,
      });
    },
    [opts.activityDebounce, setStatus, resetTimers]
  );

  // Update metadata
  const updateMetadata = useCallback((updates: Partial<PresenceMetadata>) => {
    setMetadata((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  // Track page visibility
  useEffect(() => {
    if (!opts.trackVisibility || typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recordActivity('focus');
      } else {
        sendActivityRef.current?.({
          type: 'blur',
          data: { timestamp: new Date().toISOString() },
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [opts.trackVisibility, recordActivity]);

  // Track user activity (mouse, keyboard, scroll)
  useEffect(() => {
    if (!opts.trackActivity || typeof window === 'undefined') return;

    const handleActivity = () => {
      recordActivity('interaction');
    };

    const handleScroll = () => {
      recordActivity('scroll');
    };

    // Use passive listeners for performance
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('mousedown', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial timer setup
    resetTimers();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('scroll', handleScroll);
      clearTimers();
      if (activityDebounceRef.current) {
        clearTimeout(activityDebounceRef.current);
      }
    };
  }, [opts.trackActivity, recordActivity, resetTimers, clearTimers]);

  // Build presence object
  const presence: UserPresence | null =
    opts.userId && metadata
      ? {
          userId: opts.userId,
          connectionId: '', // Set by WebSocket connection
          status,
          lastActivityAt: lastActivityAt || new Date(),
          connectedAt: new Date(), // Set by WebSocket connection
          metadata,
          subscriptions: [],
        }
      : null;

  return {
    status,
    isActive: status === 'online' || status === 'studying',
    isIdle: status === 'idle',
    isAway: status === 'away',
    isOnline: status !== 'offline',
    lastActivityAt,
    metadata,
    setStatus,
    recordActivity,
    updateMetadata,
    presence,
  };
}

export default usePresence;
