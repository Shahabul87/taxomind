/**
 * @sam-ai/react - usePushNotifications Hook
 * React hook for managing browser push notifications
 */
'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
}
function subscriptionToJSON(sub) {
    const json = sub.toJSON();
    return {
        endpoint: json.endpoint || '',
        keys: {
            p256dh: json.keys?.p256dh || '',
            auth: json.keys?.auth || '',
        },
    };
}
// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================
const DEFAULT_OPTIONS = {
    serviceWorkerPath: '/sw.js',
    autoRequest: false,
    autoRequestOnMount: false,
    applicationServerKey: undefined,
};
// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================
export function usePushNotifications(options = {}) {
    const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only recompute when specific options change
    [
        options.serviceWorkerPath,
        options.vapidPublicKey,
        options.applicationServerKey,
        options.autoRequestOnMount,
        options.onPermissionChange,
        options.onSubscribe,
        options.onUnsubscribe,
    ]);
    // State
    const [permission, setPermission] = useState('default');
    const [subscription, setSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // Refs
    const swRegistrationRef = useRef(null);
    // Check if supported
    const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    // Initialize
    useEffect(() => {
        if (!isSupported) {
            setPermission('unsupported');
            return;
        }
        // Get current permission
        const currentPermission = Notification.permission;
        setPermission(currentPermission);
        // Register service worker and get existing subscription
        const init = async () => {
            try {
                const registration = await navigator.serviceWorker.register(opts.serviceWorkerPath);
                swRegistrationRef.current = registration;
                // Get existing subscription
                const existingSub = await registration.pushManager.getSubscription();
                if (existingSub) {
                    const subJSON = subscriptionToJSON(existingSub);
                    setSubscription(subJSON);
                    opts.onSubscriptionChange?.(subJSON);
                }
                // Auto-request if enabled
                if (opts.autoRequest && currentPermission === 'default') {
                    requestPermission();
                }
            }
            catch (error) {
                console.error('[usePushNotifications] Service worker registration failed:', error);
                opts.onError?.(error instanceof Error ? error : new Error('Service worker registration failed'));
            }
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run once on mount when supported
    }, [isSupported]);
    // Request permission
    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            return 'unsupported';
        }
        try {
            const result = await Notification.requestPermission();
            const state = result;
            setPermission(state);
            opts.onPermissionChange?.(state);
            return state;
        }
        catch (error) {
            opts.onError?.(error instanceof Error ? error : new Error('Permission request failed'));
            return 'denied';
        }
    }, [isSupported, opts]);
    // Subscribe to push
    const subscribe = useCallback(async () => {
        if (!isSupported || !swRegistrationRef.current) {
            return null;
        }
        if (permission !== 'granted') {
            const newPermission = await requestPermission();
            if (newPermission !== 'granted') {
                return null;
            }
        }
        setIsLoading(true);
        try {
            const subscribeOptions = {
                userVisibleOnly: true,
            };
            if (opts.vapidPublicKey) {
                subscribeOptions.applicationServerKey = urlBase64ToUint8Array(opts.vapidPublicKey);
            }
            const pushSubscription = await swRegistrationRef.current.pushManager.subscribe(subscribeOptions);
            const subJSON = subscriptionToJSON(pushSubscription);
            setSubscription(subJSON);
            opts.onSubscriptionChange?.(subJSON);
            return subJSON;
        }
        catch (error) {
            console.error('[usePushNotifications] Subscribe failed:', error);
            opts.onError?.(error instanceof Error ? error : new Error('Subscribe failed'));
            return null;
        }
        finally {
            setIsLoading(false);
        }
    }, [isSupported, permission, requestPermission, opts]);
    // Unsubscribe
    const unsubscribe = useCallback(async () => {
        if (!isSupported || !swRegistrationRef.current) {
            return false;
        }
        setIsLoading(true);
        try {
            const existingSub = await swRegistrationRef.current.pushManager.getSubscription();
            if (existingSub) {
                await existingSub.unsubscribe();
            }
            setSubscription(null);
            opts.onSubscriptionChange?.(null);
            return true;
        }
        catch (error) {
            console.error('[usePushNotifications] Unsubscribe failed:', error);
            opts.onError?.(error instanceof Error ? error : new Error('Unsubscribe failed'));
            return false;
        }
        finally {
            setIsLoading(false);
        }
    }, [isSupported, opts]);
    // Show notification
    const showNotification = useCallback(async (notificationOptions) => {
        if (!isSupported || permission !== 'granted') {
            return null;
        }
        try {
            // Use service worker for notification if available
            if (swRegistrationRef.current) {
                // ServiceWorker notifications support additional options like actions
                const swOptions = {
                    body: notificationOptions.body,
                    icon: notificationOptions.icon,
                    badge: notificationOptions.badge,
                    tag: notificationOptions.tag,
                    requireInteraction: notificationOptions.requireInteraction,
                    silent: notificationOptions.silent,
                    data: notificationOptions.data,
                };
                if (notificationOptions.actions) {
                    swOptions.actions = notificationOptions.actions;
                }
                await swRegistrationRef.current.showNotification(notificationOptions.title, swOptions);
                return null; // ServiceWorker notifications don't return a Notification object
            }
            // Fallback to regular Notification API
            const notification = new Notification(notificationOptions.title, {
                body: notificationOptions.body,
                icon: notificationOptions.icon,
                badge: notificationOptions.badge,
                tag: notificationOptions.tag,
                requireInteraction: notificationOptions.requireInteraction,
                silent: notificationOptions.silent,
                data: notificationOptions.data,
            });
            notification.onclick = () => {
                opts.onNotificationClick?.(notification);
            };
            notification.onclose = () => {
                opts.onNotificationClose?.(notification);
            };
            return notification;
        }
        catch (error) {
            console.error('[usePushNotifications] Show notification failed:', error);
            opts.onError?.(error instanceof Error ? error : new Error('Show notification failed'));
            return null;
        }
    }, [isSupported, permission, opts]);
    // Check if notification is visible
    const isNotificationVisible = useCallback(async (tag) => {
        if (!swRegistrationRef.current) {
            return false;
        }
        const notifications = await swRegistrationRef.current.getNotifications({ tag });
        return notifications.length > 0;
    }, []);
    // Close notification
    const closeNotification = useCallback(async (tag) => {
        if (!swRegistrationRef.current) {
            return;
        }
        const notifications = await swRegistrationRef.current.getNotifications({ tag });
        notifications.forEach((notification) => notification.close());
    }, []);
    // Register with server
    const registerWithServer = useCallback(async (serverEndpoint, userId) => {
        if (!subscription) {
            return false;
        }
        setIsLoading(true);
        try {
            const response = await fetch(serverEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    subscription,
                }),
            });
            if (!response.ok) {
                throw new Error(`Server registration failed: ${response.status}`);
            }
            return true;
        }
        catch (error) {
            console.error('[usePushNotifications] Server registration failed:', error);
            opts.onError?.(error instanceof Error ? error : new Error('Server registration failed'));
            return false;
        }
        finally {
            setIsLoading(false);
        }
    }, [subscription, opts]);
    return {
        permission,
        isSupported,
        isEnabled: isSupported && permission === 'granted' && subscription !== null,
        subscription,
        isLoading,
        requestPermission,
        subscribe,
        unsubscribe,
        showNotification,
        isNotificationVisible,
        closeNotification,
        registerWithServer,
    };
}
export default usePushNotifications;
