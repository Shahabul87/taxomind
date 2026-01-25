/**
 * @sam-ai/agentic - Real-Time Types
 * Type definitions for WebSocket communication, presence tracking, and proactive push
 */

import { z } from 'zod';
import type {
  Intervention,
  TriggeredCheckIn,
  ScheduledCheckIn,
} from '../proactive-intervention/types';

// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================

/**
 * SAM WebSocket event types for real-time communication
 */
export const SAMEventType = {
  // Proactive events (server -> client)
  INTERVENTION: 'intervention',
  CHECKIN: 'checkin',
  RECOMMENDATION: 'recommendation',
  STEP_COMPLETED: 'step_completed',
  GOAL_PROGRESS: 'goal_progress',
  NUDGE: 'nudge',
  PRESENCE_UPDATE: 'presence_update',
  SESSION_SYNC: 'session_sync',
  CELEBRATION: 'celebration',

  // Client events (client -> server)
  ACTIVITY: 'activity',
  HEARTBEAT: 'heartbeat',
  ACKNOWLEDGE: 'acknowledge',
  DISMISS: 'dismiss',
  RESPOND: 'respond',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',

  // System events
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting',
} as const;

export type SAMEventType = (typeof SAMEventType)[keyof typeof SAMEventType];

/**
 * Base WebSocket event structure
 */
