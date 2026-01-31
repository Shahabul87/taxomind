/**
 * @sam-ai/vanilla — Framework-agnostic SAM AI SDK
 *
 * Zero dependencies. Works in browser, Node.js, Deno, and Bun.
 *
 * @example
 * ```typescript
 * import { SAMClient } from '@sam-ai/vanilla';
 *
 * const sam = new SAMClient({
 *   baseUrl: 'http://localhost:4000',
 *   userId: 'user-123',
 * });
 *
 * const response = await sam.chat('Help me understand recursion');
 * console.log(response.data.message);
 *
 * // Real-time events
 * sam.subscribe('intervention', (event) => {
 *   console.log('Intervention:', event.payload);
 * });
 * ```
 */

export { SAMClient, SAMApiError } from './client';
export { SAMEventStream } from './event-stream';
export type {
  SAMClientOptions,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  Goal,
  GoalCreateRequest,
  Conversation,
  SSEEvent,
  EventCallback,
} from './types';
