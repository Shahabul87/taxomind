/**
 * Conversation Threading Service
 *
 * Provides threading, branching, topic detection, and auto-summarization
 * for SAM conversations.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createUserScopedAdapter } from '@/lib/ai/user-scoped-adapter';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import type { SAMThreadType } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

interface ThreadInfo {
  id: string;
  topic: string | null;
  threadType: SAMThreadType;
  messageCount: number;
  startedAt: Date;
  isActive: boolean;
}

interface ThreadTree {
  root: ThreadInfo;
  children: ThreadTree[];
}

interface TopicDetectionResult {
  topic: string;
  confidence: number;
  keywords: string[];
}

// =============================================================================
// CONVERSATION THREADING SERVICE
// =============================================================================

export class ConversationThreadingService {
  /**
   * Create a new thread branching from an existing conversation
   */
  async createThread(
    parentConversationId: string,
    userId: string,
    options: {
      topic?: string;
      threadType?: SAMThreadType;
      courseId?: string;
    } = {}
  ): Promise<{ id: string; topic: string | null }> {
    const parent = await db.sAMConversation.findFirst({
      where: { id: parentConversationId, userId },
    });

    if (!parent) {
      throw new Error('Parent conversation not found');
    }

    const thread = await db.sAMConversation.create({
      data: {
        userId,
        sessionId: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        courseId: options.courseId ?? parent.courseId,
        chapterId: parent.chapterId,
        sectionId: parent.sectionId,
        tutorMode: parent.tutorMode,
        parentConversationId,
        threadType: options.threadType ?? 'BRANCH',
        topic: options.topic ?? null,
        isActive: true,
      },
    });

    logger.info('[ConversationThreading] Thread created', {
      threadId: thread.id,
      parentId: parentConversationId,
      topic: options.topic,
    });

    return { id: thread.id, topic: thread.topic };
  }

  /**
   * Detect topic from message content using keyword extraction
   */
  async detectTopic(messages: string[]): Promise<TopicDetectionResult> {
    if (messages.length === 0) {
      return { topic: 'General', confidence: 0, keywords: [] };
    }

    const combined = messages.join(' ').toLowerCase();

    // Keyword-based topic detection (fast, no AI call needed)
    const topicPatterns: Array<{ pattern: RegExp; topic: string; keywords: string[] }> = [
      { pattern: /\b(exam|quiz|test|assessment|grade)\b/i, topic: 'Assessment & Testing', keywords: ['exam', 'quiz', 'test'] },
      { pattern: /\b(progress|performance|score|improve)\b/i, topic: 'Progress & Performance', keywords: ['progress', 'performance'] },
      { pattern: /\b(concept|explain|understand|learn|study)\b/i, topic: 'Learning & Understanding', keywords: ['concept', 'study'] },
      { pattern: /\b(practice|exercise|problem|solve)\b/i, topic: 'Practice & Exercises', keywords: ['practice', 'exercise'] },
      { pattern: /\b(plan|goal|schedule|roadmap)\b/i, topic: 'Planning & Goals', keywords: ['plan', 'goal'] },
      { pattern: /\b(create|generate|build|write)\b/i, topic: 'Content Creation', keywords: ['create', 'generate'] },
      { pattern: /\b(help|stuck|confused|don't understand)\b/i, topic: 'Help & Support', keywords: ['help', 'stuck'] },
      { pattern: /\b(review|revise|recap|summary)\b/i, topic: 'Review & Revision', keywords: ['review', 'revise'] },
    ];

    let bestMatch: TopicDetectionResult = { topic: 'General Discussion', confidence: 0.3, keywords: [] };

    for (const { pattern, topic, keywords } of topicPatterns) {
      const matches = combined.match(pattern);
      if (matches) {
        const matchCount = (combined.match(new RegExp(pattern.source, 'gi')) ?? []).length;
        const confidence = Math.min(0.5 + matchCount * 0.1, 0.95);
        if (confidence > bestMatch.confidence) {
          bestMatch = { topic, confidence, keywords };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Auto-summarize a conversation
   */
  async autoSummarize(conversationId: string, userId?: string): Promise<string> {
    const conversation = await db.sAMConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (!conversation || conversation.messages.length === 0) {
      return 'No messages to summarize.';
    }

    // Resolve the userId: prefer param, then conversation owner
    const resolvedUserId = userId ?? conversation.userId;

    // Try AI-based summarization
    try {
      const aiAdapter = await createUserScopedAdapter(resolvedUserId, 'chat');

      const messageText = conversation.messages
        .map((m) => `${m.messageType}: ${m.content}`)
        .join('\n');

      const prompt = `Summarize this learning conversation in 1-2 sentences. Focus on the main topic and key outcomes:\n\n${messageText.slice(0, 2000)}`;

      const summary = await withRetryableTimeout(
        async () => {
          const result = await aiAdapter.chat({
            messages: [{ role: 'user', content: prompt }],
            maxTokens: 150,
            temperature: 0.3,
          });
          return result.content;
        },
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'conversationSummarize',
        1
      );

      // Persist the summary
      await db.sAMConversation.update({
        where: { id: conversationId },
        data: { summary },
      });

      return summary;
    } catch (error) {
      logger.debug('[ConversationThreading] AI summarization failed, using fallback', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Fallback: extract first user message as summary
    const firstUserMsg = conversation.messages.find((m) => m.messageType === 'USER_MESSAGE');
    const fallback = firstUserMsg
      ? firstUserMsg.content.slice(0, 200)
      : conversation.messages[0].content.slice(0, 200);

    await db.sAMConversation.update({
      where: { id: conversationId },
      data: { summary: fallback },
    });

    return fallback;
  }

  /**
   * Get thread tree starting from a root conversation
   */
  async getThreadTree(rootId: string, userId: string): Promise<ThreadTree | null> {
    const root = await db.sAMConversation.findFirst({
      where: { id: rootId, userId },
      include: { messages: { select: { id: true } } },
    });

    if (!root) return null;

    const rootInfo: ThreadInfo = {
      id: root.id,
      topic: root.topic,
      threadType: root.threadType,
      messageCount: root.messages.length,
      startedAt: root.startedAt,
      isActive: root.isActive,
    };

    const children = await this.getChildThreads(rootId, userId);

    return { root: rootInfo, children };
  }

  /**
   * Get all threads for a conversation (flat list, paginated)
   */
  async getThreads(
    conversationId: string,
    userId: string,
    options: { cursor?: string; limit?: number } = {}
  ): Promise<{ threads: ThreadInfo[]; nextCursor: string | undefined }> {
    const limit = options.limit ?? 20;

    const threads = await db.sAMConversation.findMany({
      where: {
        parentConversationId: conversationId,
        userId,
      },
      include: { messages: { select: { id: true } } },
      orderBy: { startedAt: 'desc' },
      take: limit + 1,
      ...(options.cursor && { cursor: { id: options.cursor }, skip: 1 }),
    });

    const hasMore = threads.length > limit;
    const items = hasMore ? threads.slice(0, limit) : threads;

    return {
      threads: items.map((t) => ({
        id: t.id,
        topic: t.topic,
        threadType: t.threadType,
        messageCount: t.messages.length,
        startedAt: t.startedAt,
        isActive: t.isActive,
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1].id : undefined,
    };
  }

  /**
   * Detect if a topic has drifted significantly from the current conversation
   */
  async hasTopicDrifted(
    conversationId: string,
    newMessage: string
  ): Promise<{ drifted: boolean; newTopic: string | null; confidence: number }> {
    const conversation = await db.sAMConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { content: true, messageType: true },
        },
      },
    });

    if (!conversation || conversation.messages.length < 3) {
      return { drifted: false, newTopic: null, confidence: 0 };
    }

    const recentMessages = conversation.messages
      .filter((m) => m.messageType === 'USER_MESSAGE')
      .map((m) => m.content);

    const currentTopicResult = await this.detectTopic(recentMessages);
    const newTopicResult = await this.detectTopic([newMessage]);

    // Topic drift if new message topic differs from current with sufficient confidence
    if (
      newTopicResult.confidence > 0.6 &&
      currentTopicResult.topic !== newTopicResult.topic &&
      currentTopicResult.confidence > 0.5
    ) {
      return {
        drifted: true,
        newTopic: newTopicResult.topic,
        confidence: newTopicResult.confidence,
      };
    }

    return { drifted: false, newTopic: null, confidence: 0 };
  }

  /**
   * Merge two threads into one
   */
  async mergeThreads(
    sourceId: string,
    targetId: string,
    userId: string
  ): Promise<{ success: boolean; mergedMessageCount: number }> {
    const [source, target] = await Promise.all([
      db.sAMConversation.findFirst({
        where: { id: sourceId, userId },
        include: { messages: true },
      }),
      db.sAMConversation.findFirst({
        where: { id: targetId, userId },
      }),
    ]);

    if (!source || !target) {
      throw new Error('Source or target conversation not found');
    }

    // Move all messages from source to target
    await db.$transaction([
      db.sAMMessage.updateMany({
        where: { conversationId: sourceId },
        data: { conversationId: targetId },
      }),
      db.sAMConversation.update({
        where: { id: targetId },
        data: {
          totalMessages: { increment: source.totalMessages },
          tags: {
            set: [...new Set([...target.tags, ...source.tags])],
          },
        },
      }),
      db.sAMConversation.update({
        where: { id: sourceId },
        data: { isActive: false, endedAt: new Date() },
      }),
    ]);

    logger.info('[ConversationThreading] Threads merged', {
      sourceId,
      targetId,
      messagesMoved: source.messages.length,
    });

    return { success: true, mergedMessageCount: source.messages.length };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async getChildThreads(parentId: string, userId: string): Promise<ThreadTree[]> {
    const children = await db.sAMConversation.findMany({
      where: { parentConversationId: parentId, userId },
      include: { messages: { select: { id: true } } },
      orderBy: { startedAt: 'asc' },
      take: 50,
    });

    const trees: ThreadTree[] = [];
    for (const child of children) {
      const childInfo: ThreadInfo = {
        id: child.id,
        topic: child.topic,
        threadType: child.threadType,
        messageCount: child.messages.length,
        startedAt: child.startedAt,
        isActive: child.isActive,
      };
      const grandchildren = await this.getChildThreads(child.id, userId);
      trees.push({ root: childInfo, children: grandchildren });
    }

    return trees;
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let threadingService: ConversationThreadingService | null = null;

export function getConversationThreadingService(): ConversationThreadingService {
  if (!threadingService) {
    threadingService = new ConversationThreadingService();
  }
  return threadingService;
}
