/**
 * @sam-ai/adapter-prisma - Golden Test Store Tests
 * Tests for PrismaGoldenTestStore
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaGoldenTestStore, createPrismaGoldenTestStore } from '../golden-test-store';
import { createMockPrismaClient, createSampleGoldenTestCase } from './setup';
import type { GoldenTestCase } from '../golden-test-store';

describe('PrismaGoldenTestStore', () => {
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;
  let store: PrismaGoldenTestStore;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    store = new PrismaGoldenTestStore({ prisma: mockPrisma });
    vi.clearAllMocks();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should use default table name', () => {
      const store = new PrismaGoldenTestStore({ prisma: mockPrisma });
      expect(store).toBeDefined();
    });

    it('should accept custom table name', () => {
      const store = new PrismaGoldenTestStore({
        prisma: mockPrisma,
        tableName: 'customGoldenTests',
      });
      expect(store).toBeDefined();
    });
  });

  // ============================================================================
  // SAVE TESTS
  // ============================================================================

  describe('save', () => {
    it('should save a golden test case', async () => {
      const testCase: GoldenTestCase = {
        id: 'golden-1',
        name: 'Essay Evaluation Test',
        description: 'Tests basic essay scoring',
        category: 'essay',
        input: {
          question: 'What is photosynthesis?',
          studentResponse: 'Photosynthesis is how plants make food.',
        },
        expectedResult: {
          score: 80,
          scoreTolerance: 5,
          feedbackContains: ['photosynthesis'],
        },
        tags: ['science', 'biology'],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      await store.save(testCase);

      expect(mockPrisma.goldenTestCase.upsert).toHaveBeenCalledWith({
        where: { id: 'golden-1' },
        create: testCase,
        update: expect.objectContaining({
          name: 'Essay Evaluation Test',
          updatedAt: expect.any(Date),
        }),
      });
    });

    it('should save test case with rubric and context', async () => {
      const testCase: GoldenTestCase = {
        id: 'golden-2',
        name: 'Complex Evaluation Test',
        category: 'quiz',
        input: {
          question: 'Explain the water cycle',
          studentResponse: 'Water evaporates, condenses, and precipitates.',
          rubric: { maxScore: 100, criteria: ['accuracy', 'completeness'] },
          context: { gradeLevel: '8th', subject: 'Earth Science' },
        },
        expectedResult: {
          score: 85,
          bloomsLevel: 'understand',
        },
        tags: ['science', 'earth-science'],
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      await store.save(testCase);

      expect(mockPrisma.goldenTestCase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            input: expect.objectContaining({
              rubric: { maxScore: 100, criteria: ['accuracy', 'completeness'] },
            }),
          }),
        })
      );
    });
  });

  // ============================================================================
  // GET TESTS
  // ============================================================================

  describe('get', () => {
    it('should return test case by id', async () => {
      const mockTestCase = createSampleGoldenTestCase({ id: 'golden-1' });
      mockPrisma.goldenTestCase.findUnique.mockResolvedValue(mockTestCase);

      const result = await store.get('golden-1');

      expect(mockPrisma.goldenTestCase.findUnique).toHaveBeenCalledWith({
        where: { id: 'golden-1' },
      });
      expect(result).toEqual(mockTestCase);
    });

    it('should return null for non-existent test case', async () => {
      mockPrisma.goldenTestCase.findUnique.mockResolvedValue(null);

      const result = await store.get('non-existent');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // GET BY CATEGORY TESTS
  // ============================================================================

  describe('getByCategory', () => {
    it('should return active test cases by category', async () => {
      const mockTestCases = [
        createSampleGoldenTestCase({ id: 'golden-1', category: 'essay' }),
        createSampleGoldenTestCase({ id: 'golden-2', category: 'essay' }),
      ];
      mockPrisma.goldenTestCase.findMany.mockResolvedValue(mockTestCases);

      const result = await store.getByCategory('essay');

      expect(mockPrisma.goldenTestCase.findMany).toHaveBeenCalledWith({
        where: { category: 'essay', isActive: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no test cases in category', async () => {
      mockPrisma.goldenTestCase.findMany.mockResolvedValue([]);

      const result = await store.getByCategory('non-existent-category');

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // GET ACTIVE TESTS
  // ============================================================================

  describe('getActive', () => {
    it('should return all active test cases', async () => {
      const mockTestCases = [
        createSampleGoldenTestCase({ id: 'golden-1', isActive: true }),
        createSampleGoldenTestCase({ id: 'golden-2', isActive: true }),
        createSampleGoldenTestCase({ id: 'golden-3', isActive: true }),
      ];
      mockPrisma.goldenTestCase.findMany.mockResolvedValue(mockTestCases);

      const result = await store.getActive();

      expect(mockPrisma.goldenTestCase.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { category: 'asc' },
      });
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no active test cases', async () => {
      mockPrisma.goldenTestCase.findMany.mockResolvedValue([]);

      const result = await store.getActive();

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // SEARCH TESTS
  // ============================================================================

  describe('search', () => {
    it('should search test cases by name', async () => {
      const mockTestCases = [
        createSampleGoldenTestCase({ id: 'golden-1', name: 'Essay Evaluation' }),
      ];
      mockPrisma.goldenTestCase.findMany.mockResolvedValue(mockTestCases);

      const result = await store.search('Essay');

      expect(mockPrisma.goldenTestCase.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'Essay', mode: 'insensitive' } },
            { description: { contains: 'Essay', mode: 'insensitive' } },
            { tags: { has: 'Essay' } },
          ],
        },
        take: 50,
      });
      expect(result).toHaveLength(1);
    });

    it('should search test cases by tag', async () => {
      const mockTestCases = [
        createSampleGoldenTestCase({ id: 'golden-1', tags: ['science', 'biology'] }),
      ];
      mockPrisma.goldenTestCase.findMany.mockResolvedValue(mockTestCases);

      const result = await store.search('biology');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no matches', async () => {
      mockPrisma.goldenTestCase.findMany.mockResolvedValue([]);

      const result = await store.search('nonexistent');

      expect(result).toEqual([]);
    });

    it('should limit results to 50', async () => {
      mockPrisma.goldenTestCase.findMany.mockResolvedValue([]);

      await store.search('test');

      expect(mockPrisma.goldenTestCase.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });
  });

  // ============================================================================
  // DELETE TESTS
  // ============================================================================

  describe('delete', () => {
    it('should delete test case by id', async () => {
      await store.delete('golden-1');

      expect(mockPrisma.goldenTestCase.delete).toHaveBeenCalledWith({
        where: { id: 'golden-1' },
      });
    });
  });

  // ============================================================================
  // COUNT TESTS
  // ============================================================================

  describe('count', () => {
    it('should return count of active test cases', async () => {
      mockPrisma.goldenTestCase.count.mockResolvedValue(25);

      const result = await store.count();

      expect(mockPrisma.goldenTestCase.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toBe(25);
    });

    it('should return 0 when no active test cases', async () => {
      mockPrisma.goldenTestCase.count.mockResolvedValue(0);

      const result = await store.count();

      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('createPrismaGoldenTestStore', () => {
    it('should create PrismaGoldenTestStore instance', () => {
      const store = createPrismaGoldenTestStore({ prisma: mockPrisma });

      expect(store).toBeInstanceOf(PrismaGoldenTestStore);
    });
  });
});
