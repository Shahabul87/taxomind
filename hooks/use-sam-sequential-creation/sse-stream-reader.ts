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
/** Maximum buffer size (512KB) to prevent unbounded memory growth on malformed streams */
const MAX_BUFFER_SIZE = 512 * 1024;

/**
 * Stall timeout (60s) — 4x the server heartbeat interval (15s).
 * If no data arrives for this duration, the connection is considered silently
 * dropped and the reader is cancelled so auto-reconnect can trigger.
 */
const STALL_TIMEOUT_MS = 60_000;

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

  // ── Stall detection: cancel reader if no data arrives for 60s ──
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  const resetStallTimer = () => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      // Force cancel the reader — triggers done=true on next read()
      reader.cancel('Stream stall detected (no data for 60s)').catch(() => {});
    }, STALL_TIMEOUT_MS);
  };
  resetStallTimer();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Flush remaining buffer — the final chunk may contain terminal events
        // (e.g. "complete") that arrived with the stream-close signal.
        const finalFlush = buffer + decoder.decode(); // flush decoder state
        if (finalFlush.trim().length > 0) {
          const events = parseSSEChunk(finalFlush);
          for (const sseEvent of events) {
            const eventResult = handleSSEEvent(sseEvent, ctx);
            if (eventResult.result) finalResult = eventResult.result;
            if (eventResult.gotComplete) gotComplete = true;
            if (eventResult.gotError) gotError = true;
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      resetStallTimer();

      // Prevent unbounded buffer growth from malformed streams
      if (buffer.length > MAX_BUFFER_SIZE) {
        buffer = buffer.substring(buffer.length - Math.floor(MAX_BUFFER_SIZE / 2));
      }

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
        // Stop processing further events after a terminal event
        if (gotComplete || gotError) break;
      }

      // Stop reading the stream after a terminal event
      if (gotComplete || gotError) break;
    }
  } finally {
    if (stallTimer) clearTimeout(stallTimer);
  }

  return { result: finalResult, gotComplete, gotError };
}
