/**
 * Cross-Session Conversation Memory
 *
 * Loads and persists conversation history across sessions so SAM can
 * reference what was discussed in previous sessions. Uses the existing
 * SAMConversationMemory Prisma model.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

interface ConversationMessage {
  role: string;
  content: string;
  turnNumber: number;
  intent: string | null;
  sessionId: string;
  createdAt: Date;
}

export interface CrossSessionContext {
  messages: ConversationMessage[];
  sessionCount: number;
}

interface PersistMetadata {
  intent?: string;
  courseId?: string;
  modeId?: string;
  bloomsLevel?: string;
  qualityScore?: number;
}

// =============================================================================
// MAX CHARACTER BUDGET FOR SUMMARY (~500 tokens ≈ 2000 chars)
// =============================================================================

const MAX_SUMMARY_CHARS = 2000;

// =============================================================================
// LOAD CROSS-SESSION HISTORY
// =============================================================================

/**
 * Load recent conversation messages from previous sessions for a user.
 */
export async function loadCrossSessionHistory(
  userId: string,
  courseId?: string,
  limit = 20,
): Promise<CrossSessionContext> {
  try {
    const whereClause: Record<string, unknown> = { userId };

    // If courseId provided, filter by metadata containing that courseId
    if (courseId) {
      whereClause.metadata = {
        path: ['courseId'],
        equals: courseId,
      };
    }

    const messages = await db.sAMConversationMemory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        role: true,
        content: true,
        turnNumber: true,
        intent: true,
        sessionId: true,
        createdAt: true,
      },
    });

    // Count distinct sessions
    const uniqueSessions = new Set(messages.map((m) => m.sessionId));

    return {
      messages: messages.reverse().map((m) => ({
        role: m.role,
        content: m.content,
        turnNumber: m.turnNumber,
        intent: m.intent,
        sessionId: m.sessionId,
        createdAt: m.createdAt,
      })),
      sessionCount: uniqueSessions.size,
    };
  } catch (error) {
    logger.warn('[CONVERSATION_MEMORY] Failed to load cross-session history:', error);
    return { messages: [], sessionCount: 0 };
  }
}

// =============================================================================
// BUILD CROSS-SESSION SUMMARY
// =============================================================================

/**
 * Build a concise summary of previous session conversations.
 * Groups messages by session, takes the most recent 2-3 sessions,
 * and formats them as a brief context block.
 */
export function buildCrossSessionSummary(
  messages: ConversationMessage[],
): string {
  if (messages.length === 0) return '';

  // Group messages by session
  const sessionMap = new Map<string, ConversationMessage[]>();
  for (const msg of messages) {
    const existing = sessionMap.get(msg.sessionId) ?? [];
    existing.push(msg);
    sessionMap.set(msg.sessionId, existing);
  }

  // Sort sessions by most recent first, take last 2-3
  const sessions = Array.from(sessionMap.entries())
    .sort((a, b) => {
      const aLatest = a[1][a[1].length - 1]?.createdAt.getTime() ?? 0;
      const bLatest = b[1][b[1].length - 1]?.createdAt.getTime() ?? 0;
      return bLatest - aLatest;
    })
    .slice(0, 3);

  const parts: string[] = [];
  let totalChars = 0;

  for (const [, sessionMessages] of sessions) {
    if (totalChars >= MAX_SUMMARY_CHARS) break;

    const sessionDate = sessionMessages[0]?.createdAt;
    const dateStr = sessionDate
      ? sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Unknown date';

    // Extract topics from intents
    const intents = sessionMessages
      .map((m) => m.intent)
      .filter((i): i is string => !!i);
    const uniqueIntents = [...new Set(intents)];

    // Extract key user messages (first 2 user messages as topic indicators)
    const userMessages = sessionMessages
      .filter((m) => m.role === 'USER')
      .slice(0, 2)
      .map((m) => m.content.substring(0, 80));

    const topicStr = uniqueIntents.length > 0
      ? uniqueIntents.join(', ')
      : userMessages.join('; ');

    const sessionSummary = `[${dateStr}] Topics: ${topicStr}`;

    if (totalChars + sessionSummary.length > MAX_SUMMARY_CHARS) break;

    parts.push(sessionSummary);
    totalChars += sessionSummary.length;
  }

  return parts.length > 0
    ? `Previous sessions:\n${parts.join('\n')}`
    : '';
}

// =============================================================================
// PERSIST CONVERSATION TURN
// =============================================================================

/**
 * Persist a single conversation turn (user message or assistant response)
 * to the database for cross-session memory.
 */
export async function persistConversationTurn(
  userId: string,
  sessionId: string,
  role: 'USER' | 'ASSISTANT',
  content: string,
  metadata?: PersistMetadata,
): Promise<void> {
  try {
    // Get current turn number for this session
    const lastTurn = await db.sAMConversationMemory.findFirst({
      where: { userId, sessionId },
      orderBy: { turnNumber: 'desc' },
      select: { turnNumber: true },
    });

    const turnNumber = (lastTurn?.turnNumber ?? 0) + 1;

    await db.sAMConversationMemory.create({
      data: {
        userId,
        sessionId,
        role,
        content: content.substring(0, 10000), // Cap content to prevent oversized entries
        turnNumber,
        tokenCount: Math.ceil(content.length / 4), // Rough token estimate
        intent: metadata?.intent ?? null,
        metadata: metadata ? (metadata as Record<string, unknown>) : undefined,
      },
    });

    logger.debug('[CONVERSATION_MEMORY] Turn persisted:', {
      userId,
      sessionId,
      role,
      turnNumber,
      contentLength: content.length,
    });
  } catch (error) {
    // Non-blocking — log and continue
    logger.warn('[CONVERSATION_MEMORY] Failed to persist turn:', error);
  }
}
