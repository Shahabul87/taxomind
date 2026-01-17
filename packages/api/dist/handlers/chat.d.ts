/**
 * @sam-ai/api - Chat Handler
 * Handles chat/conversation requests with SAM AI
 *
 * UPDATED: Now uses Unified Blooms Engine from @sam-ai/educational
 * for AI-powered cognitive level analysis instead of keyword-only
 */
import type { SAMConfig } from '@sam-ai/core';
import type { SAMApiRequest, SAMHandler, SAMHandlerContext } from '../types';
/**
 * Create chat handler
 */
export declare function createChatHandler(config: SAMConfig): SAMHandler;
/**
 * Create streaming chat handler (for future use)
 */
export declare function createStreamingChatHandler(config: SAMConfig): (request: SAMApiRequest, context: SAMHandlerContext, onChunk: (chunk: string) => void) => Promise<void>;
//# sourceMappingURL=chat.d.ts.map