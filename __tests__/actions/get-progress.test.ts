import { getProgress } from '@/actions/get-progress';
import { db } from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    user_progress: {
      count: jest.fn(),
    },
    chapter: {
      findMany: jest.fn(),
    },
  },
}));

// Type the mocked db
type MockedDb = {
  user_progress: {
    count: jest.MockedFunction<any>;
  };
  chapter: {
    findMany: jest.MockedFunction<any>;
  };
};

const mockedDb = db as unknown as MockedDb;

describe('getProgress action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 0 when course has no published chapters', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    mockedDb.chapter.findMany.mockResolvedValue([]);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(0);
    expect(mockedDb.chapter.findMany).toHaveBeenCalledWith({
      where: {
        courseId: courseId,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });
  });

  it('returns 100 when all chapters are completed', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    const mockChapters = [
      { id: 'chapter-1' },
      { id: 'chapter-2' },
      { id: 'chapter-3' },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(3);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(100);
    
    expect(mockedDb.user_progress.count).toHaveBeenCalledWith({
      where: {
        userId: userId,
        chapterId: {
          in: ['chapter-1', 'chapter-2', 'chapter-3'],
        },
        isCompleted: true,
      },
    });
  });

  it('returns 50 when half of chapters are completed', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    const mockChapters = [
      { id: 'chapter-1' },
      { id: 'chapter-2' },
      { id: 'chapter-3' },
      { id: 'chapter-4' },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(2);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(50);
  });

  it('returns 0 when no chapters are completed', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    const mockChapters = [
      { id: 'chapter-1' },
      { id: 'chapter-2' },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(0);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(0);
  });

  it('calculates progress as decimal percentage', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    const mockChapters = [
      { id: 'chapter-1' },
      { id: 'chapter-2' },
      { id: 'chapter-3' },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(1); // 1/3 = 33.33%

    const progress = await getProgress(userId, courseId);

    expect(progress).toBeCloseTo(33.33, 1); // Returns decimal, not rounded
  });

  it('handles single chapter course correctly', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    const mockChapters = [{ id: 'chapter-1' }];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(1);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(100);
  });

  it('handles database errors gracefully', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    mockedDb.chapter.findMany.mockRejectedValue(new Error('Database connection failed'));

    // Function returns 0 on error, doesn't throw
    const progress = await getProgress(userId, courseId);
    expect(progress).toBe(0);
  });

  it('handles userProgress count errors gracefully', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    const mockChapters = [{ id: 'chapter-1' }];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockRejectedValue(new Error('Count failed'));

    // Function returns 0 on error, doesn't throw
    const progress = await getProgress(userId, courseId);
    expect(progress).toBe(0);
  });

  it('correctly calculates progress for large number of chapters', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    // Create 100 chapters
    const mockChapters = Array.from({ length: 100 }, (_, i) => ({ 
      id: `chapter-${i + 1}` 
    }));

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(75); // 75 completed

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(75);
  });

  it('can exceed 100 with data inconsistency', async () => {
    const userId = 'user-123';
    const courseId = 'course-456';

    const mockChapters = [
      { id: 'chapter-1' },
      { id: 'chapter-2' },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    // Simulate data inconsistency where more chapters are marked complete than exist
    mockedDb.user_progress.count.mockResolvedValue(5);

    const progress = await getProgress(userId, courseId);

    // Function doesn't cap at 100, returns actual calculation
    expect(progress).toBe(250); // 5/2 * 100 = 250
  });
});