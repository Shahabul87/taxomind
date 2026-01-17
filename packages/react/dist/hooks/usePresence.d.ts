/**
 * @sam-ai/react - usePresence Hook
 * React hook for tracking user presence and activity state
 */
import type { PresenceStatus, UserPresence, PresenceMetadata, ActivityPayload } from '@sam-ai/agentic';
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
export declare function usePresence(options: UsePresenceOptions): UsePresenceReturn;
export default usePresence;
//# sourceMappingURL=usePresence.d.ts.map