export interface BaseWebSocketEvent<T extends SAMEventType, P = unknown> {
  type: T;
  payload: P;
  timestamp: Date;
  eventId: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Intervention push event
 */
export interface InterventionEvent extends BaseWebSocketEvent<'intervention', Intervention> {
  type: 'intervention';
  urgency: 'immediate' | 'soon' | 'routine';
  dismissible: boolean;
  expiresAt?: Date;
}

/**
 * Check-in push event
 */
export interface CheckInEvent extends BaseWebSocketEvent<'checkin', TriggeredCheckIn> {
  type: 'checkin';
  checkIn: ScheduledCheckIn;
  urgency: 'immediate' | 'soon' | 'routine';
}

/**
 * Recommendation push event
 */
export interface RecommendationPayload {
  id: string;
  type: 'content' | 'activity' | 'break' | 'review' | 'goal';
  title: string;
  description: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface RecommendationEvent extends BaseWebSocketEvent<'recommendation', RecommendationPayload> {
  type: 'recommendation';
}

/**
 * Step completion notification
 */
export interface StepCompletionPayload {
  planId: string;
  stepId: string;
  stepTitle: string;
  stepNumber: number;
  totalSteps: number;
  progress: number;
  nextStepTitle?: string;
  celebrationMessage?: string;
}

export interface StepCompletedEvent extends BaseWebSocketEvent<'step_completed', StepCompletionPayload> {
  type: 'step_completed';
}

/**
 * Goal progress update
 */
export interface GoalProgressPayload {
  goalId: string;
  goalTitle: string;
  progress: number;
  milestone?: {
    title: string;
    achieved: boolean;
    message: string;
  };
  streak?: {
    current: number;
    atRisk: boolean;
    message?: string;
  };
}

export interface GoalProgressEvent extends BaseWebSocketEvent<'goal_progress', GoalProgressPayload> {
  type: 'goal_progress';
}

/**
 * Proactive nudge (lightweight intervention)
 */
export interface NudgePayload {
  id: string;
  type: NudgeType;
  message: string;
  icon?: string;
  action?: {
    label: string;
    url?: string;
    action?: string;
  };
  dismissAfterMs?: number;
  position?: 'top' | 'bottom' | 'center' | 'corner';
}

export const NudgeType = {
  REMINDER: 'reminder',
  ENCOURAGEMENT: 'encouragement',
  TIP: 'tip',
  STREAK_ALERT: 'streak_alert',
  BREAK_SUGGESTION: 'break_suggestion',
  STUDY_PROMPT: 'study_prompt',
  ACHIEVEMENT: 'achievement',
} as const;

export type NudgeType = (typeof NudgeType)[keyof typeof NudgeType];

export interface NudgeEvent extends BaseWebSocketEvent<'nudge', NudgePayload> {
  type: 'nudge';
}

/**
 * Presence update event
 */
export interface PresencePayload {
  userId: string;
  status: PresenceStatus;
  lastActivityAt: Date;
  currentPage?: string;
  currentCourse?: string;
  currentSection?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

export interface PresenceUpdateEvent extends BaseWebSocketEvent<'presence_update', PresencePayload> {
  type: 'presence_update';
}

/**
 * Session sync event for cross-device continuity
 */
export interface SessionSyncPayload {
  sessionId: string;
  currentPlanId?: string;
  currentStepId?: string;
  lastActivity: Date;
  pendingActions: string[];
  syncedAt: Date;
}

export interface SessionSyncEvent extends BaseWebSocketEvent<'session_sync', SessionSyncPayload> {
  type: 'session_sync';
}

/**
 * Celebration event for achievements
 */
export interface CelebrationPayload {
  type: CelebrationType;
  title: string;
  message: string;
  achievement?: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
  confetti?: boolean;
  sound?: boolean;
  displayDurationMs?: number;
}

export const CelebrationType = {
  GOAL_COMPLETED: 'goal_completed',
  MILESTONE_REACHED: 'milestone_reached',
  STREAK_MILESTONE: 'streak_milestone',
  BADGE_EARNED: 'badge_earned',
  LEVEL_UP: 'level_up',
  COURSE_COMPLETED: 'course_completed',
  MASTERY_ACHIEVED: 'mastery_achieved',
} as const;

export type CelebrationType = (typeof CelebrationType)[keyof typeof CelebrationType];

export interface CelebrationEvent extends BaseWebSocketEvent<'celebration', CelebrationPayload> {
  type: 'celebration';
}

/**
 * Client activity event
 */
export interface ActivityPayload {
  type: 'page_view' | 'interaction' | 'focus' | 'blur' | 'scroll' | 'typing';
  data: Record<string, unknown>;
  pageContext?: {
    url: string;
    courseId?: string;
    sectionId?: string;
  };
}

export interface ActivityEvent extends BaseWebSocketEvent<'activity', ActivityPayload> {
  type: 'activity';
}

/**
 * Heartbeat event for connection health
 */
export interface HeartbeatPayload {
  status: 'alive';
  timestamp: Date;
  connectionId: string;
}

export interface HeartbeatEvent extends BaseWebSocketEvent<'heartbeat', HeartbeatPayload> {
  type: 'heartbeat';
}

/**
 * Acknowledge event for confirming receipt
 */
export interface AcknowledgePayload {
  eventId: string;
  received: boolean;
  action?: 'viewed' | 'clicked' | 'dismissed';
}

export interface AcknowledgeEvent extends BaseWebSocketEvent<'acknowledge', AcknowledgePayload> {
  type: 'acknowledge';
}

/**
 * Dismiss event for closing notifications
 */
export interface DismissPayload {
  eventId: string;
  reason?: 'user_action' | 'timeout' | 'replaced' | 'navigation';
}

export interface DismissEvent extends BaseWebSocketEvent<'dismiss', DismissPayload> {
  type: 'dismiss';
}

/**
 * Subscribe/unsubscribe events
 */
export interface SubscriptionPayload {
  channels: string[];
  courseId?: string;
  sessionId?: string;
}

export interface SubscribeEvent extends BaseWebSocketEvent<'subscribe', SubscriptionPayload> {
  type: 'subscribe';
}

export interface UnsubscribeEvent extends BaseWebSocketEvent<'unsubscribe', SubscriptionPayload> {
  type: 'unsubscribe';
}

/**
 * System error event
 */
export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
}

export interface ErrorEvent extends BaseWebSocketEvent<'error', ErrorPayload> {
  type: 'error';
}

/**
 * Connected event
 */
export interface ConnectedPayload {
  connectionId: string;
  userId: string;
  sessionId: string;
  serverTime: Date;
  capabilities: string[];
}

export interface ConnectedEvent extends BaseWebSocketEvent<'connected', ConnectedPayload> {
  type: 'connected';
}

/**
 * Union type of all SAM WebSocket events
 */
export type SAMWebSocketEvent =
  | InterventionEvent
  | CheckInEvent
  | RecommendationEvent
  | StepCompletedEvent
  | GoalProgressEvent
  | NudgeEvent
  | PresenceUpdateEvent
  | SessionSyncEvent
  | CelebrationEvent
  | ActivityEvent
  | HeartbeatEvent
  | AcknowledgeEvent
  | DismissEvent
  | SubscribeEvent
  | UnsubscribeEvent
  | ErrorEvent
  | ConnectedEvent;

// ============================================================================
// PRESENCE TRACKING TYPES
// ============================================================================

/**
 * User presence status
 */
export const PresenceStatus = {
  ONLINE: 'online',
  AWAY: 'away',
  IDLE: 'idle',
  STUDYING: 'studying',
  ON_BREAK: 'on_break',
  OFFLINE: 'offline',
  DO_NOT_DISTURB: 'do_not_disturb',
} as const;

export type PresenceStatus = (typeof PresenceStatus)[keyof typeof PresenceStatus];

/**
 * User presence record
 */
export interface UserPresence {
  userId: string;
  connectionId: string;
  status: PresenceStatus;
  lastActivityAt: Date;
  connectedAt: Date;
  metadata: PresenceMetadata;
  subscriptions: string[];
}

/**
 * Presence metadata
 */
export interface PresenceMetadata {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  location?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    pageUrl?: string;
  };
  sessionContext?: {
    planId?: string;
    stepId?: string;
    goalId?: string;
  };
}

/**
 * Presence state change
 */
export interface PresenceStateChange {
  userId: string;
  previousStatus: PresenceStatus;
  newStatus: PresenceStatus;
  changedAt: Date;
  reason: PresenceChangeReason;
}

export const PresenceChangeReason = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ACTIVITY: 'activity',
  IDLE_TIMEOUT: 'idle_timeout',
  AWAY_TIMEOUT: 'away_timeout',
  USER_SET: 'user_set',
  SESSION_END: 'session_end',
} as const;

