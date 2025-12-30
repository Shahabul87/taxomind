/**
 * @sam-ai/adapter-prisma - Sample Store Tests
 * Tests for PrismaSampleStore
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaSampleStore, createPrismaSampleStore } from '../sample-store';
import { createMockPrismaClient, createSampleCalibrationSample } from './setup';
import type { CalibrationSample, HumanReview } from '../sample-store';

describe('PrismaSampleStore', () => {
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;
  let store: PrismaSampleStore;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    store = new PrismaSampleStore({ prisma: mockPrisma });
    vi.clearAllMocks();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should use default table name', () => {
      const store = new PrismaSampleStore({ prisma: mockPrisma });
      expect(store).toBeDefined();
    });

    it('should accept custom table name', () => {
      const store = new PrismaSampleStore({
        prisma: mockPrisma,
        tableName: 'customSamples',
      });
      expect(store).toBeDefined();
    });
  });

  // ============================================================================
  // SAVE TESTS
  // ============================================================================

  describe('save', () => {
    it('should save a calibration sample', async () => {
      const sample: CalibrationSample = {
        id: 'sample-1',
        evaluationId: 'eval-1',
        aiScore: 85,
        aiFeedback: 'Good response',
        context: { contentType: 'essay', subject: 'science' },
        evaluatedAt: new Date('2024-01-01'),
        versionInfo: {
          configVersion: '1.0',
          promptVersion: '1.0',
          modelVersion: 'claude-3',
        },
      };

      await store.save(sample);

      expect(mockPrisma.calibrationSample.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'sample-1',
          evaluationId: 'eval-1',
          aiScore: 85,
        }),
      });
    });

    it('should save sample with optional fields', async () => {
      const sample: CalibrationSample = {
        id: 'sample-2',
        evaluationId: 'eval-2',
        aiScore: 90,
        humanScore: 88,
        aiFeedback: 'Excellent',
        humanFeedback: 'Very good analysis',
        adjustmentReason: 'Minor adjustment needed',
        context: { contentType: 'quiz' },
        evaluatedAt: new Date('2024-01-01'),
        reviewedAt: new Date('2024-01-02'),
        reviewerId: 'reviewer-1',
        versionInfo: {
          configVersion: '1.0',
          promptVersion: '1.0',
          modelVersion: 'claude-3',
        },
        tags: ['important', 'reviewed'],
      };

      await store.save(sample);

      expect(mockPrisma.calibrationSample.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          humanScore: 88,
          humanFeedback: 'Very good analysis',
          tags: ['important', 'reviewed'],
        }),
      });
    });
  });

  // ============================================================================
  // GET TESTS
  // ============================================================================

  describe('get', () => {
    it('should return sample by id', async () => {
      const mockSample = createSampleCalibrationSample({ id: 'sample-1' });
      mockPrisma.calibrationSample.findUnique.mockResolvedValue(mockSample);

      const result = await store.get('sample-1');

      expect(mockPrisma.calibrationSample.findUnique).toHaveBeenCalledWith({
        where: { id: 'sample-1' },
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe('sample-1');
    });

    it('should return null for non-existent sample', async () => {
      mockPrisma.calibrationSample.findUnique.mockResolvedValue(null);

      const result = await store.get('non-existent');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // GET RECENT WITH HUMAN REVIEW TESTS
  // ============================================================================

  describe('getRecentWithHumanReview', () => {
    it('should return samples with human reviews', async () => {
      const mockSamples = [
        createSampleCalibrationSample({ id: 'sample-1', humanScore: 85 }),
        createSampleCalibrationSample({ id: 'sample-2', humanScore: 90 }),
      ];
      mockPrisma.calibrationSample.findMany.mockResolvedValue(mockSamples);

      const result = await store.getRecentWithHumanReview(10);

      expect(mockPrisma.calibrationSample.findMany).toHaveBeenCalledWith({
        where: { humanScore: { not: null } },
        orderBy: { reviewedAt: 'desc' },
        take: 10,
      });
      expect(result).toHaveLength(2);
    });

    it('should respect limit parameter', async () => {
      mockPrisma.calibrationSample.findMany.mockResolvedValue([]);

      await store.getRecentWithHumanReview(5);

      expect(mockPrisma.calibrationSample.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  // ============================================================================
  // GET PENDING REVIEW TESTS
  // ============================================================================

  describe('getPendingReview', () => {
    it('should return samples without human review', async () => {
      const mockSamples = [
        createSampleCalibrationSample({ id: 'sample-1', humanScore: null }),
      ];
      mockPrisma.calibrationSample.findMany.mockResolvedValue(mockSamples);

      const result = await store.getPendingReview(10);

      expect(mockPrisma.calibrationSample.findMany).toHaveBeenCalledWith({
        where: { humanScore: null },
        orderBy: { evaluatedAt: 'desc' },
        take: 10,
      });
      expect(result).toHaveLength(1);
    });
  });

  // ============================================================================
  // GET BY DATE RANGE TESTS
  // ============================================================================

  describe('getByDateRange', () => {
    it('should return samples within date range', async () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      mockPrisma.calibrationSample.findMany.mockResolvedValue([]);

      await store.getByDateRange(start, end);

      expect(mockPrisma.calibrationSample.findMany).toHaveBeenCalledWith({
        where: {
          evaluatedAt: { gte: start, lte: end },
        },
        orderBy: { evaluatedAt: 'desc' },
      });
    });
  });

  // ============================================================================
  // GET BY CONTENT TYPE TESTS
  // ============================================================================

  describe('getByContentType', () => {
    it('should return samples by content type', async () => {
      const mockSamples = [
        createSampleCalibrationSample({
          id: 'sample-1',
          context: { contentType: 'essay' },
        }),
      ];
      mockPrisma.calibrationSample.findMany.mockResolvedValue(mockSamples);

      const result = await store.getByContentType('essay', 10);

      expect(mockPrisma.calibrationSample.findMany).toHaveBeenCalledWith({
        where: {
          context: { path: ['contentType'], equals: 'essay' },
        },
        orderBy: { evaluatedAt: 'desc' },
        take: 10,
      });
      expect(result).toHaveLength(1);
    });
  });

  // ============================================================================
  // UPDATE WITH REVIEW TESTS
  // ============================================================================

  describe('updateWithReview', () => {
    it('should update sample with human review', async () => {
      const mockUpdated = createSampleCalibrationSample({
        id: 'sample-1',
        humanScore: 88,
        humanFeedback: 'Good work',
        reviewedAt: new Date(),
      });
      mockPrisma.calibrationSample.update.mockResolvedValue(mockUpdated);

      const review: HumanReview = {
        score: 88,
        feedback: 'Good work',
        reason: 'Minor correction',
        reviewerId: 'reviewer-1',
      };

      const result = await store.updateWithReview('sample-1', review);

      expect(mockPrisma.calibrationSample.update).toHaveBeenCalledWith({
        where: { id: 'sample-1' },
        data: expect.objectContaining({
          humanScore: 88,
          humanFeedback: 'Good work',
          adjustmentReason: 'Minor correction',
          reviewerId: 'reviewer-1',
        }),
      });
      expect(result.humanScore).toBe(88);
    });

    it('should set reviewedAt to current date', async () => {
      const mockUpdated = createSampleCalibrationSample({ id: 'sample-1' });
      mockPrisma.calibrationSample.update.mockResolvedValue(mockUpdated);

      await store.updateWithReview('sample-1', { score: 90 });

      expect(mockPrisma.calibrationSample.update).toHaveBeenCalledWith({
        where: { id: 'sample-1' },
        data: expect.objectContaining({
          reviewedAt: expect.any(Date),
        }),
      });
    });
  });

  // ============================================================================
  // GET STATISTICS TESTS
  // ============================================================================

  describe('getStatistics', () => {
    it('should return sample statistics', async () => {
      mockPrisma.calibrationSample.count
        .mockResolvedValueOnce(100) // totalSamples
        .mockResolvedValueOnce(50); // reviewedSamples
      mockPrisma.calibrationSample.aggregate
        .mockResolvedValueOnce({ _avg: { aiScore: 85 } })
        .mockResolvedValueOnce({ _avg: { humanScore: 88 } });

      const result = await store.getStatistics();

      expect(result.totalSamples).toBe(100);
      expect(result.reviewedSamples).toBe(50);
      expect(result.averageAiScore).toBe(85);
      expect(result.averageHumanScore).toBe(88);
    });

    it('should handle empty statistics', async () => {
      mockPrisma.calibrationSample.count.mockResolvedValue(0);
      mockPrisma.calibrationSample.aggregate.mockResolvedValue({ _avg: { aiScore: null } });

      const result = await store.getStatistics();

      expect(result.totalSamples).toBe(0);
      expect(result.averageAiScore).toBe(0);
    });
  });

  // ============================================================================
  // PRUNE OLD SAMPLES TESTS
  // ============================================================================

  describe('pruneOldSamples', () => {
    it('should delete samples older than specified days', async () => {
      mockPrisma.calibrationSample.deleteMany.mockResolvedValue({ count: 15 });

      const result = await store.pruneOldSamples(30);

      expect(mockPrisma.calibrationSample.deleteMany).toHaveBeenCalledWith({
        where: {
          evaluatedAt: { lt: expect.any(Date) },
        },
      });
      expect(result).toBe(15);
    });

    it('should return 0 when no samples deleted', async () => {
      mockPrisma.calibrationSample.deleteMany.mockResolvedValue({ count: 0 });

      const result = await store.pruneOldSamples(30);

      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('createPrismaSampleStore', () => {
    it('should create PrismaSampleStore instance', () => {
      const store = createPrismaSampleStore({ prisma: mockPrisma });

      expect(store).toBeInstanceOf(PrismaSampleStore);
    });
  });
});
