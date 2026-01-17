/**
 * @sam-ai/agentic - Email Delivery Channel
 * Delivers notifications via email for offline users
 */
import type { SAMWebSocketEvent, DeliveryChannel, RealtimeLogger } from '../types';
import type { DeliveryHandler } from '../push-dispatcher';
export interface EmailChannelConfig {
    /** Email service adapter */
    emailService: EmailServiceAdapter;
    /** User email lookup function */
    getUserEmail: (userId: string) => Promise<string | null>;
    /** User notification preferences lookup */
    getUserPreferences?: (userId: string) => Promise<EmailPreferences | null>;
    /** From email address */
    fromEmail: string;
    /** From name */
    fromName?: string;
    /** Enable email notifications (default: true) */
    enabled?: boolean;
    /** Throttle settings */
    throttle?: {
        /** Max emails per user per hour */
        maxPerHour?: number;
        /** Max emails per user per day */
        maxPerDay?: number;
    };
    /** Logger */
    logger?: RealtimeLogger;
}
export interface EmailPreferences {
    /** Email notifications enabled */
    enabled: boolean;
    /** Types of notifications to receive */
    types: string[];
    /** Quiet hours (24h format) */
    quietHours?: {
        start: number;
        end: number;
        timezone: string;
    };
    /** Digest preferences */
    digest?: {
        enabled: boolean;
        frequency: 'daily' | 'weekly';
        time: string;
    };
}
export interface EmailServiceAdapter {
    send(options: {
        to: string;
        from: string;
        fromName?: string;
        subject: string;
        html: string;
        text?: string;
        replyTo?: string;
        tags?: string[];
        metadata?: Record<string, unknown>;
    }): Promise<boolean>;
}
export declare class EmailChannel implements DeliveryHandler {
    readonly channel: DeliveryChannel;
    private readonly config;
    private readonly logger;
    private readonly throttleMap;
    constructor(config: EmailChannelConfig);
    canDeliver(userId: string): Promise<boolean>;
    deliver(userId: string, event: SAMWebSocketEvent): Promise<boolean>;
    private checkThrottle;
    private incrementThrottle;
}
export declare function createEmailChannel(config: EmailChannelConfig): EmailChannel;
//# sourceMappingURL=email-channel.d.ts.map