export type PresenceChangeReason = (typeof PresenceChangeReason)[keyof typeof PresenceChangeReason];

// ============================================================================
// CONNECTION MANAGEMENT TYPES
// ============================================================================

/**
 * WebSocket connection state
 */
export const ConnectionState = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
} as const;

export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

/**
 * Connection configuration
 */
export interface ConnectionConfig {
  /** WebSocket server URL */
  url: string;
  /** Reconnection attempts */
  maxReconnectAttempts: number;
  /** Base reconnection delay (ms) */
  reconnectDelay: number;
  /** Heartbeat interval (ms) */
  heartbeatInterval: number;
  /** Idle timeout for presence (ms) */
  idleTimeout: number;
  /** Away timeout for presence (ms) */
  awayTimeout: number;
  /** Enable automatic reconnection */
  autoReconnect: boolean;
  /** Auth token for connection */
  authToken?: string;
}

/**
 * Default connection configuration
 */
export const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  url: '/api/sam/ws',
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  idleTimeout: 60000, // 1 minute
  awayTimeout: 300000, // 5 minutes
  autoReconnect: true,
};

/**
 * Connection statistics
 */
export interface ConnectionStats {
  connectionId: string;
  connectedAt: Date;
  lastHeartbeatAt: Date;
  messagesSent: number;
  messagesReceived: number;
  reconnectCount: number;
  latencyMs: number;
}

// ============================================================================
// PROACTIVE PUSH DISPATCHER TYPES
// ============================================================================

/**
 * Push delivery channel
 */
export const DeliveryChannel = {
  WEBSOCKET: 'websocket',
  SSE: 'sse',
  PUSH_NOTIFICATION: 'push_notification',
  EMAIL: 'email',
  IN_APP: 'in_app',
} as const;

export type DeliveryChannel = (typeof DeliveryChannel)[keyof typeof DeliveryChannel];

/**
 * Push delivery priority
 */
export const DeliveryPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const;

export type DeliveryPriority = (typeof DeliveryPriority)[keyof typeof DeliveryPriority];

/**
 * Push delivery request
 */
