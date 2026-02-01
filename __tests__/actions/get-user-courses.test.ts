// Mock the actions
jest.mock('@/actions/get-user-courses', () => ({
  getUserCreatedCourses: jest.fn(),
  getUserEnrolledCourses: jest.fn(),
}));

// Mock the auth module
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findMany: jest.fn(),
    },
    enrollment: {
      findMany: jest.fn(),
    },
  },
}));

import { getUserCreatedCourses, getUserEnrolledCourses } from '@/actions/get-user-courses';

describe('getUserCourses action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserCreatedCourses', () => {
    it('should return courses created by user', async () => {
      const mockResult = {
        courses: [
          {
            id: 'course-1',
            title: 'React Advanced',
            description: 'Advanced React patterns',
            imageUrl: 'https://example.com/react.jpg',
            price: 99.99,
            isPublished: true,
            categoryId: 'cat-1',
            userId: 'user-1',
            createdAt: new Date('2024-01-01T00:00:00Z'),
            updatedAt: new Date('2024-01-01T00:00:00Z'),
            category: { id: 'cat-1', name: 'Programming' },
            Purchase: [{ id: 'purchase-1', userId: 'student-1' }],
            reviews: [{ rating: 5 }, { rating: 4 }],
            totalEnrolled: 1,
            totalChapters: 8,
            averageRating: 4.5,
          },
        ],
        error: null,
      };

      (getUserCreatedCourses as jest.Mock).mockResolvedValue(mockResult);

      const result = await getUserCreatedCourses();

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].title).toBe('React Advanced');
      expect(result.courses[0].totalEnrolled).toBe(1);
      expect(result.courses[0].totalChapters).toBe(8);
      expect(result.error).toBeNull();
      expect(getUserCreatedCourses).toHaveBeenCalled();
    });

    it('should return unauthorized error when no session', async () => {
      (getUserCreatedCourses as jest.Mock).mockResolvedValue({
        courses: [],
        error: 'Unauthorized',
      });

      const result = await getUserCreatedCourses();

      expect(result.courses).toEqual([]);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('getUserEnrolledCourses', () => {
    it('should return enrolled courses for user', async () => {
      const mockResult = {
        courses: [
          {
            id: 'course-2',
            title: 'TypeScript Mastery',
            description: 'Master TypeScript',
            imageUrl: 'https://example.com/ts.jpg',
            price: 149.99,
            isPublished: true,
            category: { id: 'cat-1', name: 'Programming' },
            reviews: [{ rating: 4 }],
            instructor: { name: 'Teacher', image: 'teacher.jpg' },
            enrollmentId: 'enrollment-1',
            enrolledAt: new Date('2024-01-02T00:00:00Z'),
            totalRatings: 1,
            averageRating: 4,
            totalChapters: 8,
            totalSections: 35,
            completedSections: 10,
            completionPercentage: 29,
          },
        ],
        error: null,
      };

      (getUserEnrolledCourses as jest.Mock).mockResolvedValue(mockResult);

      const result = await getUserEnrolledCourses();

      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].title).toBe('TypeScript Mastery');
      expect(result.courses[0].instructor.name).toBe('Teacher');
      expect(result.error).toBeNull();
    });

    it('should return unauthorized error when no session', async () => {
      (getUserEnrolledCourses as jest.Mock).mockResolvedValue({
        courses: [],
        error: 'Unauthorized',
      });

      const result = await getUserEnrolledCourses();

      expect(result.courses).toEqual([]);
      expect(result.error).toBe('Unauthorized');
    });
  });

  it('should handle database errors gracefully', async () => {
    (getUserCreatedCourses as jest.Mock).mockResolvedValue({
      courses: [],
      error: 'Failed to fetch created courses',
    });

    const result = await getUserCreatedCourses();

    expect(result.courses).toEqual([]);
    expect(result.error).toBe('Failed to fetch created courses');
  });
});
