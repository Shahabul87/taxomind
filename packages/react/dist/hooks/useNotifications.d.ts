/**
 * @sam-ai/react - useNotifications Hook
 * Hook for managing SAM notifications
 */
export type NotificationType = 'SAM_CHECK_IN' | 'SAM_INTERVENTION' | 'SAM_MILESTONE' | 'SAM_RECOMMENDATION';
export type NotificationFeedback = 'helpful' | 'not_helpful' | 'too_frequent' | 'irrelevant';
export interface SAMNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
    link?: string;
}
export interface UseNotificationsOptions {
    /** Filter by notification type */
    type?: NotificationType;
    /** Only fetch unread notifications */
    unreadOnly?: boolean;
    /** Max notifications to fetch */
    limit?: number;
    /** Enable auto-refresh interval (ms) */
    refreshInterval?: number;
    /** Disable auto-fetch on mount */
    disabled?: boolean;
}
export interface UseNotificationsReturn {
    /** List of notifications */
    notifications: SAMNotification[];
    /** Total notification count */
    total: number;
    /** Unread notification count */
    unreadCount: number;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: Error | null;
    /** Refresh notifications */
    refresh: () => Promise<void>;
    /** Mark notifications as read */
    markAsRead: (notificationIds: string[]) => Promise<void>;
    /** Dismiss notification with optional feedback */
    dismiss: (notificationId: string, feedback?: NotificationFeedback) => Promise<void>;
    /** Clear all read notifications */
    clearRead: () => Promise<void>;
    /** Load more notifications */
    loadMore: () => Promise<void>;
    /** Whether more notifications are available */
    hasMore: boolean;
}
export declare function useNotifications(options?: UseNotificationsOptions): UseNotificationsReturn;
//# sourceMappingURL=useNotifications.d.ts.map