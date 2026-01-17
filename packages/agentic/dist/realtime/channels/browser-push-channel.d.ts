/**
 * @sam-ai/agentic - Browser Push Delivery Channel
 * Delivers notifications via Web Push API for browser notifications
 */
import type { SAMWebSocketEvent, DeliveryChannel, RealtimeLogger } from '../types';
import type { DeliveryHandler } from '../push-dispatcher';
export interface BrowserPushChannelConfig {
    /** Web Push service adapter */
    pushService: WebPushServiceAdapter;
    /** Get user's push subscription */
    getUserSubscription: (userId: string) => Promise<PushSubscriptionData | null>;
    /** VAPID public key */
    vapidPublicKey: string;
    /** VAPID private key */
    vapidPrivateKey: string;
    /** VAPID subject (mailto or URL) */
    vapidSubject: string;
    /** Enable push notifications (default: true) */
    enabled?: boolean;
    /** TTL in seconds for push messages (default: 86400 = 24h) */
    ttl?: number;
    /** Logger */
    logger?: RealtimeLogger;
}
export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    expirationTime?: number | null;
}
export interface WebPushServiceAdapter {
    sendNotification(subscription: PushSubscriptionData, payload: string, options?: {
        vapidDetails?: {
            subject: string;
            publicKey: string;
            privateKey: string;
        };
        ttl?: number;
        urgency?: 'very-low' | 'low' | 'normal' | 'high';
        topic?: string;
    }): Promise<{
        statusCode: number;
        body?: string;
    }>;
}
export interface PushNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    data?: Record<string, unknown>;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
    requireInteraction?: boolean;
    renotify?: boolean;
    silent?: boolean;
    vibrate?: number[];
}
export declare class BrowserPushChannel implements DeliveryHandler {
    readonly channel: DeliveryChannel;
    private readonly config;
    private readonly logger;
    constructor(config: BrowserPushChannelConfig);
    canDeliver(userId: string): Promise<boolean>;
    deliver(userId: string, event: SAMWebSocketEvent): Promise<boolean>;
}
export declare function createBrowserPushChannel(config: BrowserPushChannelConfig): BrowserPushChannel;
//# sourceMappingURL=browser-push-channel.d.ts.map