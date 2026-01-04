/**
 * @sam-ai/agentic - Real-Time Module
 * WebSocket communication, presence tracking, and proactive push delivery
 */

// Types
export * from './types';

// Presence Tracker
export {
  PresenceTracker,
  InMemoryPresenceStore,
  createPresenceTracker,
  createInMemoryPresenceStore,
  type PresenceTrackerConfig,
  DEFAULT_PRESENCE_CONFIG,
} from './presence-tracker';

// Push Dispatcher
export {
  ProactivePushDispatcher,
  InMemoryPushQueueStore,
  createPushDispatcher,
  createInMemoryPushQueueStore,
  type DeliveryHandler,
} from './push-dispatcher';

// WebSocket Manager
export {
  ClientWebSocketManager,
  ServerConnectionManager,
  createClientWebSocketManager,
  createServerConnectionManager,
  type WebSocketManagerInterface,
  type MessageHandler,
  type ConnectionHandler,
  type ErrorHandler,
  type ServerConnection,
} from './websocket-manager';

// Intervention Surface Manager
export {
  InterventionSurfaceManagerImpl,
  createInterventionSurfaceManager,
  DEFAULT_DISPLAY_CONFIGS,
  type SurfaceManagerConfig,
  DEFAULT_SURFACE_MANAGER_CONFIG,
  type InterventionRenderProps,
  type SurfaceComponentProps,
  type ToastContainerProps,
  type ModalContainerProps,
  type SidebarContainerProps,
  type BannerContainerProps,
} from './intervention-surface';
