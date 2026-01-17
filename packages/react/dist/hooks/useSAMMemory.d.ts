/**
 * useSAMMemory Hook
 * Provides React integration for SAM memory APIs
 *
 * Enables UI components to:
 * - Search memories, embeddings, and conversations
 * - Store user memories and preferences
 * - Retrieve conversation context
 */
export interface MemorySearchResult {
    id: string;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
}
export interface LongTermMemory {
    id: string;
    memoryType: string;
    title: string;
    content: string;
    summary?: string;
    importance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    courseId?: string;
    createdAt: string;
}
export interface ConversationTurn {
    id: string;
    sessionId: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
    content: string;
    turnNumber: number;
    createdAt: string;
}
export interface MemorySearchOptions {
    /** Number of results to return (1-50, default 10) */
    topK?: number;
    /** Minimum similarity score (0-1) */
    minScore?: number;
    /** Filter by course */
    courseId?: string;
    /** Filter by source types */
    sourceTypes?: string[];
    /** Filter by tags */
    tags?: string[];
    /** Filter by session (for conversations) */
    sessionId?: string;
    /** Filter by memory types (for long-term memories) */
    memoryTypes?: string[];
}
export interface StoreMemoryData {
    memoryType: 'INTERACTION' | 'LEARNING_EVENT' | 'STRUGGLE_POINT' | 'PREFERENCE' | 'FEEDBACK' | 'CONTEXT' | 'CONCEPT' | 'SKILL';
    title: string;
    content: string;
    summary?: string;
    courseId?: string;
    topicIds?: string[];
    importance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    emotionalValence?: number;
    tags?: string[];
    metadata?: Record<string, unknown>;
}
export interface StoreConversationData {
    sessionId: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
    content: string;
    turnNumber: number;
    tokenCount?: number;
    entities?: Array<{
        type: string;
        value: string;
        confidence: number;
    }>;
    intent?: string;
    sentiment?: number;
    metadata?: Record<string, unknown>;
}
export interface UseSAMMemoryOptions {
    /** Enable debug logging */
    debug?: boolean;
}
export interface UseSAMMemoryReturn {
    searchMemories: (query: string, type: 'embeddings' | 'memories' | 'conversations', options?: MemorySearchOptions) => Promise<MemorySearchResult[]>;
    searchResults: MemorySearchResult[];
    isSearching: boolean;
    storeMemory: (data: StoreMemoryData) => Promise<string | null>;
    isStoringMemory: boolean;
    storeConversation: (data: StoreConversationData) => Promise<string | null>;
    getConversationContext: (sessionId: string, maxTurns?: number) => Promise<ConversationTurn[]>;
    conversationHistory: ConversationTurn[];
    isLoadingConversation: boolean;
    error: string | null;
    clearError: () => void;
    clearSearchResults: () => void;
}
export declare function useSAMMemory(options?: UseSAMMemoryOptions): UseSAMMemoryReturn;
export default useSAMMemory;
//# sourceMappingURL=useSAMMemory.d.ts.map