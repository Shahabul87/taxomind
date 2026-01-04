/**
 * @sam-ai/integration - Realtime Adapter Interface
 * Abstract real-time communication for portability
 */

import { z } from 'zod';

// ============================================================================
// REALTIME TYPES
// ============================================================================

/**
 * Connection state
 */
export const ConnectionState = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
} as const;

export type ConnectionState = (typeof ConnectionState)[keyof typeof ConnectionState];

/**
 * Presence state
 */
export interface PresenceState {
  odataState: string;
  onlineAt: Date;
  lastActiveAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Room/channel info
 */
export interface RealtimeRoom {
  id: string;
  name: string;
  type: 'public' | 'private' | 'presence';
  memberCount: number;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Room member
 */
export interface RoomMember {
  odatauserId: string;
  odatapresence?: PresenceState;
  joinedAt: Date;
  role?: string;
}

/**
 * Realtime event
 */
export interface RealtimeEvent<T = unknown> {
  id: string;
  type: string;
  data: T;
  senderId?: string;
  roomId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Event subscription
 */
export interface EventSubscription {
  id: string;
  eventType: string;
  roomId?: string;
  callback: (event: RealtimeEvent) => void;
  unsubscribe: () => void;
}

// ============================================================================
// REALTIME ADAPTER INTERFACE
// ============================================================================

/**
 * Realtime adapter interface
 * Abstracts away the specific WebSocket/SSE implementation
 */
export interface RealtimeAdapter {
  /**
   * Get adapter name
   */
  getName(): string;

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  /**
   * Connect to realtime server
   */
  connect(options?: {
    userId?: string;
    token?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;

  /**
   * Disconnect from realtime server
   */
  disconnect(): Promise<void>;

  /**
   * Reconnect
   */
  reconnect(): Promise<void>;

  // -------------------------------------------------------------------------
  // Events
  // -------------------------------------------------------------------------

  /**
   * Subscribe to event type
   */
  subscribe<T = unknown>(
    eventType: string,
    callback: (event: RealtimeEvent<T>) => void
  ): EventSubscription;

  /**
   * Subscribe to room events
   */
  subscribeToRoom<T = unknown>(
    roomId: string,
    eventType: string,
    callback: (event: RealtimeEvent<T>) => void
  ): EventSubscription;

  /**
   * Unsubscribe from event
   */
  unsubscribe(subscriptionId: string): void;

  /**
   * Emit event
   */
  emit<T = unknown>(
    eventType: string,
    data: T,
    options?: { roomId?: string; metadata?: Record<string, unknown> }
  ): Promise<void>;

  /**
   * Emit to specific users
   */
  emitToUsers<T = unknown>(
    userIds: string[],
    eventType: string,
    data: T
  ): Promise<void>;

  // -------------------------------------------------------------------------
  // Rooms
  // -------------------------------------------------------------------------

  /**
   * Join a room
   */
  joinRoom(roomId: string, options?: { metadata?: Record<string, unknown> }): Promise<RealtimeRoom>;

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): Promise<void>;

  /**
   * Get rooms user is in
   */
  getRooms(): Promise<RealtimeRoom[]>;

  /**
   * Get room members
   */
  getRoomMembers(roomId: string): Promise<RoomMember[]>;

  /**
   * Create a room
   */
  createRoom(options: {
    name: string;
    type: 'public' | 'private' | 'presence';
    metadata?: Record<string, unknown>;
  }): Promise<RealtimeRoom>;

  /**
   * Delete a room
   */
  deleteRoom(roomId: string): Promise<void>;

  // -------------------------------------------------------------------------
  // Presence
  // -------------------------------------------------------------------------

  /**
   * Update presence state
   */
  updatePresence(state: Partial<PresenceState>): Promise<void>;

  /**
   * Get user presence
   */
  getPresence(userId: string): Promise<PresenceState | null>;

  /**
   * Get all online users in room
   */
  getRoomPresence(roomId: string): Promise<Array<{ userId: string; presence: PresenceState }>>;

  /**
   * Subscribe to presence changes in room
   */
  subscribeToPresence(
    roomId: string,
    callback: (event: {
      type: 'join' | 'leave' | 'update';
      userId: string;
      presence?: PresenceState;
    }) => void
  ): EventSubscription;

  // -------------------------------------------------------------------------
  // Connection Events
  // -------------------------------------------------------------------------

  /**
   * Listen to connection state changes
   */
  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void;

  /**
   * Listen to errors
   */
  onError(callback: (error: Error) => void): () => void;
}

// ============================================================================
// SAM-SPECIFIC REALTIME EVENTS
// ============================================================================

/**
 * SAM realtime event types
 */
export const SAMRealtimeEventType = {
  // Chat events
  CHAT_MESSAGE: 'sam:chat:message',
  CHAT_TYPING: 'sam:chat:typing',
  CHAT_STREAM_START: 'sam:chat:stream:start',
  CHAT_STREAM_CHUNK: 'sam:chat:stream:chunk',
  CHAT_STREAM_END: 'sam:chat:stream:end',

  // Intervention events
  INTERVENTION_TRIGGERED: 'sam:intervention:triggered',
  CHECKIN_SCHEDULED: 'sam:checkin:scheduled',
  CHECKIN_DUE: 'sam:checkin:due',

  // Progress events
  GOAL_UPDATED: 'sam:goal:updated',
  PLAN_STEP_COMPLETED: 'sam:plan:step:completed',
  SKILL_LEVELED_UP: 'sam:skill:leveled_up',

  // Notification events
  NOTIFICATION: 'sam:notification',
  RECOMMENDATION: 'sam:recommendation',

  // Presence events
  USER_ONLINE: 'sam:presence:online',
  USER_OFFLINE: 'sam:presence:offline',
  USER_ACTIVE: 'sam:presence:active',
  USER_IDLE: 'sam:presence:idle',
} as const;

export type SAMRealtimeEventType = (typeof SAMRealtimeEventType)[keyof typeof SAMRealtimeEventType];

/**
 * SAM chat stream chunk
 */
export interface SAMStreamChunk {
  id: string;
  sessionId: string;
  content: string;
  isComplete: boolean;
  confidence?: number;
  toolCalls?: Array<{ id: string; name: string; status: string }>;
}

/**
 * SAM intervention event data
 */
export interface SAMInterventionEvent {
  interventionId: string;
  type: string;
  priority: string;
  message: string;
  suggestedActions: string[];
}

/**
 * SAM progress event data
 */
export interface SAMProgressEvent {
  goalId?: string;
  planId?: string;
  stepId?: string;
  type: 'goal' | 'plan' | 'step' | 'skill';
  previousValue?: number;
  currentValue: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// REALTIME SERVICE
// ============================================================================

/**
 * SAM realtime service
 * Wraps adapter with SAM-specific functionality
 */
export interface SAMRealtimeService {
  /**
   * Get underlying adapter
   */
  getAdapter(): RealtimeAdapter;

