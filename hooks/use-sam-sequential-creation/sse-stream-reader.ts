/**
 * SSE Stream Reader — Reads a fetch Response body as an SSE event stream.
 *
 * Buffers incoming chunks, splits on double-newline boundaries, and
 * delegates each complete SSE event to `handleSSEEvent()`.
 */

import type { SequentialCreationResult } from '@/lib/sam/course-creation/types';
import type { SSEHandlerContext } from './types';
import { parseSSEChunk, handleSSEEvent } from './sse-event-handler';

/** Result of reading an entire SSE stream to completion */
export interface StreamReadResult {
  result: SequentialCreationResult;
  gotComplete: boolean;
  gotError: boolean;
}

/**
 * Read an SSE stream and process events through the shared handler.
 * Returns the final result and flags for whether complete/error events were received.
 */
export async function readSSEStream(
  response: Response,
  ctx: SSEHandlerContext,
): Promise<StreamReadResult> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  let finalResult: SequentialCreationResult = {
    success: false,
    error: 'Stream ended without completion event',
  };
  let gotComplete = false;
  let gotError = false;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete events from the buffer
    const lastDoubleNewline = buffer.lastIndexOf('\n\n');
    if (lastDoubleNewline === -1) continue;

    const completePart = buffer.substring(0, lastDoubleNewline + 2);
    buffer = buffer.substring(lastDoubleNewline + 2);

    const events = parseSSEChunk(completePart);

    for (const sseEvent of events) {
      const eventResult = handleSSEEvent(sseEvent, ctx);
      if (eventResult.result) {
        finalResult = eventResult.result;
      }
      if (eventResult.gotComplete) gotComplete = true;
      if (eventResult.gotError) gotError = true;
    }
  }

  return { result: finalResult, gotComplete, gotError };
}
