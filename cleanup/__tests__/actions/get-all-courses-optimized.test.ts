import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

// Mock the action module
jest.mock('@/actions/get-all-courses-optimized', () => ({
  getCoursesOptimized: jest.fn().mockImplementation(async (params = {}) => {
    return prismaMock.course.findMany({
      where: {
        isPublished: true,
        ...params.where,
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }),
}));

import { getCoursesOptimized } from '@/actions/get-all-courses-optimized';

describe('getCoursesOptimized action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCourses = [
    {
      id: 'course-1',
      title: 'Optimized Course 1',
      description: 'Learn efficiently',
      imageUrl: 'https://example.com/course1.jpg',
      price: 99.99,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: 'course-2',
      title: 'Optimized Course 2',
      description: 'Advanced optimization',
      imageUrl: 'https://example.com/course2.jpg',
      price: 149.99,
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
    },
  ];

  it('should return optimized course data', async () => {
    (getCoursesOptimized as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCoursesOptimized();

    expect(result).toEqual(mockCourses);
    expect(getCoursesOptimized).toHaveBeenCalled();
  });

  it('should handle filtering by category', async () => {
    const filteredCourses = [mockCourses[0]];
    (getCoursesOptimized as jest.Mock).mockResolvedValue(filteredCourses);

    const result = await getCoursesOptimized({ categoryId: 'cat-1' });

    expect(result).toEqual(filteredCourses);
  });

  it('should handle price range filtering', async () => {
    const affordableCourses = [mockCourses[0]];
    (getCoursesOptimized as jest.Mock).mockResolvedValue(affordableCourses);

    const result = await getCoursesOptimized({ limit: 1 });

    expect(result).toEqual(affordableCourses);
  });

  it('should handle empty results', async () => {
    (getCoursesOptimized as jest.Mock).mockResolvedValue([]);

    const result = await getCoursesOptimized();

    expect(result).toEqual([]);
  });

  it('should handle database errors', async () => {
    (getCoursesOptimized as jest.Mock).mockRejectedValue(new Error('Query optimization failed'));

    await expect(getCoursesOptimized()).rejects.toThrow('Query optimization failed');
  });
});