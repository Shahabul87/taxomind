/**
 * @sam-ai/educational - Memory Engine
 * Conversation context management, memory enrichment, and personalized context generation
 */
import type { MemoryEngineConfig, MemoryConversationContext, MemoryConversationSummary, MemoryPersonalizedContext, MemoryConversationHistory, MemoryInitOptions, MemoryHistoryOptions, MemoryEngine as IMemoryEngine } from '../types';
/**
 * MemoryEngine - Manages conversation context, memory enrichment, and personalized learning
 *
 * Features:
 * - Conversation initialization and resumption
 * - Message storage with memory enrichment
 * - Personalized context generation
 * - Contextual prompt generation for AI
 * - Conversation summaries
 * - Memory caching and relevance scoring
 * - User pattern analysis
 */
export declare class MemoryEngine implements IMemoryEngine {
    private config;
    private context;
    private database?;
    private memoryCache;
    constructor(context: MemoryConversationContext, config: MemoryEngineConfig);
    /**
     * Initialize or resume a conversation
     */
    initializeConversation(options?: MemoryInitOptions): Promise<string>;
    /**
     * Add a message with memory enrichment
     */
    addMessageWithMemory(role: string, content: string, metadata?: Record<string, string | number | boolean>): Promise<string>;
    /**
     * Get conversation history with context
     */
    getConversationHistory(options?: MemoryHistoryOptions): Promise<MemoryConversationHistory>;
    /**
     * Get personalized context for user
     */
    getPersonalizedContext(): Promise<MemoryPersonalizedContext>;
    /**
     * Generate contextual prompt for AI
     */
    generateContextualPrompt(userMessage: string): Promise<string>;
    /**
     * Get conversation summaries
     */
    getConversationSummaries(limit?: number): Promise<MemoryConversationSummary[]>;
    private getDefaultContext;
    private generateConversationTitle;
    private addContextualWelcomeMessage;
    private enrichMessageWithMemory;
    private updateMemoryFromMessage;
    private getRelevantMemories;
    /**
     * BM25 relevance scoring with term frequency, inverse document frequency,
     * and document length normalization.
     *
     * Parameters: k1=1.2, b=0.75 (standard BM25 defaults)
     */
    private calculateRelevanceScore;
    /** Corpus statistics cache for BM25 IDF computation */
    private bm25CorpusCache;
    private getBM25CorpusStats;
    private extractTopicsFromConversations;
    private extractTopicsFromMessages;
    private extractGoalsFromMessages;
    private extractInsightsFromMessages;
    private extractAssistanceFromMessages;
    private extractMainTopic;
    private extractGoal;
    private extractInsight;
    private extractAssistanceType;
    private getOngoingProjects;
    private analyzeUserPatterns;
    private updateUserPreferencesFromMessage;
    private trackAssistanceProvided;
}
/**
 * Factory function to create a MemoryEngine instance
 */
export declare function createMemoryEngine(context: MemoryConversationContext, config: MemoryEngineConfig): MemoryEngine;
//# sourceMappingURL=memory-engine.d.ts.map