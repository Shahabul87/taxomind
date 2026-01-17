/**
 * SAM Engine Core
 * Main orchestrator for the SAM AI Assistant
 *
 * @deprecated This package is DEPRECATED in favor of the new @sam-ai/* packages.
 *
 * Migration Guide:
 * - Goal Planning & Tool Execution: Use `@sam-ai/agentic`
 * - Orchestration & AI Adapters: Use `@sam-ai/core`
 * - Educational Engines: Use `@sam-ai/educational`
 * - Memory & Mastery: Use `@sam-ai/memory`
 * - Pedagogy (Bloom's, ZPD): Use `@sam-ai/pedagogy`
 * - React Hooks: Use `@sam-ai/react`
 * - API Routes: Use `@sam-ai/api`
 *
 * Integration in Taxomind:
 * - All stores are centralized in `lib/sam/taxomind-context.ts`
 * - Use `getTaxomindContext()` or `getStore()` for store access
 * - See `codebase-memory/architecture/SAM_AGENTIC_ARCHITECTURE.md` for details
 *
 * This package contains placeholder AI providers and will NOT be maintained.
 * The new @sam-ai/* packages provide full production implementations.
 *
 * @version 1.0.0 (DEPRECATED - DO NOT USE IN NEW CODE)
 */
import { BaseEngine } from './base-engine';
import type { SAMContext, SAMResponse, SAMEngineConfig, Message, SAMPlugin, SAMEventHandler, SAMEventType } from './types';
/**
 * @deprecated Use @sam-ai/agentic and @sam-ai/core instead.
 * This class will be removed in a future version.
 */
export declare class SAMEngine extends BaseEngine {
    name: string;
    private conversations;
    private plugins;
    private eventHandlers;
    private featureFlags;
    private aiProvider;
    constructor(config?: SAMEngineConfig);
    /**
     * Initialize SAM Engine
     */
    protected performInitialization(): Promise<void>;
    /**
     * Process a message with context
     */
    process(context: SAMContext, message: string): Promise<SAMResponse>;
    /**
     * Generate AI response
     */
    private generateResponse;
    /**
     * Build AI prompt
     */
    private buildPrompt;
    /**
     * Format context for prompt
     */
    private formatContext;
    /**
     * Format conversation history
     */
    private formatConversationHistory;
    /**
     * Format plugin responses
     */
    private formatPluginResponses;
    /**
     * Parse AI response
     */
    private parseAIResponse;
    /**
     * Generate fallback response
     */
    private generateFallbackResponse;
    /**
     * Generate default suggestions
     */
    private generateDefaultSuggestions;
    /**
     * Get or create conversation
     */
    private getOrCreateConversation;
    /**
     * Save conversation to storage
     */
    private saveConversation;
    /**
     * Load conversations from storage
     */
    private loadConversations;
    /**
     * Register a plugin
     */
    registerPlugin(plugin: SAMPlugin): Promise<void>;
    /**
     * Unregister a plugin
     */
    unregisterPlugin(name: string): Promise<void>;
    /**
     * Event emitter
     */
    emit(type: SAMEventType, data?: any): Promise<void>;
    /**
     * Event listener
     */
    on(type: SAMEventType, handler: SAMEventHandler): void;
    /**
     * Remove event listener
     */
    off(type: SAMEventType, handler: SAMEventHandler): void;
    /**
     * Get conversation history
     */
    getConversationHistory(userId: string, courseId?: string): Promise<Message[]>;
    /**
     * Clear conversation
     */
    clearConversation(userId: string, courseId?: string): Promise<void>;
    /**
     * Extract feature flags from config
     */
    private extractFeatureFlags;
    /**
     * Initialize AI Provider
     */
    private initializeAIProvider;
    /**
     * Destroy engine and cleanup
     */
    destroy(): Promise<void>;
}
//# sourceMappingURL=sam-engine.d.ts.map