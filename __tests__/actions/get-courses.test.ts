import { getCourses } from '@/actions/get-courses';
import { db } from '@/lib/db';

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

    (getCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({ userId: 'user-1' });

    expect(result).toEqual(mockCourses);
    expect(getCourses).toHaveBeenCalledWith({ userId: 'user-1' });
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

    (getCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({ userId: 'user-1', title: 'JavaScript' });

    expect(result).toEqual(mockCourses);
    expect(getCourses).toHaveBeenCalledWith({ userId: 'user-1', title: 'JavaScript' });
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

    (getCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({ userId: 'user-1', categoryId: 'cat-1' });

    expect(result).toEqual(mockCourses);
    expect(getCourses).toHaveBeenCalledWith({ userId: 'user-1', categoryId: 'cat-1' });
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

    (getCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({ userId: 'user-1' });

    expect(result).toEqual(mockCourses);
    expect(getCourses).toHaveBeenCalledWith({ userId: 'user-1' });
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

    (getCourses as jest.Mock).mockResolvedValue(mockCourses);

    const result = await getCourses({
      userId: 'user-1',
      title: 'JavaScript',
      categoryId: 'cat-1',
    });

    expect(result).toEqual(mockCourses);
    expect(getCourses).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'JavaScript',
      categoryId: 'cat-1',
    });
  });

  it('returns empty array when no courses match filters', async () => {
    (getCourses as jest.Mock).mockResolvedValue([]);

    const result = await getCourses({ userId: 'user-1', title: 'NonExistent' });

    expect(result).toEqual([]);
  });

  it('handles database errors gracefully', async () => {
    (getCourses as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

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

    (getCourses as jest.Mock).mockResolvedValue(mockCoursesWithProgress);

    const result = await getCourses({ userId: 'user-1' });

    expect(result).toEqual(mockCoursesWithProgress);
  });
});
