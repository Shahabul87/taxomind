/**
 * Chat Memory Integration Service
 *
 * Integrates semantic memory retrieval and storage with SAM chat.
 * Provides context enrichment from past interactions and learning events.
 */

import { logger } from '@/lib/logger';
import { getPgVectorSearchService } from './pgvector-search';
import type {
  LongTermMemorySearchResult,
  ConversationMemorySearchResult,
} from './pgvector-search';

// ==========================================
// TYPES
// ==========================================

export interface MemoryContext {
  relevantMemories: LongTermMemorySearchResult[];
  recentConversations: ConversationMemorySearchResult[];
  userPreferences: string[];
  learningHistory: string[];
}

export interface ChatMemoryInput {
  userId: string;
  sessionId: string;
  message: string;
  role: 'USER' | 'ASSISTANT';
  turnNumber: number;
  courseId?: string;
  intent?: string;
  sentiment?: number;
}

export interface MemoryExtractionResult {
  shouldStore: boolean;
  memoryType?: 'INTERACTION' | 'LEARNING_EVENT' | 'STRUGGLE_POINT' | 'PREFERENCE' | 'FEEDBACK';
  title?: string;
  content?: string;
  importance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tags?: string[];
}

// ==========================================
// MEMORY CONTEXT BUILDER
// ==========================================

/**
 * Retrieves relevant memory context for a chat message
 */
export async function getMemoryContext(
  userId: string,
  message: string,
  options: {
    sessionId?: string;
    courseId?: string;
    maxMemories?: number;
    maxConversations?: number;
    minScore?: number;
  } = {}
): Promise<MemoryContext> {
  const searchService = getPgVectorSearchService();
  const maxMemories = options.maxMemories ?? 5;
  const maxConversations = options.maxConversations ?? 3;
  const minScore = options.minScore ?? 0.7;

  try {
    // Search for relevant long-term memories and recent conversations in parallel
    const [memories, conversations] = await Promise.all([
      searchService.searchLongTermMemories(userId, message, {
        topK: maxMemories,
        minScore,
        courseId: options.courseId,
      }),
      searchService.searchConversationMemories(userId, message, {
        topK: maxConversations,
        minScore,
      }),
    ]);

    // Extract user preferences from memories
    const preferenceMemories = memories.filter((m) => m.type === 'PREFERENCE');
    const userPreferences = preferenceMemories.map((m) => m.content);

    // Extract learning history summaries
    const learningMemories = memories.filter(
      (m) => m.type === 'LEARNING_EVENT' || m.type === 'CONCEPT' || m.type === 'SKILL'
    );
    const learningHistory = learningMemories.map((m) => m.summary ?? m.title);

    logger.debug('[ChatMemory] Retrieved memory context', {
      userId,
      memoriesFound: memories.length,
      conversationsFound: conversations.length,
    });

    return {
      relevantMemories: memories,
      recentConversations: conversations,
      userPreferences,
      learningHistory,
    };
  } catch (error) {
    logger.warn('[ChatMemory] Failed to retrieve memory context', { error, userId });
    return {
      relevantMemories: [],
      recentConversations: [],
      userPreferences: [],
      learningHistory: [],
    };
  }
}

/**
 * Formats memory context for inclusion in system prompt
 */
