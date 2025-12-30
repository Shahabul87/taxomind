/**
 * @sam-ai/adapter-prisma - Review Schedule Store Tests
 * Tests for PrismaReviewScheduleStore
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaReviewScheduleStore, createPrismaReviewScheduleStore } from '../review-schedule-store';
import { createMockPrismaClient, createSampleReviewSchedule } from './setup';
import type { ReviewScheduleEntry } from '../review-schedule-store';

describe('PrismaReviewScheduleStore', () => {
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;
  let store: PrismaReviewScheduleStore;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    store = new PrismaReviewScheduleStore({ prisma: mockPrisma });
    vi.clearAllMocks();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should use default table name', () => {
      const store = new PrismaReviewScheduleStore({ prisma: mockPrisma });
      expect(store).toBeDefined();
    });

    it('should accept custom table name', () => {
      const store = new PrismaReviewScheduleStore({
        prisma: mockPrisma,
        tableName: 'customReviews',
      });
      expect(store).toBeDefined();
    });
  });

  // ============================================================================
  // SAVE TESTS
  // ============================================================================

  describe('save', () => {
    it('should save a review schedule entry', async () => {
      const entry: ReviewScheduleEntry = {
        id: 'review-1',
        studentId: 'student-1',
        topicId: 'topic-1',
        nextReviewAt: new Date('2024-01-15'),
        interval: 7,
        easeFactor: 2.5,
        repetitions: 3,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-08'),
      };

      await store.save(entry);

      expect(mockPrisma.reviewSchedule.upsert).toHaveBeenCalledWith({
        where: {
          studentId_topicId: { studentId: 'student-1', topicId: 'topic-1' },
        },
        create: entry,
        update: expect.objectContaining({
          interval: 7,
          easeFactor: 2.5,
          updatedAt: expect.any(Date),
        }),
      });
    });

    it('should save entry with lastReviewedAt', async () => {
      const lastReviewedAt = new Date('2024-01-08');
      const entry: ReviewScheduleEntry = {
        id: 'review-2',
        studentId: 'student-1',
        topicId: 'topic-2',
        nextReviewAt: new Date('2024-01-15'),
        interval: 14,
        easeFactor: 2.8,
        repetitions: 5,
        lastReviewedAt,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-08'),
      };

      await store.save(entry);

      expect(mockPrisma.reviewSchedule.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            lastReviewedAt,
          }),
        })
      );
    });
  });

  // ============================================================================
  // GET TESTS
  // ============================================================================

  describe('get', () => {
    it('should return review schedule by studentId and topicId', async () => {
      const mockEntry = createSampleReviewSchedule({
        studentId: 'student-1',
        topicId: 'topic-1',
      });
      mockPrisma.reviewSchedule.findUnique.mockResolvedValue(mockEntry);

      const result = await store.get('student-1', 'topic-1');

      expect(mockPrisma.reviewSchedule.findUnique).toHaveBeenCalledWith({
        where: {
          studentId_topicId: { studentId: 'student-1', topicId: 'topic-1' },
        },
      });
      expect(result).toEqual(mockEntry);
    });

    it('should return null for non-existent schedule', async () => {
      mockPrisma.reviewSchedule.findUnique.mockResolvedValue(null);

      const result = await store.get('student-1', 'non-existent');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // GET DUE REVIEWS TESTS
  // ============================================================================

  describe('getDueReviews', () => {
    it('should return reviews due for student', async () => {
      const mockEntries = [
        createSampleReviewSchedule({ topicId: 'topic-1', nextReviewAt: new Date('2024-01-01') }),
        createSampleReviewSchedule({ topicId: 'topic-2', nextReviewAt: new Date('2024-01-05') }),
      ];
      mockPrisma.reviewSchedule.findMany.mockResolvedValue(mockEntries);

      const result = await store.getDueReviews('student-1');

      expect(mockPrisma.reviewSchedule.findMany).toHaveBeenCalledWith({
        where: {
          studentId: 'student-1',
          nextReviewAt: { lte: expect.any(Date) },
        },
        orderBy: { nextReviewAt: 'asc' },
        take: 20,
      });
      expect(result).toHaveLength(2);
    });

    it('should respect limit parameter', async () => {
      mockPrisma.reviewSchedule.findMany.mockResolvedValue([]);

      await store.getDueReviews('student-1', 5);

      expect(mockPrisma.reviewSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should use default limit of 20', async () => {
      mockPrisma.reviewSchedule.findMany.mockResolvedValue([]);

      await store.getDueReviews('student-1');

      expect(mockPrisma.reviewSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      );
    });
  });

  // ============================================================================
  // GET ALL FOR STUDENT TESTS
  // ============================================================================

  describe('getAllForStudent', () => {
    it('should return all review schedules for student', async () => {
      const mockEntries = [
        createSampleReviewSchedule({ topicId: 'topic-1' }),
        createSampleReviewSchedule({ topicId: 'topic-2' }),
        createSampleReviewSchedule({ topicId: 'topic-3' }),
      ];
      mockPrisma.reviewSchedule.findMany.mockResolvedValue(mockEntries);

      const result = await store.getAllForStudent('student-1');

      expect(mockPrisma.reviewSchedule.findMany).toHaveBeenCalledWith({
        where: { studentId: 'student-1' },
        orderBy: { nextReviewAt: 'asc' },
      });
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no schedules', async () => {
      mockPrisma.reviewSchedule.findMany.mockResolvedValue([]);

      const result = await store.getAllForStudent('student-1');

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // DELETE TESTS
  // ============================================================================

  describe('delete', () => {
    it('should delete review schedule', async () => {
      await store.delete('student-1', 'topic-1');

      expect(mockPrisma.reviewSchedule.delete).toHaveBeenCalledWith({
        where: {
          studentId_topicId: { studentId: 'student-1', topicId: 'topic-1' },
        },
      });
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('createPrismaReviewScheduleStore', () => {
    it('should create PrismaReviewScheduleStore instance', () => {
      const store = createPrismaReviewScheduleStore({ prisma: mockPrisma });

      expect(store).toBeInstanceOf(PrismaReviewScheduleStore);
    });
  });
});
