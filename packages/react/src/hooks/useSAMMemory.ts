/**
 * useSAMMemory Hook
 * Provides React integration for SAM memory APIs
 *
 * Enables UI components to:
 * - Search memories, embeddings, and conversations
 * - Store user memories and preferences
 * - Retrieve conversation context
 */

import { useState, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

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
  memoryType:
    | 'INTERACTION'
    | 'LEARNING_EVENT'
    | 'STRUGGLE_POINT'
    | 'PREFERENCE'
    | 'FEEDBACK'
    | 'CONTEXT'
    | 'CONCEPT'
    | 'SKILL';
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
  // Search
  searchMemories: (
    query: string,
    type: 'embeddings' | 'memories' | 'conversations',
    options?: MemorySearchOptions
  ) => Promise<MemorySearchResult[]>;
  searchResults: MemorySearchResult[];
  isSearching: boolean;

  // Long-term memory
  storeMemory: (data: StoreMemoryData) => Promise<string | null>;
  isStoringMemory: boolean;

  // Conversation
  storeConversation: (data: StoreConversationData) => Promise<string | null>;
  getConversationContext: (
    sessionId: string,
    maxTurns?: number
  ) => Promise<ConversationTurn[]>;
  conversationHistory: ConversationTurn[];
  isLoadingConversation: boolean;

  // Utility
  error: string | null;
  clearError: () => void;
  clearSearchResults: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSAMMemory(
  options: UseSAMMemoryOptions = {}
): UseSAMMemoryReturn {
  const { debug = false } = options;

  // State
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationTurn[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  // Loading states
  const [isSearching, setIsSearching] = useState(false);
  const [isStoringMemory, setIsStoringMemory] = useState(false);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const mountedRef = useRef(true);

  // ============================================================================
  // API HELPERS
  // ============================================================================

  const apiCall = useCallback(
    async <T>(
      url: string,
      options?: RequestInit
    ): Promise<{ success: boolean; data?: T; error?: string }> => {
      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
          ...options,
        });

        const result = await response.json();

        if (!response.ok) {
          return { success: false, error: result.error || 'Request failed' };
        }

        return { success: true, data: result.data ?? result };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: message };
      }
    },
    []
  );

  const log = useCallback(
    (message: string, data?: unknown) => {
      if (debug) {
        console.log(`[useSAMMemory] ${message}`, data ?? '');
      }
    },
    [debug]
  );

  // ============================================================================
  // SEARCH
  // ============================================================================

  const searchMemories = useCallback(
    async (
      query: string,
      type: 'embeddings' | 'memories' | 'conversations',
      searchOptions?: MemorySearchOptions
    ): Promise<MemorySearchResult[]> => {
      setIsSearching(true);
      setError(null);
      log('Searching memories', { query, type, searchOptions });

      const result = await apiCall<{ results: MemorySearchResult[] }>(
        '/api/sam/agentic/memory/search',
        {
          method: 'POST',
          body: JSON.stringify({
            query,
            type,
            ...searchOptions,
          }),
        }
      );

      if (mountedRef.current) {
        if (result.success && result.data) {
          const results = result.data.results || [];
          setSearchResults(results);
          log('Search complete', { count: results.length });
          setIsSearching(false);
          return results;
        } else {
          setError(result.error || 'Search failed');
          setIsSearching(false);
          return [];
        }
      }
      return [];
    },
    [apiCall, log]
  );

  // ============================================================================
  // LONG-TERM MEMORY
  // ============================================================================

  const storeMemory = useCallback(
    async (data: StoreMemoryData): Promise<string | null> => {
      setIsStoringMemory(true);
      setError(null);
      log('Storing memory', data);

      const result = await apiCall<{ id: string }>(
        '/api/sam/agentic/memory/store',
        {
          method: 'POST',
          body: JSON.stringify({
            type: 'memory',
            ...data,
          }),
        }
      );

      if (mountedRef.current) {
        setIsStoringMemory(false);
        if (result.success && result.data) {
          log('Memory stored', { id: result.data.id });
          return result.data.id;
        } else {
          setError(result.error || 'Failed to store memory');
          return null;
        }
      }
      return null;
    },
    [apiCall, log]
  );

  // ============================================================================
  // CONVERSATION
  // ============================================================================

  const storeConversation = useCallback(
    async (data: StoreConversationData): Promise<string | null> => {
      setError(null);
      log('Storing conversation turn', data);

      const result = await apiCall<{ id: string }>(
        '/api/sam/agentic/memory/conversation',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );

      if (result.success && result.data) {
        log('Conversation turn stored', { id: result.data.id });
        return result.data.id;
      } else {
        setError(result.error || 'Failed to store conversation');
        return null;
      }
    },
    [apiCall, log]
  );

  const getConversationContext = useCallback(
    async (
      sessionId: string,
      maxTurns: number = 20
    ): Promise<ConversationTurn[]> => {
      setIsLoadingConversation(true);
      setError(null);
      log('Getting conversation context', { sessionId, maxTurns });

      const result = await apiCall<{ turns: ConversationTurn[] }>(
        `/api/sam/agentic/memory/conversation?sessionId=${sessionId}&maxTurns=${maxTurns}`
      );

      if (mountedRef.current) {
        setIsLoadingConversation(false);
        if (result.success && result.data) {
          const turns = result.data.turns || [];
          setConversationHistory(turns);
          log('Conversation context loaded', { count: turns.length });
          return turns;
        } else {
          setError(result.error || 'Failed to load conversation context');
          return [];
        }
      }
      return [];
    },
    [apiCall, log]
  );

  // ============================================================================
  // UTILITY
  // ============================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    // Search
    searchMemories,
    searchResults,
    isSearching,

    // Long-term memory
    storeMemory,
    isStoringMemory,

    // Conversation
    storeConversation,
    getConversationContext,
    conversationHistory,
    isLoadingConversation,

    // Utility
    error,
    clearError,
    clearSearchResults,
  };
}

export default useSAMMemory;
