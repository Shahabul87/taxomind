/**
 * @sam-ai/realtime
 * Real-time WebSocket server and presence management for SAM AI Mentor
 *
 * This package provides:
 * - Presence Management: Track user online status and activity
 * - Event Dispatcher: Real-time event pub/sub system
 * - Notification System: Push notifications to connected users
 * - Channel Management: Topic-based message routing
 */
export * from './types';
export { InMemoryPresenceStore, InMemoryNotificationStore, createInMemoryPresenceStore, createInMemoryNotificationStore, } from './stores';
export { PresenceManager, createPresenceManager, } from './presence-manager';
export { EventDispatcher, createEventDispatcher, type EventHandler, type DeliveryResult, type EventDispatcherStats, } from './event-dispatcher';
export declare const PACKAGE_NAME = "@sam-ai/realtime";
export declare const PACKAGE_VERSION = "0.1.0";
/**
 * Package capabilities
 */
export declare const REALTIME_CAPABILITIES: {
    readonly PRESENCE: "realtime:presence";
    readonly EVENTS: "realtime:events";
    readonly NOTIFICATIONS: "realtime:notifications";
    readonly CHANNELS: "realtime:channels";
};
export type RealtimeCapability = (typeof REALTIME_CAPABILITIES)[keyof typeof REALTIME_CAPABILITIES];
/**
 * Check if a capability is available
 */
export declare function hasCapability(capability: RealtimeCapability): boolean;
import { PresenceManager } from './presence-manager';
import { EventDispatcher } from './event-dispatcher';
import type { PresenceStore, NotificationStore, RealtimeLogger, PresenceManagerConfig, NotificationDispatcherConfig } from './types';
/**
 * Configuration for creating the full realtime system
 */
export interface RealtimeSystemConfig {
    logger?: RealtimeLogger;
    presenceStore?: PresenceStore;
    notificationStore?: NotificationStore;
    presence?: Omit<PresenceManagerConfig, 'store' | 'logger'>;
    dispatcher?: Omit<NotificationDispatcherConfig, 'store' | 'logger'>;
}
/**
 * Complete realtime system with all components
 */
export interface RealtimeSystem {
    presence: PresenceManager;
    dispatcher: EventDispatcher;
}
/**
 * Create a complete realtime system with all components configured
 */
export declare function createRealtimeSystem(config?: RealtimeSystemConfig): RealtimeSystem;
//# sourceMappingURL=index.d.ts.map