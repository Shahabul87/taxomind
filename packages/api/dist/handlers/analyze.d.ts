/**
 * @sam-ai/api - Analyze Handler
 * Handles content analysis requests
 *
 * UPDATED: Now uses Unified Blooms Engine from @sam-ai/educational
 * for AI-powered cognitive level analysis instead of keyword-only
 */
import type { SAMConfig, BloomsAnalysis } from '@sam-ai/core';
import type { SAMHandler } from '../types';
/**
 * Create analyze handler
 */
export declare function createAnalyzeHandler(config: SAMConfig): SAMHandler;
/**
 * Quick Bloom's analysis utility using unified engine
 */
export declare function analyzeBloomsLevel(config: SAMConfig, content: string): Promise<BloomsAnalysis | null>;
//# sourceMappingURL=analyze.d.ts.map