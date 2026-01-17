/**
 * @sam-ai/agentic - Real-Time Module
 * WebSocket communication, presence tracking, and proactive push delivery
 */
export * from './types';
export { PresenceTracker, InMemoryPresenceStore, createPresenceTracker, createInMemoryPresenceStore, type PresenceTrackerConfig, DEFAULT_PRESENCE_CONFIG, } from './presence-tracker';
export { ProactivePushDispatcher, InMemoryPushQueueStore, createPushDispatcher, createInMemoryPushQueueStore, type DeliveryHandler, } from './push-dispatcher';
export { ClientWebSocketManager, ServerConnectionManager, createClientWebSocketManager, createServerConnectionManager, type WebSocketManagerInterface, type MessageHandler, type ConnectionHandler, type ErrorHandler, type ServerConnection, } from './websocket-manager';
export { InterventionSurfaceManagerImpl, createInterventionSurfaceManager, DEFAULT_DISPLAY_CONFIGS, type SurfaceManagerConfig, DEFAULT_SURFACE_MANAGER_CONFIG, type InterventionRenderProps, type SurfaceComponentProps, type ToastContainerProps, type ModalContainerProps, type SidebarContainerProps, type BannerContainerProps, } from './intervention-surface';
export { EmailChannel, createEmailChannel, type EmailChannelConfig, type EmailPreferences, type EmailServiceAdapter, BrowserPushChannel, createBrowserPushChannel, type BrowserPushChannelConfig, type PushSubscriptionData, type WebPushServiceAdapter, type PushNotificationPayload, } from './channels';
//# sourceMappingURL=index.d.ts.map