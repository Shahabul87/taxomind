/**
 * SAMClient — Framework-agnostic SAM AI client
 *
 * Works in browser, Node.js, Deno, and Bun.
 * Zero framework dependencies — uses only fetch + EventSource.
 *
 * @example
 * ```typescript
 * const client = new SAMClient({
 *   baseUrl: 'http://localhost:4000',
 *   apiKey: 'your-api-key',
 *   userId: 'user-123',
 * });
 *
 * const response = await client.chat('What should I study next?');
 * console.log(response.data.message);
 * ```
 */

import type {
  SAMClientOptions,
  ChatRequest,
  ChatResponse,
  Goal,
  GoalCreateRequest,
  Conversation,
  EventCallback,
} from './types';
import { samFetch, SAMApiError } from './utils/fetch';
import { SAMEventStream } from './event-stream';

export class SAMClient {
  private options: Required<SAMClientOptions>;
  private eventStream: SAMEventStream | null = null;

  constructor(options: SAMClientOptions) {
    this.options = {
      baseUrl: options.baseUrl.replace(/\/$/, ''),
      apiKey: options.apiKey ?? '',
      userId: options.userId,
      timeoutMs: options.timeoutMs ?? 30000,
    };
  }

  // ---------------------------------------------------------------------------
  // Chat
  // ---------------------------------------------------------------------------

  /**
   * Send a chat message and get a response
   */
  async chat(message: string, options?: Partial<ChatRequest>): Promise<ChatResponse> {
    return samFetch<ChatResponse>('/api/sam/chat', {
      ...this.fetchOptions,
      method: 'POST',
      body: {
        message,
        userId: this.options.userId,
        courseId: options?.courseId ?? null,
        conversationId: options?.conversationId ?? null,
      },
    });
  }

  /**
   * Stream chat responses via SSE
   */
  streamChat(
    message: string,
    onEvent: EventCallback,
    options?: Partial<ChatRequest>
  ): () => void {
    // For streaming, connect to SSE and send message
    const stream = this.getEventStream();
    const unsub = stream.subscribe('*', onEvent);

    // Send the chat message
    this.chat(message, options).catch(() => {
      // Error handled by caller
    });

    return unsub;
  }

  // ---------------------------------------------------------------------------
  // Goals
  // ---------------------------------------------------------------------------

  /**
   * Get all goals for the current user
   */
  async getGoals(): Promise<{ goals: Goal[] }> {
    const result = await samFetch<{ success: boolean; data: { goals: Goal[] } }>('/api/sam/goals', {
      ...this.fetchOptions,
      query: { userId: this.options.userId },
    });
    return result.data;
  }

  /**
   * Create a new goal
   */
  async createGoal(goal: GoalCreateRequest): Promise<Goal> {
    const result = await samFetch<{ success: boolean; data: Goal }>('/api/sam/goals', {
      ...this.fetchOptions,
      method: 'POST',
      body: { ...goal, userId: this.options.userId },
    });
    return result.data;
  }

  // ---------------------------------------------------------------------------
  // Conversations
  // ---------------------------------------------------------------------------

  /**
   * Get conversation history
   */
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const result = await samFetch<{ success: boolean; data: { conversations: Conversation[] } }>(
      '/api/sam/conversations',
      {
        ...this.fetchOptions,
        query: { userId: this.options.userId },
      }
    );
    return result.data;
  }

  // ---------------------------------------------------------------------------
  // Real-time Events
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to real-time events
   */
  subscribe(eventType: string, callback: EventCallback): () => void {
    const stream = this.getEventStream();
    return stream.subscribe(eventType, callback);
  }

  /**
   * Connect to real-time event stream
   */
  connectRealtime(): void {
    this.getEventStream().connect();
  }

  /**
   * Disconnect from real-time event stream
   */
  disconnectRealtime(): void {
    this.eventStream?.disconnect();
    this.eventStream = null;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private get fetchOptions() {
    return {
      baseUrl: this.options.baseUrl,
      apiKey: this.options.apiKey || undefined,
      timeoutMs: this.options.timeoutMs,
    };
  }

  private getEventStream(): SAMEventStream {
    if (!this.eventStream) {
      this.eventStream = new SAMEventStream({
        baseUrl: this.options.baseUrl,
        apiKey: this.options.apiKey || undefined,
      });
      this.eventStream.connect();
    }
    return this.eventStream;
  }
}

export { SAMApiError } from './utils/fetch';
