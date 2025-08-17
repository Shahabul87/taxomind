import { prismaMock } from '../utils/test-db';

// Mock the auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock the database
jest.mock('@/lib/db', () => ({
  db: prismaMock,
}));

import { getUserCreatedCourses, getUserEnrolledCourses } from '@/actions/get-user-courses';
import { db } from '@/lib/db';
import { auth } from '@/auth';

const mockAuth = auth as jest.Mock;

describe('getUserCourses action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSession = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
    },
  };

  const mockCreatedCourses = [
    {
      id: 'course-1',
      title: 'React Advanced',
      description: 'Advanced React patterns',
      imageUrl: 'https://example.com/react.jpg',
      price: 99.99,
      isPublished: true,
      categoryId: 'cat-1',
      userId: 'user-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      category: { id: 'cat-1', name: 'Programming' },
      Purchase: [{ id: 'purchase-1', userId: 'student-1' }],
      reviews: [{ rating: 5 }, { rating: 4 }],
    },
  ];

  const mockEnrollments = [
    {
      id: 'enrollment-1',
      userId: 'user-1',
      courseId: 'course-2',
      createdAt: new Date('2024-01-02'),
      Course: {
        id: 'course-2',
        title: 'TypeScript Mastery',
        description: 'Master TypeScript',
        imageUrl: 'https://example.com/ts.jpg',
        price: 149.99,
        isPublished: true,
        category: { id: 'cat-1', name: 'Programming' },
        reviews: [{ rating: 4 }],
        user: { name: 'Teacher', image: 'teacher.jpg' },
      },
    },
  ];

  describe('getUserCreatedCourses', () => {
    it('should return courses created by user', async () => {
      mockAuth.mockResolvedValue(mockSession);
      prismaMock.course.findMany.mockResolvedValue(mockCreatedCourses);

      const result = await getUserCreatedCourses();

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].title).toBe('React Advanced');
      expect(result.courses[0].totalEnrolled).toBe(1);
      expect(result.courses[0].totalChapters).toBe(8);
      expect(result.error).toBeNull();

      expect(prismaMock.course.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          Purchase: {
            select: {
              id: true,
              userId: true,
            },
            take: 100,
          },
          reviews: {
            select: {
              rating: true,
            },
            take: 50,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });
    });

    it('should return unauthorized error when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getUserCreatedCourses();

      expect(result.courses).toEqual([]);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('getUserEnrolledCourses', () => {
    it('should return enrolled courses for user', async () => {
      mockAuth.mockResolvedValue(mockSession);
      prismaMock.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await getUserEnrolledCourses();

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].title).toBe('TypeScript Mastery');
      expect(result.courses[0].instructor.name).toBe('Teacher');
      expect(result.error).toBeNull();

      expect(prismaMock.enrollment.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
        },
        include: {
          Course: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              reviews: {
                select: {
                  rating: true,
                },
                take: 20,
              },
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });
    });

    it('should return unauthorized error when no session', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getUserEnrolledCourses();

      expect(result.courses).toEqual([]);
      expect(result.error).toBe('Unauthorized');
    });
  });

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.course.findMany.mockRejectedValue(new Error('Database error'));

    const result = await getUserCreatedCourses();

    expect(result.courses).toEqual([]);
    expect(result.error).toBe('Failed to fetch created courses');
  });
});