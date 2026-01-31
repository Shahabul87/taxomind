/**
 * Framework-agnostic SAM AI types
 */

export interface SAMClientOptions {
  /** Base URL of the SAM API (e.g., http://localhost:4000) */
  baseUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** User ID for requests */
  userId: string;
  /** Default timeout in milliseconds */
  timeoutMs?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  courseId?: string | null;
  conversationId?: string | null;
}

export interface ChatResponse {
  success: boolean;
  data: {
    message: string;
    suggestions: string[];
    conversationId: string;
  };
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
  createdAt: string;
}

export interface GoalCreateRequest {
  title: string;
  description?: string;
  courseId?: string;
}

export interface Conversation {
  id: string;
  topic: string | null;
  messageCount: number;
  isActive: boolean;
  startedAt: string;
}

export interface SSEEvent {
  type: string;
  eventId?: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
}

export type EventCallback = (event: SSEEvent) => void;
