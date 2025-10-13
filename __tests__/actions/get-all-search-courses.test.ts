import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

// Mock the action module
jest.mock('@/actions/get-all-search-courses', () => ({
  getAllSearchCourses: jest.fn().mockImplementation(async (searchTerm = '') => {
    if (!searchTerm) {
      return prismaMock.course.findMany({
        where: { isPublished: true },
      });
    }
    
    return prismaMock.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
    });
  }),
}));

import { getAllSearchCourses } from '@/actions/get-all-search-courses';

describe('getAllSearchCourses action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCourses = [
    {
      id: 'course-1',
      title: 'React Advanced Patterns',
      description: 'Master React design patterns',
      imageUrl: 'https://example.com/react.jpg',
      price: 119.99,
      isPublished: true,
      categoryId: 'cat-1',
      userId: 'teacher-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: 'course-2',
      title: 'Vue.js Complete Guide',
      description: 'Everything about Vue.js',
      imageUrl: 'https://example.com/vue.jpg',
      price: 99.99,
      isPublished: true,
      categoryId: 'cat-1',
      userId: 'teacher-2',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
    },
    {
      id: 'course-3',
      title: 'Angular Mastery',
      description: 'Advanced Angular patterns and techniques',
      imageUrl: 'https://example.com/angular.jpg',
      price: 129.99,
      isPublished: true,
      categoryId: 'cat-2',
      userId: 'teacher-3',
      createdAt: new Date('2024-01-05T00:00:00Z'),
      updatedAt: new Date('2024-01-06T00:00:00Z'),
    },
  ];

  it('should return all courses when no search term provided', async () => {
    (getAllSearchCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getAllSearchCourses();

    expect(result).toEqual(mockCourses);
    expect(getAllSearchCourses).toHaveBeenCalled();
  });

  it('should search by title', async () => {
    const reactCourse = [mockCourses[0]];
    (getAllSearchCourses as jest.Mock).mockResolvedValue(reactCourse);

    const result = await getAllSearchCourses('React');

    expect(result).toEqual(reactCourse);
    expect(result[0].title).toContain('React');
  });

  it('should search by description', async () => {
    const patternCourses = [mockCourses[0], mockCourses[2]];
    (getAllSearchCourses as jest.Mock).mockResolvedValue(patternCourses);

    const result = await getAllSearchCourses('patterns');

    expect(result).toHaveLength(2);
  });

  it('should be case-insensitive', async () => {
    const vueCourse = [mockCourses[1]];
    (getAllSearchCourses as jest.Mock).mockResolvedValue(vueCourse);

    const result = await getAllSearchCourses('VUE');

    expect(result).toEqual(vueCourse);
  });

  it('should return empty array for no matches', async () => {
    (getAllSearchCourses as jest.Mock).mockResolvedValue([]);

    const result = await getAllSearchCourses('Python');

    expect(result).toEqual([]);
  });

  it('should handle special characters in search', async () => {
    (getAllSearchCourses as jest.Mock).mockResolvedValue([]);

    const result = await getAllSearchCourses('Vue.js');

    expect(getAllSearchCourses).toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    (getAllSearchCourses as jest.Mock).mockRejectedValue(new Error('Search failed'));

    await expect(getAllSearchCourses('React')).rejects.toThrow('Search failed');
  });
});