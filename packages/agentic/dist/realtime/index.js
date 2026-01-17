/**
 * @sam-ai/agentic - Real-Time Module
 * WebSocket communication, presence tracking, and proactive push delivery
 */
// Types
export * from './types';
// Presence Tracker
export { PresenceTracker, InMemoryPresenceStore, createPresenceTracker, createInMemoryPresenceStore, DEFAULT_PRESENCE_CONFIG, } from './presence-tracker';
// Push Dispatcher
export { ProactivePushDispatcher, InMemoryPushQueueStore, createPushDispatcher, createInMemoryPushQueueStore, } from './push-dispatcher';
// WebSocket Manager
export { ClientWebSocketManager, ServerConnectionManager, createClientWebSocketManager, createServerConnectionManager, } from './websocket-manager';
// Intervention Surface Manager
export { InterventionSurfaceManagerImpl, createInterventionSurfaceManager, DEFAULT_DISPLAY_CONFIGS, DEFAULT_SURFACE_MANAGER_CONFIG, } from './intervention-surface';
// Notification Delivery Channels
export { EmailChannel, createEmailChannel, BrowserPushChannel, createBrowserPushChannel, } from './channels';
//# sourceMappingURL=index.js.map