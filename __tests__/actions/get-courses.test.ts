import { getCourses } from '@/actions/get-courses';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

// Database mock is already set up in jest.setup.js

describe('getCourses action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all published courses when no filters are provided', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Course 1',
        description: 'Description 1',
        price: 99,
        isPublished: true,
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: 'ch-1' }],
        Purchase: [],
      },
      {
        id: 'course-2',
        title: 'Course 2',
        description: 'Description 2',
        price: 149,
        isPublished: true,
        category: { id: 'cat-2', name: 'Design' },
        chapters: [{ id: 'ch-2' }, { id: 'ch-3' }],
        Purchase: [],
      },
    ];

    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({ userId: 'user-1' });

    expect(result).toEqual(mockCourses);
    expect(db.course.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
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
        Purchase: {
          where: undefined,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('filters courses by title when provided', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        title: 'JavaScript Basics',
        description: 'Learn JavaScript',
        price: 99,
        isPublished: true,
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: 'ch-1' }],
        Purchase: [],
      },
    ];

    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({ userId: 'user-1', title: 'JavaScript' });

    expect(result).toEqual(mockCourses);
    expect(db.course.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        title: {
          contains: 'JavaScript',
          mode: 'insensitive',
        },
      },
      include: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('filters courses by categoryId when provided', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        title: 'React Course',
        categoryId: 'cat-1',
        isPublished: true,
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: 'ch-1' }],
        Purchase: [],
      },
    ];

    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({ userId: 'user-1', categoryId: 'cat-1' });

    expect(result).toEqual(mockCourses);
    expect(db.course.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        categoryId: 'cat-1',
      },
      include: expect.any(Object),
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('filters courses purchased by userId when provided', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Course 1',
        isPublished: true,
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: 'ch-1' }],
        Purchase: [{ userId: 'user-1', courseId: 'course-1' }],
      },
    ];

    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({ userId: 'user-1' });

    expect(result).toEqual(mockCourses);
    expect(db.course.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
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
        Purchase: {
          where: {
            userId: 'user-1',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('combines multiple filters correctly', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Advanced JavaScript',
        categoryId: 'cat-1',
        isPublished: true,
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: 'ch-1' }],
        Purchase: [{ userId: 'user-1', courseId: 'course-1' }],
      },
    ];

    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({
      userId: 'user-1',
      title: 'JavaScript',
      categoryId: 'cat-1',
    });

    expect(result).toEqual(mockCourses);
    expect(db.course.findMany).toHaveBeenCalledWith({
      where: {
        isPublished: true,
        categoryId: 'cat-1',
        title: {
          contains: 'JavaScript',
          mode: 'insensitive',
        },
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
        Purchase: {
          where: {
            userId: 'user-1',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('returns empty array when no courses match filters', async () => {
    (db.course.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getCourses({ userId: 'user-1', title: 'NonExistent' });

    expect(result).toEqual([]);
  });

  it('handles database errors gracefully', async () => {
    (db.course.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    await expect(getCourses({ userId: 'user-1' })).rejects.toThrow('Database connection failed');
  });

  it('returns courses with progress information when requested', async () => {
    const mockCoursesWithProgress = [
      {
        id: 'course-1',
        title: 'Course with Progress',
        isPublished: true,
        category: { id: 'cat-1', name: 'Programming' },
        chapters: [{ id: 'ch-1' }, { id: 'ch-2' }],
        Purchase: [{ userId: 'user-1', courseId: 'course-1' }],
        progress: 50,
      },
    ];

    (db.course.findMany as jest.Mock).mockResolvedValue(mockCoursesWithProgress);

    const result = await getCourses({ userId: 'user-1' });

    expect(result).toEqual(mockCoursesWithProgress);
  });
});