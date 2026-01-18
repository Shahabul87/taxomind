/**
 * @sam-ai/integration - Realtime Adapter Interface
 * Abstract real-time communication for portability
 */
import { z } from 'zod';
/**
 * Connection state
 */
export declare const ConnectionState: {
    readonly CONNECTING: "connecting";
    readonly CONNECTED: "connected";
    readonly DISCONNECTED: "disconnected";
    readonly RECONNECTING: "reconnecting";
    readonly ERROR: "error";
};
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
    /**
     * Subscribe to event type
     */
    subscribe<T = unknown>(eventType: string, callback: (event: RealtimeEvent<T>) => void): EventSubscription;
    /**
     * Subscribe to room events
     */
    subscribeToRoom<T = unknown>(roomId: string, eventType: string, callback: (event: RealtimeEvent<T>) => void): EventSubscription;
    /**
     * Unsubscribe from event
     */
    unsubscribe(subscriptionId: string): void;
    /**
     * Emit event
     */
    emit<T = unknown>(eventType: string, data: T, options?: {
        roomId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Emit to specific users
     */
    emitToUsers<T = unknown>(userIds: string[], eventType: string, data: T): Promise<void>;
    /**
     * Join a room
     */
    joinRoom(roomId: string, options?: {
        metadata?: Record<string, unknown>;
    }): Promise<RealtimeRoom>;
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
    getRoomPresence(roomId: string): Promise<Array<{
        userId: string;
        presence: PresenceState;
    }>>;
    /**
     * Subscribe to presence changes in room
     */
    subscribeToPresence(roomId: string, callback: (event: {
        type: 'join' | 'leave' | 'update';
        userId: string;
        presence?: PresenceState;
    }) => void): EventSubscription;
    /**
     * Listen to connection state changes
     */
    onConnectionStateChange(callback: (state: ConnectionState) => void): () => void;
    /**
     * Listen to errors
     */
    onError(callback: (error: Error) => void): () => void;
}
/**
 * SAM realtime event types
 */
export declare const SAMRealtimeEventType: {
    readonly CHAT_MESSAGE: "sam:chat:message";
    readonly CHAT_TYPING: "sam:chat:typing";
    readonly CHAT_STREAM_START: "sam:chat:stream:start";
    readonly CHAT_STREAM_CHUNK: "sam:chat:stream:chunk";
    readonly CHAT_STREAM_END: "sam:chat:stream:end";
    readonly INTERVENTION_TRIGGERED: "sam:intervention:triggered";
    readonly CHECKIN_SCHEDULED: "sam:checkin:scheduled";
    readonly CHECKIN_DUE: "sam:checkin:due";
    readonly GOAL_UPDATED: "sam:goal:updated";
    readonly PLAN_STEP_COMPLETED: "sam:plan:step:completed";
    readonly SKILL_LEVELED_UP: "sam:skill:leveled_up";
    readonly NOTIFICATION: "sam:notification";
    readonly RECOMMENDATION: "sam:recommendation";
    readonly USER_ONLINE: "sam:presence:online";
    readonly USER_OFFLINE: "sam:presence:offline";
    readonly USER_ACTIVE: "sam:presence:active";
    readonly USER_IDLE: "sam:presence:idle";
};
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
    toolCalls?: Array<{
        id: string;
        name: string;
        status: string;
    }>;
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
    streamChatResponse(sessionId: string, responseId: string, stream: AsyncIterable<string>): Promise<void>;
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
    onChatMessage(callback: (event: RealtimeEvent<{
        content: string;
        role: string;
    }>) => void): EventSubscription;
    /**
     * Listen to stream chunks
     */
    onStreamChunk(callback: (chunk: SAMStreamChunk) => void): EventSubscription;
    /**
     * Listen to interventions
     */
    onIntervention(callback: (intervention: SAMInterventionEvent) => void): EventSubscription;
}
export declare const PresenceStateSchema: z.ZodObject<{
    state: z.ZodString;
    onlineAt: z.ZodDate;
    lastActiveAt: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    state: string;
    onlineAt: Date;
    lastActiveAt: Date;
    metadata?: Record<string, unknown> | undefined;
}, {
    state: string;
    onlineAt: Date;
    lastActiveAt: Date;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const RealtimeRoomSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["public", "private", "presence"]>;
    memberCount: z.ZodNumber;
    createdAt: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    type: "public" | "private" | "presence";
    createdAt: Date;
    memberCount: number;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    name: string;
    type: "public" | "private" | "presence";
    createdAt: Date;
    memberCount: number;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const RealtimeEventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    data: z.ZodUnknown;
    senderId: z.ZodOptional<z.ZodString>;
    roomId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    timestamp: Date;
    metadata?: Record<string, unknown> | undefined;
    data?: unknown;
    senderId?: string | undefined;
    roomId?: string | undefined;
}, {
    id: string;
    type: string;
    timestamp: Date;
    metadata?: Record<string, unknown> | undefined;
    data?: unknown;
    senderId?: string | undefined;
    roomId?: string | undefined;
}>;
export declare const SAMStreamChunkSchema: z.ZodObject<{
    id: z.ZodString;
    sessionId: z.ZodString;
    content: z.ZodString;
    isComplete: z.ZodBoolean;
    confidence: z.ZodOptional<z.ZodNumber>;
    toolCalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        status: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        status: string;
    }, {
        id: string;
        name: string;
        status: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    content: string;
    sessionId: string;
    isComplete: boolean;
    toolCalls?: {
        id: string;
        name: string;
        status: string;
    }[] | undefined;
    confidence?: number | undefined;
}, {
    id: string;
    content: string;
    sessionId: string;
    isComplete: boolean;
    toolCalls?: {
        id: string;
        name: string;
        status: string;
    }[] | undefined;
    confidence?: number | undefined;
}>;
//# sourceMappingURL=realtime.d.ts.map