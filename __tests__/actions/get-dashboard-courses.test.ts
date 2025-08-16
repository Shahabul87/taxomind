import { getDashboardCourses } from '@/actions/get-dashboard-courses';
import { db } from '@/lib/db';
import { getProgress } from '@/actions/get-progress';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findMany: jest.fn(),
    },
    purchase: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/actions/get-progress', () => ({
  getProgress: jest.fn(),
}));

describe('getDashboardCourses action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns completed and in-progress courses for a user', async () => {
    const userId = 'user-123';
    
    const mockPurchases = [
      { courseId: 'course-1' },
      { courseId: 'course-2' },
    ];

    const mockCourses = [
      {
        id: 'course-1',
        title: 'Course 1',
        imageUrl: '/image1.jpg',
        chapters: [{ id: 'ch-1' }, { id: 'ch-2' }],
        category: { name: 'Programming' },
      },
      {
        id: 'course-2',
        title: 'Course 2',
        imageUrl: '/image2.jpg',
        chapters: [{ id: 'ch-3' }],
        category: { name: 'Design' },
      },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);
    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
    (getProgress as jest.Mock)
      .mockResolvedValueOnce(100) // Course 1 is completed
      .mockResolvedValueOnce(50);  // Course 2 is in progress

    const result = await getDashboardCourses(userId);

    expect(result).toEqual({
      completedCourses: [
        {
          id: 'course-1',
          title: 'Course 1',
          imageUrl: '/image1.jpg',
          chapters: [{ id: 'ch-1' }, { id: 'ch-2' }],
          category: { name: 'Programming' },
          progress: 100,
        },
      ],
      coursesInProgress: [
        {
          id: 'course-2',
          title: 'Course 2',
          imageUrl: '/image2.jpg',
          chapters: [{ id: 'ch-3' }],
          category: { name: 'Design' },
          progress: 50,
        },
      ],
    });

    expect(db.purchase.findMany).toHaveBeenCalledWith({
      where: {
        userId: userId,
      },
      select: {
        courseId: true,
      },
    });

    expect(db.course.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['course-1', 'course-2'],
        },
      },
      include: {
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
        },
      },
    });

    expect(getProgress).toHaveBeenCalledTimes(2);
    expect(getProgress).toHaveBeenCalledWith(userId, 'course-1');
    expect(getProgress).toHaveBeenCalledWith(userId, 'course-2');
  });

  it('returns empty arrays when user has no purchases', async () => {
    const userId = 'user-123';

    (db.purchase.findMany as jest.Mock).mockResolvedValue([]);
    (db.course.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getDashboardCourses(userId);

    expect(result).toEqual({
      completedCourses: [],
      coursesInProgress: [],
    });

    expect(db.course.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [],
        },
      },
      include: {
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
        },
      },
    });
  });

  it('handles courses with 0% progress correctly', async () => {
    const userId = 'user-123';
    
    const mockPurchases = [{ courseId: 'course-1' }];
    const mockCourses = [
      {
        id: 'course-1',
        title: 'New Course',
        imageUrl: '/image.jpg',
        chapters: [{ id: 'ch-1' }],
        category: { name: 'Programming' },
      },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);
    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
    (getProgress as jest.Mock).mockResolvedValue(0);

    const result = await getDashboardCourses(userId);

    expect(result).toEqual({
      completedCourses: [],
      coursesInProgress: [
        {
          id: 'course-1',
          title: 'New Course',
          imageUrl: '/image.jpg',
          chapters: [{ id: 'ch-1' }],
          category: { name: 'Programming' },
          progress: 0,
        },
      ],
    });
  });

  it('handles courses with null progress correctly', async () => {
    const userId = 'user-123';
    
    const mockPurchases = [{ courseId: 'course-1' }];
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Course with null progress',
        imageUrl: '/image.jpg',
        chapters: [{ id: 'ch-1' }],
        category: { name: 'Programming' },
      },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);
    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
    (getProgress as jest.Mock).mockResolvedValue(null);

    const result = await getDashboardCourses(userId);

    expect(result).toEqual({
      completedCourses: [],
      coursesInProgress: [
        {
          id: 'course-1',
          title: 'Course with null progress',
          imageUrl: '/image.jpg',
          chapters: [{ id: 'ch-1' }],
          category: { name: 'Programming' },
          progress: null,
        },
      ],
    });
  });

  it('correctly separates multiple completed and in-progress courses', async () => {
    const userId = 'user-123';
    
    const mockPurchases = [
      { courseId: 'course-1' },
      { courseId: 'course-2' },
      { courseId: 'course-3' },
      { courseId: 'course-4' },
    ];

    const mockCourses = [
      { id: 'course-1', title: 'Course 1', imageUrl: '/1.jpg', chapters: [], category: { name: 'Cat1' } },
      { id: 'course-2', title: 'Course 2', imageUrl: '/2.jpg', chapters: [], category: { name: 'Cat2' } },
      { id: 'course-3', title: 'Course 3', imageUrl: '/3.jpg', chapters: [], category: { name: 'Cat3' } },
      { id: 'course-4', title: 'Course 4', imageUrl: '/4.jpg', chapters: [], category: { name: 'Cat4' } },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);
    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
    (getProgress as jest.Mock)
      .mockResolvedValueOnce(100) // course-1 completed
      .mockResolvedValueOnce(75)  // course-2 in progress
      .mockResolvedValueOnce(100) // course-3 completed
      .mockResolvedValueOnce(25); // course-4 in progress

    const result = await getDashboardCourses(userId);

    expect(result.completedCourses).toHaveLength(2);
    expect(result.coursesInProgress).toHaveLength(2);
    
    expect(result.completedCourses.map(c => c.id)).toEqual(['course-1', 'course-3']);
    expect(result.coursesInProgress.map(c => c.id)).toEqual(['course-2', 'course-4']);
  });

  it('handles database errors gracefully', async () => {
    const userId = 'user-123';

    (db.purchase.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(getDashboardCourses(userId)).rejects.toThrow('Database error');
  });

  it('handles getProgress errors gracefully', async () => {
    const userId = 'user-123';
    
    const mockPurchases = [{ courseId: 'course-1' }];
    const mockCourses = [
      {
        id: 'course-1',
        title: 'Course 1',
        imageUrl: '/image.jpg',
        chapters: [],
        category: { name: 'Programming' },
      },
    ];

    (db.purchase.findMany as jest.Mock).mockResolvedValue(mockPurchases);
    (db.course.findMany as jest.Mock).mockResolvedValue(mockCourses);
    (getProgress as jest.Mock).mockRejectedValue(new Error('Progress calculation failed'));

    await expect(getDashboardCourses(userId)).rejects.toThrow('Progress calculation failed');
  });
});