export function formatMemoryForPrompt(memoryContext: MemoryContext): string {
  const parts: string[] = [];

  // Add relevant memories
  if (memoryContext.relevantMemories.length > 0) {
    parts.push('**Relevant Past Interactions:**');
    for (const memory of memoryContext.relevantMemories.slice(0, 3)) {
      const date = memory.createdAt?.toLocaleDateString() ?? 'Recent';
      const contentPreview = memory.summary ?? (memory.content?.slice(0, 150) ?? '');
      parts.push(`- [${date}] ${memory.title}: ${contentPreview}...`);
    }
  }

  // Add user preferences
  if (memoryContext.userPreferences.length > 0) {
    parts.push('\n**User Preferences:**');
    for (const pref of memoryContext.userPreferences.slice(0, 3)) {
      parts.push(`- ${pref.slice(0, 100)}`);
    }
  }

  // Add learning history
  if (memoryContext.learningHistory.length > 0) {
    parts.push('\n**Recent Learning Topics:**');
    for (const topic of memoryContext.learningHistory.slice(0, 5)) {
      parts.push(`- ${topic}`);
    }
  }

  // Add recent conversation context
  if (memoryContext.recentConversations.length > 0) {
    parts.push('\n**Related Past Conversations:**');
    for (const conv of memoryContext.recentConversations.slice(0, 2)) {
      parts.push(`- "${conv.content.slice(0, 100)}..." (relevance: ${(conv.score * 100).toFixed(0)}%)`);
    }
  }

  if (parts.length === 0) {
    return '';
  }

  return `\n\n**Memory Context (Use this to personalize your response):**\n${parts.join('\n')}`;
}

// ==========================================
// CONVERSATION STORAGE
// ==========================================

/**
 * Stores a conversation turn with embedding
 */
export async function storeConversationTurn(input: ChatMemoryInput): Promise<string | null> {
  try {
    const searchService = getPgVectorSearchService();

    const id = await searchService.storeConversationMemory({
      userId: input.userId,
      sessionId: input.sessionId,
      role: input.role,
      content: input.message,
      turnNumber: input.turnNumber,
      intent: input.intent,
      sentiment: input.sentiment,
    });

    logger.debug('[ChatMemory] Stored conversation turn', {
      id,
      userId: input.userId,
      sessionId: input.sessionId,
      role: input.role,
    });

    return id;
  } catch (error) {
    logger.warn('[ChatMemory] Failed to store conversation turn', { error });
    return null;
  }
}

// ==========================================
// MEMORY EXTRACTION
// ==========================================

/**
 * Analyzes a conversation exchange to determine if it should be stored as long-term memory
 */
export function analyzeForMemoryExtraction(
  userMessage: string,
  assistantResponse: string,
  context?: {
    emotion?: string;
    bloomsLevel?: string;
    courseId?: string;
  }
): MemoryExtractionResult {
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = assistantResponse.toLowerCase();

  // Detect struggle points
  const struggleIndicators = [
    'confused', 'don\'t understand', 'help me', 'struggling',
    'difficult', 'hard to', 'can\'t figure', 'lost', 'stuck'
  ];
  const isStruggle = struggleIndicators.some((ind) => lowerMessage.includes(ind));

  if (isStruggle) {
    return {
      shouldStore: true,
      memoryType: 'STRUGGLE_POINT',
      title: `Struggled with: ${userMessage.slice(0, 50)}`,
      content: `User question: ${userMessage}\n\nAssistant help: ${assistantResponse.slice(0, 500)}`,
      importance: 'HIGH',
      tags: ['struggle', 'needs-followup'],
    };
  }

  // Detect learning events (successful explanations)
  const learningIndicators = [
    'i understand now', 'that makes sense', 'got it', 'thank you',
    'helpful', 'learned', 'now i know', 'clear now'
  ];
  const isLearning = learningIndicators.some((ind) => lowerMessage.includes(ind));

  if (isLearning) {
    return {
      shouldStore: true,
      memoryType: 'LEARNING_EVENT',
      title: `Learned: ${extractTopicFromResponse(assistantResponse)}`,
      content: `User confirmed understanding: ${userMessage}\n\nExplanation that worked: ${assistantResponse.slice(0, 500)}`,
      importance: 'MEDIUM',
      tags: ['learning', 'success'],
    };
  }

  // Detect preference statements
  const preferenceIndicators = [
    'i prefer', 'i like', 'i want', 'i need', 'my style',
    'works better for me', 'easier for me', 'i learn better'
  ];
  const isPreference = preferenceIndicators.some((ind) => lowerMessage.includes(ind));

  if (isPreference) {
    return {
      shouldStore: true,
      memoryType: 'PREFERENCE',
      title: 'Learning Preference',
      content: userMessage,
      importance: 'MEDIUM',
      tags: ['preference', 'personalization'],
    };
  }

  // Detect feedback
  const feedbackIndicators = [
    'feedback', 'suggestion', 'could be better', 'improve',
    'not helpful', 'too fast', 'too slow', 'too complex'
  ];
  const isFeedback = feedbackIndicators.some((ind) => lowerMessage.includes(ind));

  if (isFeedback) {
    return {
      shouldStore: true,
      memoryType: 'FEEDBACK',
      title: 'User Feedback',
      content: userMessage,
      importance: 'HIGH',
      tags: ['feedback', 'improvement'],
    };
  }

  // Detect significant interactions based on context
  if (context?.emotion === 'frustrated' || context?.emotion === 'confused') {
    return {
      shouldStore: true,
      memoryType: 'INTERACTION',
      title: `Emotional moment: ${context.emotion}`,
      content: `User (${context.emotion}): ${userMessage}\n\nResponse: ${assistantResponse.slice(0, 300)}`,
      importance: 'MEDIUM',
      tags: [context.emotion, 'emotional'],
    };
  }

  // Default: don't store routine interactions
  return { shouldStore: false };
}

