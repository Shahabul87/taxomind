/**
 * @sam-ai/realtime - Type Definitions
 * Real-time communication types for SAM AI Mentor
 */

import { z } from 'zod';

// ============================================================================
// PRESENCE TYPES
// ============================================================================

export const PresenceStatusSchema = z.enum(['online', 'away', 'busy', 'offline']);
export type PresenceStatus = z.infer<typeof PresenceStatusSchema>;

export const UserPresenceSchema = z.object({
  userId: z.string(),
  connectionId: z.string(),
  status: PresenceStatusSchema,
  lastActivityAt: z.date(),
  connectedAt: z.date(),
  disconnectedAt: z.date().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  pageUrl: z.string().optional(),
  planId: z.string().optional(),
  stepId: z.string().optional(),
  goalId: z.string().optional(),
  subscriptions: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export type UserPresence = z.infer<typeof UserPresenceSchema>;

export const PresenceChangeReasonSchema = z.enum([
  'connect',
  'disconnect',
  'timeout',
  'activity',
  'manual',
  'navigation',
]);
export type PresenceChangeReason = z.infer<typeof PresenceChangeReasonSchema>;

export interface PresenceHistoryEntry {
  id: string;
  userId: string;
  previousStatus: PresenceStatus;
  newStatus: PresenceStatus;
  reason: PresenceChangeReason;
  changedAt: Date;
  courseId?: string;
  pageUrl?: string;
  sessionDuration?: number;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export const RealtimeEventTypeSchema = z.enum([
  // Presence events
  'presence:connect',
  'presence:disconnect',
  'presence:update',
  'presence:heartbeat',
  // Notification events
  'notification:intervention',
  'notification:checkin',
  'notification:achievement',
  'notification:reminder',
  'notification:custom',
  // Learning events
  'learning:goal_progress',
  'learning:plan_update',
  'learning:step_complete',
  'learning:recommendation',
  // Sync events
  'sync:form_data',
  'sync:state_update',
  // System events
  'system:error',
  'system:reconnect',
  'system:maintenance',
]);

export type RealtimeEventType = z.infer<typeof RealtimeEventTypeSchema>;

export const RealtimeEventSchema = z.object({
  id: z.string(),
  type: RealtimeEventTypeSchema,
  userId: z.string(),
  timestamp: z.date(),
  payload: z.record(z.unknown()),
  channel: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  ttl: z.number().optional(), // Time-to-live in seconds
  requiresAck: z.boolean().default(false),
});

export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

// ============================================================================
// CHANNEL TYPES
// ============================================================================

export const ChannelTypeSchema = z.enum([
  'user', // Private channel for a specific user
  'course', // Channel for a course
  'broadcast', // Broadcast to all connected users
  'admin', // Admin-only channel
]);

export type ChannelType = z.infer<typeof ChannelTypeSchema>;

export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  subscribers: Set<string>;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ChannelSubscription {
  connectionId: string;
  userId: string;
  channelId: string;
  subscribedAt: Date;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export const MessageTypeSchema = z.enum([
  'event', // Real-time event
  'ack', // Acknowledgment
  'ping', // Heartbeat ping
  'pong', // Heartbeat pong
  'subscribe', // Subscribe to channel
  'unsubscribe', // Unsubscribe from channel
  'error', // Error message
]);

export type MessageType = z.infer<typeof MessageTypeSchema>;

export const WebSocketMessageSchema = z.object({
  type: MessageTypeSchema,
  id: z.string(),
  timestamp: z.number(),
  payload: z.unknown(),
});

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export const NotificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export type NotificationPriority = z.infer<typeof NotificationPrioritySchema>;

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum([
    'intervention',
    'checkin',
    'achievement',
    'reminder',
    'goal_update',
    'recommendation',
    'system',
  ]),
  title: z.string(),
  message: z.string(),
  priority: NotificationPrioritySchema.default('normal'),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  iconType: z.string().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  readAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// ============================================================================
// STORE INTERFACES
// ============================================================================

export interface PresenceStore {
  get(userId: string): Promise<UserPresence | null>;
  getByConnection(connectionId: string): Promise<UserPresence | null>;
  set(presence: UserPresence): Promise<void>;
  update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null>;
  delete(userId: string): Promise<boolean>;
  getOnlineUsers(options?: { courseId?: string; limit?: number }): Promise<UserPresence[]>;
  getOnlineCount(courseId?: string): Promise<number>;
  recordHistory(entry: Omit<PresenceHistoryEntry, 'id'>): Promise<void>;
  getHistory(userId: string, limit?: number): Promise<PresenceHistoryEntry[]>;
  cleanupStale(maxAge: number): Promise<number>;
}

export interface NotificationStore {
  create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  get(id: string): Promise<Notification | null>;
  getByUser(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<number>;
  delete(id: string): Promise<boolean>;
  deleteExpired(): Promise<number>;
}

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface RealtimeLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

export interface RealtimeServerConfig {
  port?: number;
  path?: string;
  heartbeatInterval?: number; // ms
  heartbeatTimeout?: number; // ms
  maxConnections?: number;
  maxChannelsPerUser?: number;
  logger?: RealtimeLogger;
  presenceStore?: PresenceStore;
  notificationStore?: NotificationStore;
  enableCompression?: boolean;
  corsOrigins?: string[];
}

export interface PresenceManagerConfig {
  store?: PresenceStore;
  staleTimeout?: number; // ms - time before considering a user stale
  cleanupInterval?: number; // ms - interval for cleanup job
  logger?: RealtimeLogger;
}

export interface NotificationDispatcherConfig {
  store?: NotificationStore;
  maxRetries?: number;
  retryDelay?: number; // ms
  batchSize?: number;
  logger?: RealtimeLogger;
}