export interface PushDeliveryRequest {
  id: string;
  userId: string;
  event: SAMWebSocketEvent;
  priority: DeliveryPriority;
  channels: DeliveryChannel[];
  fallbackChannels?: DeliveryChannel[];
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Push delivery result
 */
export interface PushDeliveryResult {
  requestId: string;
  userId: string;
  deliveredVia: DeliveryChannel | null;
  success: boolean;
  error?: string;
  attemptedChannels: DeliveryChannel[];
  deliveredAt?: Date;
  acknowledgedAt?: Date;
}

/**
 * Push dispatcher configuration
 */
export interface PushDispatcherConfig {
  /** Max queue size */
  maxQueueSize: number;
  /** Batch size for processing */
  batchSize: number;
  /** Processing interval (ms) */
  processingInterval: number;
  /** Retry attempts for failed deliveries */
  retryAttempts: number;
  /** Retry delay (ms) */
  retryDelay: number;
  /** Default expiration (ms) */
  defaultExpirationMs: number;
}

/**
 * Default push dispatcher configuration
 */
export const DEFAULT_PUSH_DISPATCHER_CONFIG: PushDispatcherConfig = {
  maxQueueSize: 1000,
  batchSize: 50,
  processingInterval: 2000, // 2 seconds (was 100ms - too aggressive for DB queries)
  retryAttempts: 3,
  retryDelay: 1000,
  defaultExpirationMs: 3600000, // 1 hour
};

// ============================================================================
// UI INTERVENTION SURFACE TYPES
// ============================================================================

/**
 * Intervention surface type (where to display)
 */
export const InterventionSurface = {
  TOAST: 'toast',
  MODAL: 'modal',
  SIDEBAR: 'sidebar',
  INLINE: 'inline',
  FLOATING: 'floating',
  BANNER: 'banner',
  ASSISTANT_PANEL: 'assistant_panel',
  DASHBOARD_WIDGET: 'dashboard_widget',
} as const;

export type InterventionSurface = (typeof InterventionSurface)[keyof typeof InterventionSurface];

/**
 * Intervention display configuration
 */
export interface InterventionDisplayConfig {
  surface: InterventionSurface;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-right' | 'bottom-right';
  duration?: number; // auto-dismiss after ms
  dismissible: boolean;
  blocking: boolean; // blocks interaction with page
  priority: number; // higher = more visible
  animation?: 'fade' | 'slide' | 'bounce' | 'none';
  sound?: boolean;
  vibrate?: boolean;
}

/**
 * Intervention UI state
 */
export interface InterventionUIState {
  id: string;
  event: SAMWebSocketEvent;
  displayConfig: InterventionDisplayConfig;
  visible: boolean;
  createdAt: Date;
  displayedAt?: Date;
  dismissedAt?: Date;
  interactedAt?: Date;
  interactionType?: 'click' | 'dismiss' | 'action' | 'timeout';
}

/**
 * Intervention queue for UI management
 */
export interface InterventionQueue {
  items: InterventionUIState[];
  maxVisible: number;
  currentlyVisible: string[];
  priorityOrder: string[];
}

// ============================================================================
// STORE INTERFACES
// ============================================================================

/**
 * Presence store interface (portable)
 */
export interface PresenceStore {
  get(userId: string): Promise<UserPresence | null>;
  getByConnection(connectionId: string): Promise<UserPresence | null>;
  set(presence: UserPresence): Promise<void>;
  update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null>;
  delete(userId: string): Promise<boolean>;
  deleteByConnection(connectionId: string): Promise<boolean>;
  getOnline(): Promise<UserPresence[]>;
  getByStatus(status: PresenceStatus): Promise<UserPresence[]>;
  cleanup(olderThan: Date): Promise<number>;
}

/**
 * Push queue store interface (portable)
 */
export interface PushQueueStore {
  enqueue(request: PushDeliveryRequest): Promise<void>;
  dequeue(count: number): Promise<PushDeliveryRequest[]>;
  peek(count: number): Promise<PushDeliveryRequest[]>;
  acknowledge(requestId: string, result: PushDeliveryResult): Promise<void>;
  requeue(request: PushDeliveryRequest): Promise<void>;
  getStats(): Promise<PushQueueStats>;
  cleanup(olderThan: Date): Promise<number>;
}

/**
 * Push queue statistics (renamed to avoid conflict with memory QueueStats)
 */
export interface PushQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  avgProcessingTimeMs: number;
  oldestPendingAt?: Date;
}

