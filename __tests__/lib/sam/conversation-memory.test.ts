/**
 * Tests for lib/sam/conversation-memory.ts
 *
 * Verifies loadCrossSessionHistory, buildCrossSessionSummary,
 * and persistConversationTurn.
 */

// Add sAMConversationMemory model to the global db mock since it is not
// included in jest.setup.js createMockPrismaClient model list.
import { db } from '@/lib/db';

const mockConvMemory = {
  findMany: jest.fn().mockResolvedValue([]),
  findFirst: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ id: '1' }),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
};

// Attach the missing model to the global db mock
(db as Record<string, unknown>).sAMConversationMemory = mockConvMemory;

import {
  loadCrossSessionHistory,
  buildCrossSessionSummary,
  persistConversationTurn,
} from '@/lib/sam/conversation-memory';

const mockDb = db as unknown as {
  sAMConversationMemory: typeof mockConvMemory;
};

describe('conversation-memory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default implementations after clearAllMocks
    mockConvMemory.findMany.mockResolvedValue([]);
    mockConvMemory.findFirst.mockResolvedValue(null);
    mockConvMemory.create.mockResolvedValue({ id: '1' });
  });

  describe('loadCrossSessionHistory', () => {
    it('should load messages from the database', async () => {
      const mockMessages = [
        { role: 'USER', content: 'Hello', turnNumber: 1, intent: null, sessionId: 's1', createdAt: new Date() },
        { role: 'ASSISTANT', content: 'Hi!', turnNumber: 2, intent: 'greeting', sessionId: 's1', createdAt: new Date() },
      ];
      (mockDb.sAMConversationMemory.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await loadCrossSessionHistory('user-1');
      expect(result.messages).toHaveLength(2);
      expect(result.sessionCount).toBe(1);
    });

    it('should filter by courseId when provided', async () => {
      (mockDb.sAMConversationMemory.findMany as jest.Mock).mockResolvedValue([]);

      await loadCrossSessionHistory('user-1', 'course-1');
      expect(mockDb.sAMConversationMemory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            metadata: { path: ['courseId'], equals: 'course-1' },
          }),
        }),
      );
    });

    it('should return empty result on error', async () => {
      (mockDb.sAMConversationMemory.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      const result = await loadCrossSessionHistory('user-1');
      expect(result.messages).toHaveLength(0);
      expect(result.sessionCount).toBe(0);
    });

    it('should count distinct sessions', async () => {
      const mockMessages = [
        { role: 'USER', content: 'A', turnNumber: 1, intent: null, sessionId: 's1', createdAt: new Date() },
        { role: 'USER', content: 'B', turnNumber: 1, intent: null, sessionId: 's2', createdAt: new Date() },
        { role: 'USER', content: 'C', turnNumber: 2, intent: null, sessionId: 's1', createdAt: new Date() },
      ];
      (mockDb.sAMConversationMemory.findMany as jest.Mock).mockResolvedValue(mockMessages);

      const result = await loadCrossSessionHistory('user-1');
      expect(result.sessionCount).toBe(2);
    });
  });

  describe('buildCrossSessionSummary', () => {
    it('should return empty string for no messages', () => {
      expect(buildCrossSessionSummary([])).toBe('');
    });

    it('should build summary from messages with intents', () => {
      const messages = [
        { role: 'USER', content: 'How to learn React?', turnNumber: 1, intent: 'learning-help', sessionId: 's1', createdAt: new Date('2025-01-15') },
      ];
      const summary = buildCrossSessionSummary(messages);
      expect(summary).toContain('Previous sessions:');
      expect(summary).toContain('learning-help');
    });

    it('should use user messages as topics when no intents', () => {
      const messages = [
        { role: 'USER', content: 'Explain JavaScript closures', turnNumber: 1, intent: null, sessionId: 's1', createdAt: new Date('2025-01-15') },
      ];
      const summary = buildCrossSessionSummary(messages);
      expect(summary).toContain('Previous sessions:');
      expect(summary).toContain('Explain JavaScript closures');
    });

    it('should limit to last 3 sessions', () => {
      const messages = [
        { role: 'USER', content: 'A', turnNumber: 1, intent: null, sessionId: 's1', createdAt: new Date('2025-01-10') },
        { role: 'USER', content: 'B', turnNumber: 1, intent: null, sessionId: 's2', createdAt: new Date('2025-01-11') },
        { role: 'USER', content: 'C', turnNumber: 1, intent: null, sessionId: 's3', createdAt: new Date('2025-01-12') },
        { role: 'USER', content: 'D', turnNumber: 1, intent: null, sessionId: 's4', createdAt: new Date('2025-01-13') },
      ];
      const summary = buildCrossSessionSummary(messages);
      // Should show up to 3 sessions, not 4
      expect(summary.split('[').length - 1).toBeLessThanOrEqual(3);
    });
  });

  describe('persistConversationTurn', () => {
    it('should persist a user turn to the database', async () => {
      (mockDb.sAMConversationMemory.findFirst as jest.Mock).mockResolvedValue(null);
      (mockDb.sAMConversationMemory.create as jest.Mock).mockResolvedValue({ id: '1' });

      await persistConversationTurn('user-1', 'session-1', 'USER', 'Hello SAM');
      expect(mockDb.sAMConversationMemory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            sessionId: 'session-1',
            role: 'USER',
            turnNumber: 1,
          }),
        }),
      );
    });

    it('should increment turn number based on last turn', async () => {
      (mockDb.sAMConversationMemory.findFirst as jest.Mock).mockResolvedValue({ turnNumber: 3 });
      (mockDb.sAMConversationMemory.create as jest.Mock).mockResolvedValue({ id: '2' });

      await persistConversationTurn('user-1', 'session-1', 'ASSISTANT', 'Response');
      expect(mockDb.sAMConversationMemory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            turnNumber: 4,
          }),
        }),
      );
    });

    it('should not throw on error (non-blocking)', async () => {
      (mockDb.sAMConversationMemory.findFirst as jest.Mock).mockRejectedValue(new Error('fail'));
      await expect(persistConversationTurn('user-1', 'session-1', 'USER', 'Hello')).resolves.not.toThrow();
    });

    it('should cap content at 10000 characters', async () => {
      (mockDb.sAMConversationMemory.findFirst as jest.Mock).mockResolvedValue(null);
      (mockDb.sAMConversationMemory.create as jest.Mock).mockResolvedValue({ id: '3' });

      const longContent = 'x'.repeat(20000);
      await persistConversationTurn('user-1', 'session-1', 'USER', longContent);
      expect(mockDb.sAMConversationMemory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: expect.any(String),
          }),
        }),
      );
      const callData = (mockDb.sAMConversationMemory.create as jest.Mock).mock.calls[0][0].data;
      expect(callData.content.length).toBe(10000);
    });
  });
});
