/**
 * @sam-ai/react - usePushNotifications Hook
 * React hook for managing browser push notifications
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

function subscriptionToJSON(sub: globalThis.PushSubscription): PushSubscription {
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

const DEFAULT_OPTIONS: Required<
  Omit<
    UsePushNotificationsOptions,
    'vapidPublicKey' | 'onPermissionChange' | 'onSubscriptionChange' | 'onNotificationClick' | 'onNotificationClose' | 'onError' | 'onSubscribe' | 'onUnsubscribe'
  >
> = {
  serviceWorkerPath: '/sw.js',
  autoRequest: false,
  autoRequestOnMount: false,
  applicationServerKey: undefined as unknown as string,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePushNotifications(options: UsePushNotificationsOptions = {}): UsePushNotificationsReturn {
  // Store callback options in refs so they don't trigger re-memo or re-render cycles
  const onPermissionChangeRef = useRef(options.onPermissionChange);
  onPermissionChangeRef.current = options.onPermissionChange;
  const onSubscriptionChangeRef = useRef(options.onSubscriptionChange);
  onSubscriptionChangeRef.current = options.onSubscriptionChange;
  const onSubscribeRef = useRef(options.onSubscribe);
  onSubscribeRef.current = options.onSubscribe;
  const onUnsubscribeRef = useRef(options.onUnsubscribe);
  onUnsubscribeRef.current = options.onUnsubscribe;
  const onNotificationClickRef = useRef(options.onNotificationClick);
  onNotificationClickRef.current = options.onNotificationClick;
  const onNotificationCloseRef = useRef(options.onNotificationClose);
  onNotificationCloseRef.current = options.onNotificationClose;
  const onErrorRef = useRef(options.onError);
  onErrorRef.current = options.onError;

  // Destructure primitives for stable useMemo deps
  const {
    serviceWorkerPath,
    vapidPublicKey,
    applicationServerKey,
    autoRequestOnMount,
    autoRequest,
  } = options;

  // Only recompute when primitive configuration options change
  const opts = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      serviceWorkerPath,
      vapidPublicKey,
      applicationServerKey,
      autoRequestOnMount,
      autoRequest,
    }),
    [
      serviceWorkerPath,
      vapidPublicKey,
      applicationServerKey,
      autoRequestOnMount,
      autoRequest,
    ]
  );

  // State
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Check if supported
  const isSupported =
    typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  // Request permission
  const requestPermission = useCallback(async (): Promise<PushPermissionState> => {
    if (!isSupported) {
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      const state = result as PushPermissionState;
      setPermission(state);
      onPermissionChangeRef.current?.(state);
      return state;
    } catch (error) {
      onErrorRef.current?.(error instanceof Error ? error : new Error('Permission request failed'));
      return 'denied';
    }
  }, [isSupported]);

  // Ref for requestPermission so the init effect can call the latest version
  const requestPermissionRef = useRef(requestPermission);
  requestPermissionRef.current = requestPermission;

  // Initialize
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }

    // Get current permission
    const currentPermission = Notification.permission as PushPermissionState;
    setPermission(currentPermission);

    // Register service worker and get existing subscription
    const init = async () => {
      try {
        const registration = await navigator.serviceWorker.register(opts.serviceWorkerPath || '/sw.js');
        swRegistrationRef.current = registration;

        // Get existing subscription
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          const subJSON = subscriptionToJSON(existingSub);
          setSubscription(subJSON);
          onSubscriptionChangeRef.current?.(subJSON);
        }

        // Auto-request if enabled
        if (opts.autoRequest && currentPermission === 'default') {
          requestPermissionRef.current();
        }
      } catch (error) {
        console.error('[usePushNotifications] Service worker registration failed:', error);
        onErrorRef.current?.(error instanceof Error ? error : new Error('Service worker registration failed'));
      }
    };

    init();
  }, [isSupported, opts.serviceWorkerPath, opts.autoRequest]);

  // Subscribe to push
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
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
      const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };

      if (opts.vapidPublicKey) {
        subscribeOptions.applicationServerKey = urlBase64ToUint8Array(opts.vapidPublicKey);
      }

      const pushSubscription = await swRegistrationRef.current.pushManager.subscribe(subscribeOptions);
      const subJSON = subscriptionToJSON(pushSubscription);
      setSubscription(subJSON);
      onSubscriptionChangeRef.current?.(subJSON);
      return subJSON;
    } catch (error) {
      console.error('[usePushNotifications] Subscribe failed:', error);
      onErrorRef.current?.(error instanceof Error ? error : new Error('Subscribe failed'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission, opts.vapidPublicKey]);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
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
      onSubscriptionChangeRef.current?.(null);
      return true;
    } catch (error) {
      console.error('[usePushNotifications] Unsubscribe failed:', error);
      onErrorRef.current?.(error instanceof Error ? error : new Error('Unsubscribe failed'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Show notification
  const showNotification = useCallback(
    async (notificationOptions: PushNotificationOptions): Promise<Notification | null> => {
      if (!isSupported || permission !== 'granted') {
        return null;
      }

      try {
        // Use service worker for notification if available
        if (swRegistrationRef.current) {
          // ServiceWorker notifications support additional options like actions
          const swOptions: NotificationOptions & { actions?: Array<{ action: string; title: string; icon?: string }> } = {
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
          onNotificationClickRef.current?.(notification);
        };

        notification.onclose = () => {
          onNotificationCloseRef.current?.(notification);
        };

        return notification;
      } catch (error) {
        console.error('[usePushNotifications] Show notification failed:', error);
        onErrorRef.current?.(error instanceof Error ? error : new Error('Show notification failed'));
        return null;
      }
    },
    [isSupported, permission]
  );

  // Check if notification is visible
  const isNotificationVisible = useCallback(
    async (tag: string): Promise<boolean> => {
      if (!swRegistrationRef.current) {
        return false;
      }

      const notifications = await swRegistrationRef.current.getNotifications({ tag });
      return notifications.length > 0;
    },
    []
  );

  // Close notification
  const closeNotification = useCallback(async (tag: string): Promise<void> => {
    if (!swRegistrationRef.current) {
      return;
    }

    const notifications = await swRegistrationRef.current.getNotifications({ tag });
    notifications.forEach((notification) => notification.close());
  }, []);

  // Register with server
  const registerWithServer = useCallback(
    async (serverEndpoint: string, userId: string): Promise<boolean> => {
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
      } catch (error) {
        console.error('[usePushNotifications] Server registration failed:', error);
        onErrorRef.current?.(error instanceof Error ? error : new Error('Server registration failed'));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [subscription]
  );

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
