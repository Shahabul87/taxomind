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
// HOOK IMPLEMENTATION
// ============================================================================
export function useSAMMemory(options = {}) {
    const { debug = false } = options;
    // State
    const [searchResults, setSearchResults] = useState([]);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [error, setError] = useState(null);
    // Loading states
    const [isSearching, setIsSearching] = useState(false);
    const [isStoringMemory, setIsStoringMemory] = useState(false);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);
    const mountedRef = useRef(true);
    // ============================================================================
    // API HELPERS
    // ============================================================================
    const apiCall = useCallback(async (url, options) => {
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Network error';
            return { success: false, error: message };
        }
    }, []);
    const log = useCallback((message, data) => {
        if (debug) {
            console.log(`[useSAMMemory] ${message}`, data ?? '');
        }
    }, [debug]);
    // ============================================================================
    // SEARCH
    // ============================================================================
    const searchMemories = useCallback(async (query, type, searchOptions) => {
        setIsSearching(true);
        setError(null);
        log('Searching memories', { query, type, searchOptions });
        const result = await apiCall('/api/sam/agentic/memory/search', {
            method: 'POST',
            body: JSON.stringify({
                query,
                type,
                ...searchOptions,
            }),
        });
        if (mountedRef.current) {
            if (result.success && result.data) {
                const results = result.data.results || [];
                setSearchResults(results);
                log('Search complete', { count: results.length });
                setIsSearching(false);
                return results;
            }
            else {
                setError(result.error || 'Search failed');
                setIsSearching(false);
                return [];
            }
        }
        return [];
    }, [apiCall, log]);
    // ============================================================================
    // LONG-TERM MEMORY
    // ============================================================================
    const storeMemory = useCallback(async (data) => {
        setIsStoringMemory(true);
        setError(null);
        log('Storing memory', data);
        const result = await apiCall('/api/sam/agentic/memory/store', {
            method: 'POST',
            body: JSON.stringify({
                type: 'memory',
                ...data,
            }),
        });
        if (mountedRef.current) {
            setIsStoringMemory(false);
            if (result.success && result.data) {
                log('Memory stored', { id: result.data.id });
                return result.data.id;
            }
            else {
                setError(result.error || 'Failed to store memory');
                return null;
            }
        }
        return null;
    }, [apiCall, log]);
    // ============================================================================
    // CONVERSATION
    // ============================================================================
    const storeConversation = useCallback(async (data) => {
        setError(null);
        log('Storing conversation turn', data);
        const result = await apiCall('/api/sam/agentic/memory/conversation', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (result.success && result.data) {
            log('Conversation turn stored', { id: result.data.id });
            return result.data.id;
        }
        else {
            setError(result.error || 'Failed to store conversation');
            return null;
        }
    }, [apiCall, log]);
    const getConversationContext = useCallback(async (sessionId, maxTurns = 20) => {
        setIsLoadingConversation(true);
        setError(null);
        log('Getting conversation context', { sessionId, maxTurns });
        const result = await apiCall(`/api/sam/agentic/memory/conversation?sessionId=${sessionId}&maxTurns=${maxTurns}`);
        if (mountedRef.current) {
            setIsLoadingConversation(false);
            if (result.success && result.data) {
                const turns = result.data.turns || [];
                setConversationHistory(turns);
                log('Conversation context loaded', { count: turns.length });
                return turns;
            }
            else {
                setError(result.error || 'Failed to load conversation context');
                return [];
            }
        }
        return [];
    }, [apiCall, log]);
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
