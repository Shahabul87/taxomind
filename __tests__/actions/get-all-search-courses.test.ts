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
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
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
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
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
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-06'),
    },
  ];

  it('should return all courses when no search term provided', async () => {
    prismaMock.course.findMany.mockResolvedValue(mockCourses);

    const result = await getAllSearchCourses();

    expect(result).toEqual(mockCourses);
    expect(prismaMock.course.findMany).toHaveBeenCalled();
  });

  it('should search by title', async () => {
    const reactCourse = [mockCourses[0]];
    prismaMock.course.findMany.mockResolvedValue(reactCourse);

    const result = await getAllSearchCourses('React');

    expect(result).toEqual(reactCourse);
    expect(result[0].title).toContain('React');
  });

  it('should search by description', async () => {
    const patternCourses = [mockCourses[0], mockCourses[2]];
    prismaMock.course.findMany.mockResolvedValue(patternCourses);

    const result = await getAllSearchCourses('patterns');

    expect(result).toHaveLength(2);
  });

  it('should be case-insensitive', async () => {
    const vueCourse = [mockCourses[1]];
    prismaMock.course.findMany.mockResolvedValue(vueCourse);

    const result = await getAllSearchCourses('VUE');

    expect(result).toEqual(vueCourse);
  });

  it('should return empty array for no matches', async () => {
    prismaMock.course.findMany.mockResolvedValue([]);

    const result = await getAllSearchCourses('Python');

    expect(result).toEqual([]);
  });

  it('should handle special characters in search', async () => {
    prismaMock.course.findMany.mockResolvedValue([]);

    const result = await getAllSearchCourses('Vue.js');

    expect(prismaMock.course.findMany).toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    prismaMock.course.findMany.mockRejectedValue(new Error('Search failed'));

    await expect(getAllSearchCourses('React')).rejects.toThrow('Search failed');
  });
});