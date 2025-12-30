/**
 * @sam-ai/adapter-prisma - Memory Store Tests
 * Tests for PrismaMemoryStore
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaMemoryStore, createPrismaMemoryStore } from '../memory-store';
import { createMockPrismaClient, createSampleMemoryEntry } from './setup';
import type { MemoryEntry } from '../memory-store';

describe('PrismaMemoryStore', () => {
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;
  let store: PrismaMemoryStore;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    store = new PrismaMemoryStore({ prisma: mockPrisma });
    vi.clearAllMocks();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should use default table name', () => {
      const store = new PrismaMemoryStore({ prisma: mockPrisma });
      expect(store).toBeDefined();
    });

    it('should accept custom table name', () => {
      const store = new PrismaMemoryStore({
        prisma: mockPrisma,
        tableName: 'customMemory',
      });
      expect(store).toBeDefined();
    });
  });

  // ============================================================================
  // SAVE TESTS
  // ============================================================================

  describe('save', () => {
    it('should save a memory entry', async () => {
      const entry: MemoryEntry = {
        id: 'memory-1',
        studentId: 'student-1',
        type: 'insight',
        importance: 'high',
        content: 'Student learns best with visual aids',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      await store.save(entry);

      expect(mockPrisma.memoryEntry.upsert).toHaveBeenCalledWith({
        where: { id: 'memory-1' },
        create: entry,
        update: expect.objectContaining({
          content: 'Student learns best with visual aids',
          updatedAt: expect.any(Date),
        }),
      });
    });

    it('should save entry with metadata', async () => {
      const entry: MemoryEntry = {
        id: 'memory-2',
        studentId: 'student-1',
        type: 'preference',
        importance: 'medium',
        content: 'Prefers morning study sessions',
        metadata: { timeSlot: 'morning', duration: 60 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      await store.save(entry);

      expect(mockPrisma.memoryEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            metadata: { timeSlot: 'morning', duration: 60 },
          }),
        })
      );
    });

    it('should save entry with expiration', async () => {
      const expiresAt = new Date('2024-12-31');
      const entry: MemoryEntry = {
        id: 'memory-3',
        studentId: 'student-1',
        type: 'context',
        importance: 'low',
        content: 'Temporary session context',
        expiresAt,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      await store.save(entry);

      expect(mockPrisma.memoryEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            expiresAt,
          }),
        })
      );
    });
  });

  // ============================================================================
  // GET TESTS
  // ============================================================================

  describe('get', () => {
    it('should return memory entry by id', async () => {
      const mockEntry = createSampleMemoryEntry({ id: 'memory-1' });
      mockPrisma.memoryEntry.findUnique.mockResolvedValue(mockEntry);

      const result = await store.get('memory-1');

      expect(mockPrisma.memoryEntry.findUnique).toHaveBeenCalledWith({
        where: { id: 'memory-1' },
      });
      expect(result).toEqual(mockEntry);
    });

    it('should return null for non-existent entry', async () => {
      mockPrisma.memoryEntry.findUnique.mockResolvedValue(null);

      const result = await store.get('non-existent');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // GET BY STUDENT TESTS
  // ============================================================================

  describe('getByStudent', () => {
    it('should return entries for student', async () => {
      const mockEntries = [
        createSampleMemoryEntry({ id: 'memory-1', studentId: 'student-1' }),
        createSampleMemoryEntry({ id: 'memory-2', studentId: 'student-1' }),
      ];
      mockPrisma.memoryEntry.findMany.mockResolvedValue(mockEntries);

      const result = await store.getByStudent('student-1');

      expect(mockPrisma.memoryEntry.findMany).toHaveBeenCalledWith({
        where: {
          studentId: 'student-1',
          type: undefined,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by type', async () => {
      mockPrisma.memoryEntry.findMany.mockResolvedValue([]);

      await store.getByStudent('student-1', { type: 'insight' });

      expect(mockPrisma.memoryEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'insight',
          }),
        })
      );
    });

    it('should respect limit option', async () => {
      mockPrisma.memoryEntry.findMany.mockResolvedValue([]);

      await store.getByStudent('student-1', { limit: 10 });

      expect(mockPrisma.memoryEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should use default limit of 100', async () => {
      mockPrisma.memoryEntry.findMany.mockResolvedValue([]);

      await store.getByStudent('student-1');

      expect(mockPrisma.memoryEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });
  });

  // ============================================================================
  // SEARCH TESTS
  // ============================================================================

  describe('search', () => {
    it('should search entries by content', async () => {
      const mockEntries = [
        createSampleMemoryEntry({
          id: 'memory-1',
          content: 'Visual learning preference',
        }),
      ];
      mockPrisma.memoryEntry.findMany.mockResolvedValue(mockEntries);

      const result = await store.search('student-1', 'visual');

      expect(mockPrisma.memoryEntry.findMany).toHaveBeenCalledWith({
        where: {
          studentId: 'student-1',
          content: { contains: 'visual', mode: 'insensitive' },
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        },
        orderBy: { importance: 'desc' },
        take: 20,
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no matches', async () => {
      mockPrisma.memoryEntry.findMany.mockResolvedValue([]);

      const result = await store.search('student-1', 'nonexistent');

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // DELETE TESTS
  // ============================================================================

  describe('delete', () => {
    it('should delete entry by id', async () => {
      await store.delete('memory-1');

      expect(mockPrisma.memoryEntry.delete).toHaveBeenCalledWith({
        where: { id: 'memory-1' },
      });
    });
  });

  // ============================================================================
  // PRUNE EXPIRED TESTS
  // ============================================================================

  describe('pruneExpired', () => {
    it('should delete expired entries', async () => {
      mockPrisma.memoryEntry.deleteMany.mockResolvedValue({ count: 5 });

      const result = await store.pruneExpired();

      expect(mockPrisma.memoryEntry.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when no expired entries', async () => {
      mockPrisma.memoryEntry.deleteMany.mockResolvedValue({ count: 0 });

      const result = await store.pruneExpired();

      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('createPrismaMemoryStore', () => {
    it('should create PrismaMemoryStore instance', () => {
      const store = createPrismaMemoryStore({ prisma: mockPrisma });

      expect(store).toBeInstanceOf(PrismaMemoryStore);
    });
  });
});
