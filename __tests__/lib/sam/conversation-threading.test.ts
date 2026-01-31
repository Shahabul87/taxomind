/**
 * Tests for ConversationThreadingService (Gap 1)
 *
 * Verifies thread creation, topic detection, and topic drift detection.
 */

jest.mock('@/lib/db', () => ({
  db: {
    sAMConversation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/lib/sam/integration-adapters', () => ({
  getCoreAIAdapter: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn(),
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

import { db } from '@/lib/db';
import {
  ConversationThreadingService,
  getConversationThreadingService,
} from '@/lib/sam/services/conversation-threading';

const mockDb = db as jest.Mocked<typeof db>;

describe('ConversationThreadingService', () => {
  let service: ConversationThreadingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConversationThreadingService();
  });

  describe('detectTopic', () => {
    it('should detect assessment-related topics', async () => {
      const result = await service.detectTopic([
        'I need to prepare for my exam tomorrow',
        'Can you help me with the quiz?',
      ]);

      expect(result.topic).toBe('Assessment & Testing');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.keywords).toContain('exam');
    });

    it('should detect learning topics', async () => {
      const result = await service.detectTopic([
        'I want to understand how recursion works',
        'Can you explain the concept of closures?',
      ]);

      expect(result.topic).toBe('Learning & Understanding');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect practice topics', async () => {
      const result = await service.detectTopic([
        'Give me some practice problems to solve',
      ]);

      expect(result.topic).toBe('Practice & Exercises');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect planning topics', async () => {
      const result = await service.detectTopic([
        'I need a plan with a goal and a schedule for my roadmap',
      ]);

      expect(result.topic).toBe('Planning & Goals');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect content creation topics', async () => {
      const result = await service.detectTopic([
        'Generate a summary document and create flashcards',
      ]);

      expect(result.topic).toBe('Content Creation');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect help topics', async () => {
      const result = await service.detectTopic([
        "I'm stuck and confused, I need help with this",
      ]);

      expect(result.topic).toBe('Help & Support');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect review topics', async () => {
      const result = await service.detectTopic([
        'Can you review this and give me a summary recap?',
      ]);

      expect(result.topic).toBe('Review & Revision');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should return General for unmatched topics', async () => {
      const result = await service.detectTopic(['Hello there']);

      expect(result.topic).toBe('General Discussion');
      expect(result.confidence).toBeLessThanOrEqual(0.3);
    });

    it('should return General for empty messages', async () => {
      const result = await service.detectTopic([]);

      expect(result.topic).toBe('General');
      expect(result.confidence).toBe(0);
      expect(result.keywords).toEqual([]);
    });
  });

  describe('createThread', () => {
    it('should create a thread linked to the parent conversation', async () => {
      (mockDb.sAMConversation.findFirst as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        userId: 'user-1',
        courseId: 'course-1',
        chapterId: null,
        sectionId: null,
        tutorMode: 'SOCRATIC',
      });

      (mockDb.sAMConversation.create as jest.Mock).mockResolvedValue({
        id: 'thread-1',
        parentConversationId: 'parent-1',
        threadType: 'BRANCH',
        topic: 'programming',
        userId: 'user-1',
        courseId: 'course-1',
      });

      const result = await service.createThread('parent-1', 'user-1', {
        topic: 'programming',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('thread-1');
      expect(mockDb.sAMConversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentConversationId: 'parent-1',
            threadType: 'BRANCH',
            topic: 'programming',
          }),
        })
      );
    });

    it('should throw if parent conversation not found', async () => {
      (mockDb.sAMConversation.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createThread('nonexistent', 'user-1')
      ).rejects.toThrow('Parent conversation not found');
    });

    it('should throw if user does not own the conversation', async () => {
      // findFirst with where: { id, userId } returns null when userId doesn't match
      (mockDb.sAMConversation.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createThread('parent-1', 'user-1')
      ).rejects.toThrow('Parent conversation not found');
    });

    it('should default to BRANCH thread type', async () => {
      (mockDb.sAMConversation.findFirst as jest.Mock).mockResolvedValue({
        id: 'parent-1',
        userId: 'user-1',
        courseId: null,
        chapterId: null,
        sectionId: null,
        tutorMode: 'DIRECT',
      });

      (mockDb.sAMConversation.create as jest.Mock).mockResolvedValue({
        id: 'thread-2',
        topic: null,
      });

      await service.createThread('parent-1', 'user-1');

      expect(mockDb.sAMConversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            threadType: 'BRANCH',
          }),
        })
      );
    });
  });

  describe('hasTopicDrifted', () => {
    it('should detect drift when topic changes significantly', async () => {
      (mockDb.sAMConversation.findUnique as jest.Mock).mockResolvedValue({
        id: 'conv-1',
        messages: [
          { content: 'How do I solve this practice problem?', messageType: 'USER_MESSAGE' },
          { content: 'Let me help with the exercise.', messageType: 'AI_RESPONSE' },
          { content: 'Another practice problem please', messageType: 'USER_MESSAGE' },
          { content: 'Here is another exercise.', messageType: 'AI_RESPONSE' },
          { content: 'I want to solve more problems', messageType: 'USER_MESSAGE' },
        ],
      });

      const result = await service.hasTopicDrifted(
        'conv-1',
        'I need to prepare for my exam and take a quiz to test myself'
      );

      expect(result).toEqual(
        expect.objectContaining({
          drifted: expect.any(Boolean),
          newTopic: expect.anything(),
          confidence: expect.any(Number),
        })
      );
    });

    it('should not drift when same topic continues', async () => {
      (mockDb.sAMConversation.findUnique as jest.Mock).mockResolvedValue({
        id: 'conv-1',
        messages: [
          { content: 'Help me study this concept', messageType: 'USER_MESSAGE' },
          { content: 'Sure, let me explain...', messageType: 'AI_RESPONSE' },
          { content: 'I want to understand more', messageType: 'USER_MESSAGE' },
          { content: 'Great question...', messageType: 'AI_RESPONSE' },
          { content: 'Can you explain further?', messageType: 'USER_MESSAGE' },
        ],
      });

      const result = await service.hasTopicDrifted(
        'conv-1',
        'I want to learn and understand this concept better'
      );

      expect(result.drifted).toBe(false);
    });

    it('should return false when fewer than 3 messages exist', async () => {
      (mockDb.sAMConversation.findUnique as jest.Mock).mockResolvedValue({
        id: 'conv-1',
        messages: [
          { content: 'Hello', messageType: 'USER_MESSAGE' },
          { content: 'Hi!', messageType: 'AI_RESPONSE' },
        ],
      });

      const result = await service.hasTopicDrifted('conv-1', 'New topic entirely');

      expect(result.drifted).toBe(false);
      expect(result.newTopic).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should return false when conversation not found', async () => {
      (mockDb.sAMConversation.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.hasTopicDrifted('nonexistent', 'Hello');

      expect(result.drifted).toBe(false);
      expect(result.newTopic).toBeNull();
    });
  });

  describe('getThreads', () => {
    it('should return threads with cursor-based pagination', async () => {
      const now = new Date();
      (mockDb.sAMConversation.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'thread-1',
          topic: 'Assessment & Testing',
          threadType: 'BRANCH',
          startedAt: now,
          isActive: true,
          messages: [{ id: 'msg-1' }, { id: 'msg-2' }],
        },
        {
          id: 'thread-2',
          topic: 'Planning & Goals',
          threadType: 'FOLLOW_UP',
          startedAt: now,
          isActive: true,
          messages: [{ id: 'msg-3' }],
        },
      ]);

      const result = await service.getThreads('conv-1', 'user-1');

      expect(result.threads).toHaveLength(2);
      expect(result.threads[0].id).toBe('thread-1');
      expect(result.threads[0].messageCount).toBe(2);
      expect(result.threads[1].messageCount).toBe(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should return empty threads list when none exist', async () => {
      (mockDb.sAMConversation.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getThreads('conv-1', 'user-1');

      expect(result.threads).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe('autoSummarize', () => {
    it('should use fallback when no AI adapter available', async () => {
      (mockDb.sAMConversation.findUnique as jest.Mock).mockResolvedValue({
        id: 'conv-1',
        messages: [
          { messageType: 'USER_MESSAGE', content: 'I want to learn about recursion in programming', createdAt: new Date() },
          { messageType: 'AI_RESPONSE', content: 'Recursion is when a function calls itself...', createdAt: new Date() },
        ],
      });

      (mockDb.sAMConversation.update as jest.Mock).mockResolvedValue({
        id: 'conv-1',
        summary: 'I want to learn about recursion in programming',
      });

      const summary = await service.autoSummarize('conv-1');

      expect(summary).toBe('I want to learn about recursion in programming');
      expect(mockDb.sAMConversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1' },
          data: expect.objectContaining({
            summary: expect.any(String),
          }),
        })
      );
    });

    it('should return fallback message for empty conversations', async () => {
      (mockDb.sAMConversation.findUnique as jest.Mock).mockResolvedValue({
        id: 'conv-1',
        messages: [],
      });

      const summary = await service.autoSummarize('conv-1');

      expect(summary).toBe('No messages to summarize.');
    });

    it('should return fallback for missing conversation', async () => {
      (mockDb.sAMConversation.findUnique as jest.Mock).mockResolvedValue(null);

      const summary = await service.autoSummarize('nonexistent');

      expect(summary).toBe('No messages to summarize.');
    });
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const a = getConversationThreadingService();
      const b = getConversationThreadingService();
      expect(a).toBe(b);
    });
  });
});