/**
 * Event history store interface
 */
export interface EventHistoryStore {
  add(event: SAMWebSocketEvent, userId: string): Promise<void>;
  getByUser(userId: string, limit?: number): Promise<SAMWebSocketEvent[]>;
  getByType(userId: string, type: SAMEventType, limit?: number): Promise<SAMWebSocketEvent[]>;
  getUnacknowledged(userId: string): Promise<SAMWebSocketEvent[]>;
  markAcknowledged(eventId: string): Promise<void>;
  cleanup(olderThan: Date): Promise<number>;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * WebSocket connection handler interface (portable)
 */
export interface WebSocketConnectionHandler {
  /** Handle new connection */
  onConnect(connectionId: string, userId: string, metadata: PresenceMetadata): Promise<void>;

  /** Handle disconnection */
  onDisconnect(connectionId: string, reason?: string): Promise<void>;

  /** Handle incoming message */
  onMessage(connectionId: string, event: SAMWebSocketEvent): Promise<void>;

  /** Handle connection error */
  onError(connectionId: string, error: Error): Promise<void>;
}

/**
 * Push dispatcher interface (portable)
 */
export interface PushDispatcherInterface {
  /** Queue event for delivery */
  dispatch(request: PushDeliveryRequest): Promise<void>;

  /** Process queued events */
  processQueue(): Promise<PushDeliveryResult[]>;

  /** Check if user is reachable via WebSocket */
  isUserOnline(userId: string): Promise<boolean>;

  /** Get delivery stats */
  getStats(): Promise<DispatcherStats>;

  /** Start processing */
  start(): void;

  /** Stop processing */
  stop(): void;
}

/**
 * Dispatcher statistics
 */
export interface DispatcherStats {
  queueSize: number;
  deliveredCount: number;
  failedCount: number;
  activeConnections: number;
  avgDeliveryTimeMs: number;
  lastProcessedAt?: Date;
}

/**
 * Presence tracker interface (portable)
 */
export interface PresenceTrackerInterface {
  /** Record user activity */
  recordActivity(userId: string, activity: ActivityPayload): Promise<void>;

  /** Get user presence */
  getPresence(userId: string): Promise<UserPresence | null>;

  /** Update presence status */
  updateStatus(userId: string, status: PresenceStatus): Promise<void>;

  /** Check for idle/away users */
  checkTimeouts(): Promise<PresenceStateChange[]>;

  /** Get online users */
  getOnlineUsers(): Promise<UserPresence[]>;

  /** Subscribe to presence changes */
  onPresenceChange(callback: (change: PresenceStateChange) => void): () => void;
}

/**
 * Intervention surface manager interface
 */
export interface InterventionSurfaceManager {
  /** Queue intervention for display */
  queue(event: SAMWebSocketEvent, config?: Partial<InterventionDisplayConfig>): void;

  /** Dismiss intervention */
  dismiss(eventId: string, reason?: string): void;

  /** Get current queue state */
  getQueue(): InterventionQueue;

  /** Clear all interventions */
  clearAll(): void;

  /** Subscribe to queue changes */
  onQueueChange(callback: (queue: InterventionQueue) => void): () => void;
}

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface RealtimeLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const SAMWebSocketEventSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
  timestamp: z.date(),
  eventId: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

export const ConnectionConfigSchema = z.object({
  url: z.string().url(),
  maxReconnectAttempts: z.number().min(0).max(20),
  reconnectDelay: z.number().min(100).max(60000),
  heartbeatInterval: z.number().min(5000).max(300000),
  idleTimeout: z.number().min(10000).max(600000),
  awayTimeout: z.number().min(60000).max(3600000),
  autoReconnect: z.boolean(),
  authToken: z.string().optional(),
});

export const PushDeliveryRequestSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  event: SAMWebSocketEventSchema,
  priority: z.enum(['critical', 'high', 'normal', 'low']),
  channels: z.array(z.enum(['websocket', 'sse', 'push_notification', 'email', 'in_app'])),
  fallbackChannels: z.array(z.enum(['websocket', 'sse', 'push_notification', 'email', 'in_app'])).optional(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});