  /**
   * Initialize for user
   */
  initialize(userId: string, options?: {
    courseId?: string;
    sessionId?: string;
  }): Promise<void>;

  /**
   * Join SAM session room
   */
  joinSession(sessionId: string): Promise<void>;

  /**
   * Leave SAM session room
   */
  leaveSession(sessionId: string): Promise<void>;

  /**
   * Stream chat response
   */
  streamChatResponse(
    sessionId: string,
    responseId: string,
    stream: AsyncIterable<string>
  ): Promise<void>;

  /**
   * Send intervention to user
   */
  sendIntervention(userId: string, intervention: SAMInterventionEvent): Promise<void>;

  /**
   * Send progress update
   */
  sendProgressUpdate(userId: string, progress: SAMProgressEvent): Promise<void>;

  /**
   * Listen to chat messages
   */
  onChatMessage(callback: (event: RealtimeEvent<{ content: string; role: string }>) => void): EventSubscription;

  /**
   * Listen to stream chunks
   */
  onStreamChunk(callback: (chunk: SAMStreamChunk) => void): EventSubscription;

  /**
   * Listen to interventions
   */
  onIntervention(callback: (intervention: SAMInterventionEvent) => void): EventSubscription;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const PresenceStateSchema = z.object({
  state: z.string(),
  onlineAt: z.date(),
  lastActiveAt: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const RealtimeRoomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['public', 'private', 'presence']),
  memberCount: z.number().min(0),
  createdAt: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const RealtimeEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.unknown(),
  senderId: z.string().optional(),
  roomId: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const SAMStreamChunkSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  content: z.string(),
  isComplete: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  toolCalls: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: z.string(),
      })
    )
    .optional(),
});
