/**
 * Streaming Accumulator with Thinking Extraction
 *
 * Streams AI responses and extracts the "thinking" field in real-time
 * while accumulating the complete response for JSON parsing and quality scoring.
 *
 * Uses a simple state machine to detect `"thinking": "..."` within the
 * streaming JSON response. Thinking chunks are emitted via callback as
 * they arrive, giving users real-time visibility into SAM's reasoning.
 *
 * Falls back transparently to blocking `chat()` if streaming is unavailable.
 */

import { runSAMChatWithPreference, runSAMChatStream } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface StreamWithThinkingOptions {
  /** User ID for SAM AI provider routing */
  userId: string;
  /** Chat messages to send */
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  /** System prompt for the AI */
  systemPrompt?: string;
  /** Maximum tokens for the response */
  maxTokens?: number;
  /** Temperature for generation */
  temperature?: number;
  /** Called with each new chunk of thinking text as it streams in */
  onThinkingChunk?: (chunk: string) => void;
}

export interface StreamWithThinkingResult {
  /** Full accumulated response text for JSON parsing */
  fullContent: string;
  /** Extracted thinking text (may be incomplete if extraction failed) */
  thinkingExtracted: string;
}

// ============================================================================
// State Machine for Thinking Extraction
// ============================================================================

type ExtractorState = 'scanning' | 'in_thinking' | 'done';

/**
 * Extracts the "thinking" field from a streaming JSON response.
 *
 * State machine transitions:
 *   scanning → detects `"thinking":"` or `"thinking": "` → in_thinking
 *   in_thinking → accumulates characters until unescaped `"` → done
 *   done → passes through remaining chunks
 */
class ThinkingExtractor {
  private state: ExtractorState = 'scanning';
  private buffer = '';
  private extracted = '';
  private readonly onChunk: (chunk: string) => void;

  constructor(onChunk: (chunk: string) => void) {
    this.onChunk = onChunk;
  }

  /** Feed a new chunk of text into the extractor */
  feed(chunk: string): void {
    if (this.state === 'done') return;

    this.buffer += chunk;

    if (this.state === 'scanning') {
      this.scan();
    }

    if (this.state === 'in_thinking') {
      this.extractThinking();
    }
  }

  /** Get the full extracted thinking text */
  getExtracted(): string {
    return this.extracted;
  }

  private scan(): void {
    // Look for the thinking key pattern: "thinking": " or "thinking":"
    const patterns = ['"thinking": "', '"thinking":"'];

    for (const pattern of patterns) {
      const idx = this.buffer.indexOf(pattern);
      if (idx !== -1) {
        // Move past the pattern — now we're inside the thinking value
        this.buffer = this.buffer.substring(idx + pattern.length);
        this.state = 'in_thinking';
        return;
      }
    }

    // Keep only the last 20 chars for pattern matching across chunk boundaries
    if (this.buffer.length > 20) {
      this.buffer = this.buffer.substring(this.buffer.length - 20);
    }
  }

  private extractThinking(): void {
    let i = 0;
    let pendingChunk = '';

    while (i < this.buffer.length) {
      const char = this.buffer[i];

      // Check for escaped quote
      if (char === '\\' && i + 1 < this.buffer.length) {
        const nextChar = this.buffer[i + 1];
        if (nextChar === '"') {
          pendingChunk += '"';
          this.extracted += '"';
          i += 2;
          continue;
        }
        if (nextChar === 'n') {
          pendingChunk += '\n';
          this.extracted += '\n';
          i += 2;
          continue;
        }
        if (nextChar === '\\') {
          pendingChunk += '\\';
          this.extracted += '\\';
          i += 2;
          continue;
        }
      }

      // Unescaped quote = end of thinking value
      if (char === '"') {
        // Emit any remaining pending chunk
        if (pendingChunk) {
          this.onChunk(pendingChunk);
        }
        this.state = 'done';
        this.buffer = '';
        return;
      }

      pendingChunk += char;
      this.extracted += char;
      i++;
    }

    // Emit accumulated chunk and clear buffer
    if (pendingChunk) {
      this.onChunk(pendingChunk);
    }
    this.buffer = '';
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Streams an AI response, extracting thinking in real-time.
 *
 * If `chatStream` is not available on the adapter, falls back to
 * blocking `chat()` with no behavior change.
 */
export async function streamWithThinkingExtraction(
  options: StreamWithThinkingOptions
): Promise<StreamWithThinkingResult> {
  const { userId, messages, systemPrompt, maxTokens, temperature, onThinkingChunk } = options;

  // Stream and accumulate via SAM unified AI provider
  const extractor = new ThinkingExtractor(onThinkingChunk ?? (() => {}));
  let fullContent = '';

  try {
    const stream = runSAMChatStream({
      userId,
      capability: 'course',
      messages,
      systemPrompt,
      maxTokens,
      temperature,
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content;
        extractor.feed(chunk.content);
      }

      if (chunk.done) break;
    }
  } catch (error) {
    // If streaming fails, fall back to blocking call
    if (!fullContent) {
      logger.debug('[STREAMING] Stream failed, falling back to runSAMChatWithPreference()');
      try {
        const response = await runSAMChatWithPreference({
          userId,
          capability: 'course',
          messages,
          systemPrompt,
          maxTokens,
          temperature,
        });
        return {
          fullContent: response,
          thinkingExtracted: '',
        };
      } catch (fallbackError) {
        logger.warn('[STREAMING] Fallback also failed', fallbackError);
      }
    } else {
      logger.warn('[STREAMING] Stream interrupted, using accumulated content', error);
    }
  }

  return {
    fullContent,
    thinkingExtracted: extractor.getExtracted(),
  };
}
