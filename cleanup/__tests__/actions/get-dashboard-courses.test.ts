import { getDashboardCourses } from '@/actions/get-dashboard-courses';
import { db } from '@/lib/db';
import { getProgress } from '@/actions/get-progress';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    purchase: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/actions/get-progress', () => ({
  getProgress: jest.fn(),
}));

// Mock ServerActionCache to bypass caching and call fetch directly
jest.mock('@/lib/redis/server-action-cache', () => ({
  ServerActionCache: {
    getDashboardData: jest.fn(async (_userId: string, fetchFn: () => Promise<unknown>) => {
      const data = await fetchFn();
      return { data, cached: false };
    }),
  },
}));

// Mock BatchQueryOptimizer
jest.mock('@/lib/database/query-optimizer', () => ({
  BatchQueryOptimizer: {
    batchLoadUserProgress: jest.fn(),
  },
}));

import { BatchQueryOptimizer } from '@/lib/database/query-optimizer';

describe('getDashboardCourses action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns completed and in-progress courses for a user', async () => {
    const userId = 'user-123';

    // The real implementation queries purchases with Course include
    const mockPurchases = [
      {
        Course: {
          id: 'course-1',
          title: 'Course 1',
          imageUrl: '/image1.jpg',
          chapters: [{ id: 'ch-1' }, { id: 'ch-2' }],
          category: { name: 'Programming' },
        },
      },
      {
        Course: {
          id: 'course-2',
          title: 'Course 2',
          imageUrl: '/image2.jpg',
          chapters: [{ id: 'ch-3' }],
          category: { name: 'Design' },
        },
      },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);

    // Mock batch progress loader
    const progressMap = new Map();
    progressMap.set('course-1', {
      courseProgress: { progressPercentage: 100 },
      chapterProgress: [],
    });
    progressMap.set('course-2', {
      courseProgress: { progressPercentage: 50 },
      chapterProgress: [],
    });
    (BatchQueryOptimizer.batchLoadUserProgress as jest.Mock).mockResolvedValue(progressMap);

    const result = await getDashboardCourses(userId);

    expect(result.completedCourses).toHaveLength(1);
    expect(result.completedCourses[0].id).toBe('course-1');
    expect(result.completedCourses[0].progress).toBe(100);
    expect(result.coursesInProgress).toHaveLength(1);
    expect(result.coursesInProgress[0].id).toBe('course-2');
    expect(result.coursesInProgress[0].progress).toBe(50);
  });

  it('returns empty arrays when user has no purchases', async () => {
    const userId = 'user-123';

    (db.purchase.findMany as jest.Mock).mockResolvedValue([]);

    const progressMap = new Map();
    (BatchQueryOptimizer.batchLoadUserProgress as jest.Mock).mockResolvedValue(progressMap);

    const result = await getDashboardCourses(userId);

    expect(result).toEqual({
      completedCourses: [],
      coursesInProgress: [],
    });
  });

  it('handles courses with 0% progress correctly', async () => {
    const userId = 'user-123';

    const mockPurchases = [
      {
        Course: {
          id: 'course-1',
          title: 'New Course',
          imageUrl: '/image.jpg',
          chapters: [{ id: 'ch-1' }],
          category: { name: 'Programming' },
        },
      },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);

    const progressMap = new Map();
    progressMap.set('course-1', {
      courseProgress: { progressPercentage: 0 },
      chapterProgress: [],
    });
    (BatchQueryOptimizer.batchLoadUserProgress as jest.Mock).mockResolvedValue(progressMap);

    const result = await getDashboardCourses(userId);

    expect(result.completedCourses).toHaveLength(0);
    expect(result.coursesInProgress).toHaveLength(1);
    expect(result.coursesInProgress[0].progress).toBe(0);
  });

  it('handles courses with null progress from batch loader correctly', async () => {
    const userId = 'user-123';

    const mockPurchases = [
      {
        Course: {
          id: 'course-1',
          title: 'Course with null progress',
          imageUrl: '/image.jpg',
          chapters: [{ id: 'ch-1' }],
          category: { name: 'Programming' },
        },
      },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);

    // No progress data for this course
    const progressMap = new Map();
    (BatchQueryOptimizer.batchLoadUserProgress as jest.Mock).mockResolvedValue(progressMap);

    const result = await getDashboardCourses(userId);

    // With no progress data, progressPercentage defaults to 0, so it goes to coursesInProgress
    expect(result.completedCourses).toHaveLength(0);
    expect(result.coursesInProgress).toHaveLength(1);
    expect(result.coursesInProgress[0].progress).toBe(0);
  });

  it('correctly separates multiple completed and in-progress courses', async () => {
    const userId = 'user-123';

    const mockPurchases = [
      { Course: { id: 'course-1', title: 'Course 1', imageUrl: '/1.jpg', chapters: [], category: { name: 'Cat1' } } },
      { Course: { id: 'course-2', title: 'Course 2', imageUrl: '/2.jpg', chapters: [], category: { name: 'Cat2' } } },
      { Course: { id: 'course-3', title: 'Course 3', imageUrl: '/3.jpg', chapters: [], category: { name: 'Cat3' } } },
      { Course: { id: 'course-4', title: 'Course 4', imageUrl: '/4.jpg', chapters: [], category: { name: 'Cat4' } } },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);

    const progressMap = new Map();
    progressMap.set('course-1', { courseProgress: { progressPercentage: 100 }, chapterProgress: [] });
    progressMap.set('course-2', { courseProgress: { progressPercentage: 75 }, chapterProgress: [] });
    progressMap.set('course-3', { courseProgress: { progressPercentage: 100 }, chapterProgress: [] });
    progressMap.set('course-4', { courseProgress: { progressPercentage: 25 }, chapterProgress: [] });
    (BatchQueryOptimizer.batchLoadUserProgress as jest.Mock).mockResolvedValue(progressMap);

    const result = await getDashboardCourses(userId);

    expect(result.completedCourses).toHaveLength(2);
    expect(result.coursesInProgress).toHaveLength(2);

    expect(result.completedCourses.map((c: { id: string }) => c.id)).toEqual(['course-1', 'course-3']);
    expect(result.coursesInProgress.map((c: { id: string }) => c.id)).toEqual(['course-2', 'course-4']);
  });

  it('handles database errors gracefully', async () => {
    const userId = 'user-123';

    (db.purchase.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    // The real implementation catches errors and returns empty arrays
    const result = await getDashboardCourses(userId);

    expect(result).toEqual({
      completedCourses: [],
      coursesInProgress: [],
    });
  });

  it('handles batch progress errors gracefully', async () => {
    const userId = 'user-123';

    const mockPurchases = [
      {
        Course: {
          id: 'course-1',
          title: 'Course 1',
          imageUrl: '/image.jpg',
          chapters: [],
          category: { name: 'Programming' },
        },
      },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);
    (BatchQueryOptimizer.batchLoadUserProgress as jest.Mock).mockRejectedValue(
      new Error('Progress calculation failed')
    );

    // The real implementation catches errors and returns empty arrays
    const result = await getDashboardCourses(userId);

    expect(result).toEqual({
      completedCourses: [],
      coursesInProgress: [],
    });
  });
});