/**
 * Stores extracted memory if analysis indicates it should be stored
 */
export async function storeExtractedMemory(
  userId: string,
  extraction: MemoryExtractionResult,
  courseId?: string
): Promise<string | null> {
  if (!extraction.shouldStore || !extraction.memoryType || !extraction.title || !extraction.content) {
    return null;
  }

  try {
    const searchService = getPgVectorSearchService();

    const id = await searchService.storeLongTermMemory({
      userId,
      type: extraction.memoryType,
      title: extraction.title,
      content: extraction.content,
      importance: extraction.importance,
      courseId,
      tags: extraction.tags,
    });

    logger.info('[ChatMemory] Stored extracted memory', {
      id,
      userId,
      type: extraction.memoryType,
      title: extraction.title,
    });

    return id;
  } catch (error) {
    logger.warn('[ChatMemory] Failed to store extracted memory', { error });
    return null;
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function extractTopicFromResponse(response: string): string {
  // Try to extract a meaningful topic from the response
  const sentences = response.split(/[.!?]/);
  const firstSentence = sentences[0]?.trim() ?? '';

  if (firstSentence.length > 10 && firstSentence.length < 80) {
    return firstSentence;
  }

  // Fallback: use first 50 chars
  return response.slice(0, 50).trim() + '...';
}

// ==========================================
// COMBINED INTEGRATION FUNCTION
// ==========================================

/**
 * Full memory integration for a chat turn
 * Call this after generating a response
 */
export async function processChatWithMemory(
  userId: string,
  sessionId: string,
  userMessage: string,
  assistantResponse: string,
  turnNumber: number,
  options?: {
    courseId?: string;
    emotion?: string;
    bloomsLevel?: string;
  }
): Promise<{
  userMemoryId: string | null;
  assistantMemoryId: string | null;
  extractedMemoryId: string | null;
}> {
  // Store user message
  const userMemoryId = await storeConversationTurn({
    userId,
    sessionId,
    message: userMessage,
    role: 'USER',
    turnNumber,
    courseId: options?.courseId,
  });

  // Store assistant response
  const assistantMemoryId = await storeConversationTurn({
    userId,
    sessionId,
    message: assistantResponse,
    role: 'ASSISTANT',
    turnNumber: turnNumber + 1,
    courseId: options?.courseId,
  });

  // Analyze and potentially store as long-term memory
  const extraction = analyzeForMemoryExtraction(userMessage, assistantResponse, options);
  const extractedMemoryId = await storeExtractedMemory(userId, extraction, options?.courseId);

  return {
    userMemoryId,
    assistantMemoryId,
    extractedMemoryId,
  };
}
