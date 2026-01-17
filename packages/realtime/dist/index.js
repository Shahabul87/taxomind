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
// ============================================================================
// TYPES
// ============================================================================
export * from './types';
// ============================================================================
// STORES
// ============================================================================
export { InMemoryPresenceStore, InMemoryNotificationStore, createInMemoryPresenceStore, createInMemoryNotificationStore, } from './stores';
// ============================================================================
// PRESENCE MANAGER
// ============================================================================
export { PresenceManager, createPresenceManager, } from './presence-manager';
// ============================================================================
// EVENT DISPATCHER
// ============================================================================
export { EventDispatcher, createEventDispatcher, } from './event-dispatcher';
// ============================================================================
// PACKAGE INFO
// ============================================================================
export const PACKAGE_NAME = '@sam-ai/realtime';
export const PACKAGE_VERSION = '0.1.0';
/**
 * Package capabilities
 */
export const REALTIME_CAPABILITIES = {
    PRESENCE: 'realtime:presence',
    EVENTS: 'realtime:events',
    NOTIFICATIONS: 'realtime:notifications',
    CHANNELS: 'realtime:channels',
};
/**
 * Check if a capability is available
 */
export function hasCapability(capability) {
    switch (capability) {
        case REALTIME_CAPABILITIES.PRESENCE:
        case REALTIME_CAPABILITIES.EVENTS:
        case REALTIME_CAPABILITIES.NOTIFICATIONS:
        case REALTIME_CAPABILITIES.CHANNELS:
            return true;
        default:
            return false;
    }
}
// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================
import { PresenceManager } from './presence-manager';
import { EventDispatcher } from './event-dispatcher';
/**
 * Create a complete realtime system with all components configured
 */
export function createRealtimeSystem(config = {}) {
    const logger = config.logger;
    // Create presence manager
    const presence = new PresenceManager({
        store: config.presenceStore,
        logger,
        ...config.presence,
    });
    // Create event dispatcher
    const dispatcher = new EventDispatcher({
        store: config.notificationStore,
        logger,
        ...config.dispatcher,
    });
    // Wire up presence changes to dispatcher
    presence.onPresenceChange((presenceData, event) => {
        void dispatcher.dispatch({
            id: `presence_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type: `presence:${event}`,
            userId: presenceData.userId,
            timestamp: new Date(),
            payload: { presence: presenceData },
            priority: 'low',
            requiresAck: false,
        });
    });
    return {
        presence,
        dispatcher,
    };
}
//# sourceMappingURL=index.js.map