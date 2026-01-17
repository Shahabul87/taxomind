/**
 * @sam-ai/react - usePushNotifications Hook
 * React hook for managing browser push notifications
 */
export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';
export interface PushSubscription {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}
export interface PushNotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    data?: Record<string, unknown>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
}
export interface UsePushNotificationsOptions {
    /** VAPID public key for push subscription */
    vapidPublicKey?: string;
    /** Application server key (alias for vapidPublicKey for Web Push API) */
    applicationServerKey?: string;
    /** Service worker path (default: /sw.js) */
    serviceWorkerPath?: string;
    /** Auto-request permission on mount */
    autoRequest?: boolean;
    /** Auto-request permission when component mounts */
    autoRequestOnMount?: boolean;
    /** Callback when permission changes */
    onPermissionChange?: (state: PushPermissionState) => void;
    /** Callback when subscription changes */
    onSubscriptionChange?: (subscription: PushSubscription | null) => void;
    /** Callback when successfully subscribed */
    onSubscribe?: (subscription: PushSubscription) => void;
    /** Callback when unsubscribed */
    onUnsubscribe?: () => void;
    /** Callback when notification is clicked */
    onNotificationClick?: (notification: Notification, action?: string) => void;
    /** Callback when notification is closed */
    onNotificationClose?: (notification: Notification) => void;
    /** Callback for notification errors */
    onError?: (error: Error) => void;
}
export interface UsePushNotificationsReturn {
    /** Current permission state */
    permission: PushPermissionState;
    /** Whether push is supported */
    isSupported: boolean;
    /** Whether push is enabled (permission granted and subscribed) */
    isEnabled: boolean;
    /** Current subscription */
    subscription: PushSubscription | null;
    /** Loading state */
    isLoading: boolean;
    /** Request notification permission */
    requestPermission: () => Promise<PushPermissionState>;
    /** Subscribe to push notifications */
    subscribe: () => Promise<PushSubscription | null>;
    /** Unsubscribe from push notifications */
    unsubscribe: () => Promise<boolean>;
    /** Show a local notification */
    showNotification: (options: PushNotificationOptions) => Promise<Notification | null>;
    /** Check if notification is visible */
    isNotificationVisible: (tag: string) => Promise<boolean>;
    /** Close notification by tag */
    closeNotification: (tag: string) => Promise<void>;
    /** Register subscription with server */
    registerWithServer: (serverEndpoint: string, userId: string) => Promise<boolean>;
}
export declare function usePushNotifications(options?: UsePushNotificationsOptions): UsePushNotificationsReturn;
export default usePushNotifications;
//# sourceMappingURL=usePushNotifications.d.ts.map