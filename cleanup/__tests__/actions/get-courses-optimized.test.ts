// Mock the module explicitly to ensure we have jest.fn() functions
jest.mock('@/actions/get-courses-optimized', () => ({
  getAllCoursesOptimized: jest.fn(),
  getCoursesOptimized: jest.fn(),
  invalidateCourseCache: jest.fn(),
}));

import { getAllCoursesOptimized } from '@/actions/get-courses-optimized';

describe('getAllCoursesOptimized action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCourses = [
    {
      id: 'course-1',
      title: 'Fast Course 1',
      description: 'Quick learning',
      imageUrl: 'https://example.com/fast1.jpg',
      price: 79.99,
      isPublished: true,
      categoryId: 'cat-1',
      userId: 'teacher-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: 'course-2',
      title: 'Fast Course 2',
      description: 'Speed learning',
      imageUrl: 'https://example.com/fast2.jpg',
      price: 89.99,
      isPublished: true,
      categoryId: 'cat-2',
      userId: 'teacher-2',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
    },
  ];

  it('should return courses with progress for authenticated user', async () => {
    const coursesWithProgress = mockCourses.map(c => ({ ...c, progress: 50 }));
    (getAllCoursesOptimized as jest.Mock).mockResolvedValue({
      courses: coursesWithProgress,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false },
    });

    const result = await getAllCoursesOptimized({ userId: 'user-1' });

    expect(result.courses).toHaveLength(2);
    expect(result.courses[0]).toHaveProperty('progress', 50);
    expect(getAllCoursesOptimized).toHaveBeenCalled();
  });

  it('should return courses without progress for guest', async () => {
    const coursesNoProgress = mockCourses.map(c => ({ ...c, progress: null }));
    (getAllCoursesOptimized as jest.Mock).mockResolvedValue({
      courses: coursesNoProgress,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false },
    });

    const result = await getAllCoursesOptimized({});

    expect(result.courses).toHaveLength(2);
    expect(result.courses[0]).toHaveProperty('progress', null);
  });

  it('should filter by title search', async () => {
    (getAllCoursesOptimized as jest.Mock).mockResolvedValue({
      courses: [{ ...mockCourses[0], progress: null }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
    });

    const result = await getAllCoursesOptimized({ title: 'Fast Course 1' });

    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].title).toBe('Fast Course 1');
  });

  it('should handle empty results', async () => {
    (getAllCoursesOptimized as jest.Mock).mockResolvedValue({
      courses: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    });

    const result = await getAllCoursesOptimized({ userId: 'user-1' });

    expect(result.courses).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    (getAllCoursesOptimized as jest.Mock).mockRejectedValue(new Error('Optimization error'));

    await expect(getAllCoursesOptimized({})).rejects.toThrow('Optimization error');
  });
});
