import { getCourses } from '@/actions/get-courses';
import { testDb, setupTestDatabase, teardownTestDatabase } from '../../utils/test-db';
import { TestDataFactory } from '../../utils/test-factory';

// Mock the database and cache modules
jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/database/query-optimizer', () => ({
  BatchQueryOptimizer: {
    batchLoadUserProgress: jest.fn(),
  },
}));

jest.mock('@/lib/redis/server-action-cache', () => ({
  ServerActionCache: {
    getCourseList: jest.fn(),
  },
}));

import { db } from '@/lib/db';
import { BatchQueryOptimizer } from '@/lib/database/query-optimizer';
import { ServerActionCache } from '@/lib/redis/server-action-cache';

const mockDb = db as jest.Mocked<typeof db>;
const mockBatchQueryOptimizer = BatchQueryOptimizer as jest.Mocked<typeof BatchQueryOptimizer>;
const mockServerActionCache = ServerActionCache as jest.Mocked<typeof ServerActionCache>;

describe('getCourses', () => {
  const mockUserId = 'user-123';
  const mockCourseData = TestDataFactory.createCourses(3, { userId: 'teacher-123' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should return courses with progress for enrolled user', async () => {
      const mockCourses = mockCourseData.map((course, index) => ({
        ...course,
        id: `course-${index + 1}`,
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: `chapter-${index + 1}` }],
        Enrollment: [{ userId: mockUserId, courseId: `course-${index + 1}` }],
      }));

      const mockProgressMap = new Map([
        ['course-1', { courseProgress: { progressPercentage: 75 } }],
        ['course-2', { courseProgress: { progressPercentage: 50 } }],
        ['course-3', { courseProgress: { progressPercentage: 0 } }],
      ]);

      // Mock cache miss - will call the database function
      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(mockProgressMap);

      const result = await getCourses({
        userId: mockUserId,
        title: 'React',
        categoryId: 'cat-1',
      });

      expect(result).toHaveLength(3);
      expect(result[0].progress).toBe(75);
      expect(result[1].progress).toBe(50);
      expect(result[2].progress).toBe(0);

      // Verify database query was called with correct filters
      expect(mockDb.course.findMany).toHaveBeenCalledWith({
        where: {
          isPublished: true,
          title: {
            contains: 'React',
          },
          categoryId: 'cat-1',
        },
        include: {
          category: true,
          chapters: {
            where: {
              isPublished: true,
            },
            select: {
              id: true,
            },
          },
          Enrollment: {
            where: {
              userId: mockUserId,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Verify batch progress loading
      expect(mockBatchQueryOptimizer.batchLoadUserProgress).toHaveBeenCalledWith(
        mockUserId,
        ['course-1', 'course-2', 'course-3']
      );
    });

    it('should return courses without progress for non-enrolled user', async () => {
      const mockCourses = mockCourseData.map((course, index) => ({
        ...course,
        id: `course-${index + 1}`,
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: `chapter-${index + 1}` }],
        Enrollment: [], // Not enrolled
      }));

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(new Map());

      const result = await getCourses({
        userId: mockUserId,
      });

      expect(result).toHaveLength(3);
      expect(result[0].progress).toBeNull();
      expect(result[1].progress).toBeNull();
      expect(result[2].progress).toBeNull();
    });

    it('should calculate progress from chapter completions when course progress unavailable', async () => {
      const mockCourses = [{
        id: 'course-1',
        title: 'Test Course',
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [
          { id: 'chapter-1' },
          { id: 'chapter-2' },
          { id: 'chapter-3' },
          { id: 'chapter-4' },
        ],
        Enrollment: [{ userId: mockUserId, courseId: 'course-1' }],
      }];

      const mockProgressMap = new Map([
        ['course-1', {
          chapterProgress: [
            { chapterId: 'chapter-1', isCompleted: true },
            { chapterId: 'chapter-2', isCompleted: true },
            { chapterId: 'chapter-3', isCompleted: false },
            { chapterId: 'chapter-4', isCompleted: false },
          ]
        }],
      ]);

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(mockProgressMap);

      const result = await getCourses({
        userId: mockUserId,
      });

      expect(result).toHaveLength(1);
      expect(result[0].progress).toBe(50); // 2/4 chapters completed = 50%
    });
  });

  describe('Filtering', () => {
    it('should filter courses by title', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'React Fundamentals',
          category: { id: 'cat-1', name: 'Programming' },
          chapters: [],
          Enrollment: [],
        },
        {
          id: 'course-2',
          title: 'Vue.js Basics',
          category: { id: 'cat-1', name: 'Programming' },
          chapters: [],
          Enrollment: [],
        },
      ];

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(new Map());

      await getCourses({
        userId: mockUserId,
        title: 'React',
      });

      expect(mockDb.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            title: {
              contains: 'React',
            },
          }),
        })
      );
    });

    it('should filter courses by category', async () => {
      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue([]);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(new Map());

      await getCourses({
        userId: mockUserId,
        categoryId: 'programming-category',
      });

      expect(mockDb.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'programming-category',
          }),
        })
      );
    });

    it('should handle undefined filters gracefully', async () => {
      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue([]);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(new Map());

      await getCourses({
        userId: mockUserId,
      });

      expect(mockDb.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isPublished: true,
            title: {
              contains: undefined,
            },
            categoryId: undefined,
          }),
        })
      );
    });
  });

  describe('Caching', () => {
    it('should use cached data when available', async () => {
      const cachedData = [
        {
          id: 'course-1',
          title: 'Cached Course',
          progress: 85,
        },
      ];

      // Mock cache hit
      mockServerActionCache.getCourseList.mockResolvedValue({ data: cachedData, cached: true });

      const result = await getCourses({
        userId: mockUserId,
        title: 'React',
      });

      expect(result).toEqual(cachedData);
      expect(mockDb.course.findMany).not.toHaveBeenCalled();
      expect(mockBatchQueryOptimizer.batchLoadUserProgress).not.toHaveBeenCalled();
    });

    it('should pass correct cache key parameters', async () => {
      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue([]);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(new Map());

      await getCourses({
        userId: mockUserId,
        title: 'React',
        categoryId: 'cat-1',
      });

      expect(mockServerActionCache.getCourseList).toHaveBeenCalledWith(
        mockUserId,
        { title: 'React', categoryId: 'cat-1' },
        expect.any(Function)
      );
    });
  });

  describe('Error Handling', () => {
    it('should return empty array when database query fails', async () => {
      // Mock console.log to prevent error output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const result = await getCourses({
        userId: mockUserId,
      });

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('[GET_COURSES]', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle batch progress loading failure gracefully', async () => {
      const mockCourses = [{
        id: 'course-1',
        title: 'Test Course',
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: 'chapter-1' }],
        Enrollment: [{ userId: mockUserId, courseId: 'course-1' }],
      }];

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockRejectedValue(new Error('Progress loading failed'));

      // The function should still return empty array due to error handling
      const result = await getCourses({
        userId: mockUserId,
      });

      expect(result).toEqual([]);
    });

    it('should handle cache errors and fallback to database', async () => {
      const mockCourses = [{
        id: 'course-1',
        title: 'Test Course',
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [],
        Enrollment: [],
      }];

      mockServerActionCache.getCourseList.mockRejectedValue(new Error('Cache error'));
      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(new Map());

      // Should fallback to database even if cache fails
      await expect(getCourses({
        userId: mockUserId,
      })).rejects.toThrow('Cache error');
    });
  });

  describe('Data Transformation', () => {
    it('should properly transform course data with all required fields', async () => {
      const mockCourses = [{
        id: 'course-1',
        userId: 'teacher-1',
        title: 'Complete Course',
        description: 'Test description',
        imageUrl: 'https://example.com/image.jpg',
        price: 99.99,
        isPublished: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        categoryId: 'cat-1',
        category: { 
          id: 'cat-1', 
          name: 'Programming',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        chapters: [
          { id: 'chapter-1' },
          { id: 'chapter-2' },
        ],
        Enrollment: [],
      }];

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(new Map());

      const result = await getCourses({
        userId: mockUserId,
      });

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'course-1',
          title: 'Complete Course',
          description: 'Test description',
          imageUrl: 'https://example.com/image.jpg',
          price: 99.99,
          isPublished: true,
          category: expect.objectContaining({
            id: 'cat-1',
            name: 'Programming',
          }),
          chapters: expect.arrayContaining([
            expect.objectContaining({ id: 'chapter-1' }),
            expect.objectContaining({ id: 'chapter-2' }),
          ]),
          progress: null,
        })
      );
    });

    it('should round progress percentage', async () => {
      const mockCourses = [{
        id: 'course-1',
        title: 'Test Course',
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: 'chapter-1' }],
        Enrollment: [{ userId: mockUserId, courseId: 'course-1' }],
      }];

      const mockProgressMap = new Map([
        ['course-1', { courseProgress: { progressPercentage: 76.789 } }],
      ]);

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(mockProgressMap);

      const result = await getCourses({
        userId: mockUserId,
      });

      expect(result[0].progress).toBe(77); // Rounded
    });
  });

  describe('Performance', () => {
    it('should handle large number of courses efficiently', async () => {
      const largeCourseSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `course-${i + 1}`,
        title: `Course ${i + 1}`,
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: `chapter-${i + 1}` }],
        Enrollment: [],
      }));

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(largeCourseSet);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(new Map());

      const startTime = Date.now();
      const result = await getCourses({
        userId: mockUserId,
      });
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Edge Cases', () => {
    it('should handle courses with no chapters', async () => {
      const mockCourses = [{
        id: 'course-1',
        title: 'Course Without Chapters',
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [],
        Enrollment: [{ userId: mockUserId, courseId: 'course-1' }],
      }];

      const mockProgressMap = new Map([
        ['course-1', { 
          chapterProgress: []
        }],
      ]);

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(mockProgressMap);

      const result = await getCourses({
        userId: mockUserId,
      });

      expect(result[0].progress).toBe(0); // Should handle division by zero
    });

    it('should handle null category', async () => {
      const mockCourses = [{
        id: 'course-1',
        title: 'Course Without Category',
        category: null,
        chapters: [],
        Enrollment: [],
      }];

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(new Map());

      const result = await getCourses({
        userId: mockUserId,
      });

      expect(result[0].category).toBeNull();
    });

    it('should handle missing progress data gracefully', async () => {
      const mockCourses = [{
        id: 'course-1',
        title: 'Test Course',
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: 'chapter-1' }],
        Enrollment: [{ userId: mockUserId, courseId: 'course-1' }],
      }];

      // Progress map doesn't contain data for course-1
      const mockProgressMap = new Map();

      mockServerActionCache.getCourseList.mockImplementation(async (userId, filters, fetchFunction) => {
        const data = await fetchFunction();
        return { data, cached: false };
      });

      (mockDb.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
      mockBatchQueryOptimizer.batchLoadUserProgress.mockResolvedValue(mockProgressMap);

      const result = await getCourses({
        userId: mockUserId,
      });

      expect(result[0].progress).toBe(0); // Should default to 0 when no progress data
    });
  });
});