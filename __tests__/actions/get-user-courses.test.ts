import { getUserCourses } from '@/actions/get-user-courses';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

describe('getUserCourses action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserCourses = [
    {
      id: 'course-1',
      title: 'React Advanced',
      description: 'Advanced React patterns',
      imageUrl: 'https://example.com/react.jpg',
      price: 99.99,
      isPublished: true,
      categoryId: 'cat-1',
      userId: 'teacher-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      category: { id: 'cat-1', name: 'Programming' },
      chapters: [
        { id: 'ch-1', isPublished: true },
        { id: 'ch-2', isPublished: true },
      ],
      purchase: [{ userId: 'user-1', courseId: 'course-1' }],
      enrollment: [],
    },
    {
      id: 'course-2',
      title: 'TypeScript Mastery',
      description: 'Master TypeScript',
      imageUrl: 'https://example.com/ts.jpg',
      price: 149.99,
      isPublished: true,
      categoryId: 'cat-1',
      userId: 'teacher-1',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      category: { id: 'cat-1', name: 'Programming' },
      chapters: [
        { id: 'ch-3', isPublished: true },
      ],
      purchase: [],
      enrollment: [{ userId: 'user-1', courseId: 'course-2' }],
    },
  ];

  it('should return courses purchased or enrolled by user', async () => {
    prismaMock.course.findMany.mockResolvedValue(mockUserCourses);
    prismaMock.userProgress.count.mockResolvedValue(1);

    const result = await getUserCourses();

    expect(prismaMock.course.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            purchase: {
              some: {
                userId: 'user-1',
              },
            },
          },
          {
            enrollment: {
              some: {
                userId: 'user-1',
              },
            },
          },
        ],
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
        purchase: {
          where: {
            userId: 'user-1',
          },
        },
        enrollment: {
          where: {
            userId: 'user-1',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    expect(result.courses).toHaveLength(2);
    expect(result.courses[0].totalChapters).toBe(8);
    expect(result.courses[1].totalChapters).toBe(8);
  });

  it('should return empty array when user has no courses', async () => {
    prismaMock.course.findMany.mockResolvedValue([]);

    const result = await getUserCourses();

    expect(result.courses).toEqual([]);
  });

  it('should handle courses with no chapters', async () => {
    const courseWithNoChapters = {
      ...mockUserCourses[0],
      chapters: [],
    };

    prismaMock.course.findMany.mockResolvedValue([courseWithNoChapters]);

    const result = await getUserCourses();

    expect(result.courses[0].totalChapters).toBe(8);
  });

  it('should calculate 100% progress for completed courses', async () => {
    prismaMock.course.findMany.mockResolvedValue([mockUserCourses[0]]);
    prismaMock.userProgress.count.mockResolvedValue(2); // All chapters completed

    const result = await getUserCourses();

    expect(result.courses[0].totalChapters).toBe(8);
  });

  it('should handle database errors gracefully', async () => {
    prismaMock.course.findMany.mockRejectedValue(new Error('Database error'));

    await expect(getUserCourses()).rejects.toThrow('Database error');
  });

  it('should only include published courses and chapters', async () => {
    const mixedCourses = [
      {
        ...mockUserCourses[0],
        isPublished: false, // Unpublished course
      },
      mockUserCourses[1],
    ];

    prismaMock.course.findMany.mockResolvedValue([mockUserCourses[1]]);

    const result = await getUserCourses();

    // Should not include unpublished course
    expect(result.courses).toHaveLength(1);
    expect(result.courses[0].id).toBe('course-2');
  });

  it('should handle both purchase and enrollment for same course', async () => {
    const courseWithBoth = {
      ...mockUserCourses[0],
      purchase: [{ userId: 'user-1', courseId: 'course-1' }],
      enrollment: [{ userId: 'user-1', courseId: 'course-1' }],
    };

    prismaMock.course.findMany.mockResolvedValue([courseWithBoth]);
    prismaMock.userProgress.count.mockResolvedValue(1);

    const result = await getUserCourses();

    expect(result.courses[0].totalChapters).toBe(8);
    // Should not duplicate the course
    expect(result.courses).toHaveLength(1);
  });
});