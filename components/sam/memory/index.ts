/**
 * SAM Memory Components
 *
 * UI components for interacting with SAM's memory system.
 *
 * Components:
 * - MemorySearchPanel: Full search interface for memories, embeddings, conversations
 * - ConversationHistory: View past conversation context
 * - MemoryInsightsWidget: Compact widget showing contextual insights
 */

export { MemorySearchPanel } from './MemorySearchPanel';
export { ConversationHistory } from './ConversationHistory';
export { MemoryInsightsWidget } from './MemoryInsightsWidget';

// Re-export types from hook for convenience
export type {
  MemorySearchResult,
  LongTermMemory,
  ConversationTurn,
  MemorySearchOptions,
  StoreMemoryData,
  StoreConversationData,
} from '@sam-ai/react';
