import { getProgress } from '@/actions/get-progress';
import { db } from '@/lib/db';

// The global mock in jest.setup.js provides db.userProgress (camelCase)
// but the source code uses db.user_progress (snake_case).
// We need to add user_progress to the mocked db at runtime.
const mockedDb = db as Record<string, Record<string, jest.Mock>>;

// Create the user_progress model mock if it doesn't exist
if (!mockedDb.user_progress) {
  mockedDb.user_progress = {
    count: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  };
}

describe('getProgress action', () => {
  const userId = 'test-user-id';
  const courseId = 'test-course-id';

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-ensure user_progress mock exists after clearAllMocks
    if (!mockedDb.user_progress) {
      mockedDb.user_progress = {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      };
    }
  });

  it('returns 0 when course has no published chapters', async () => {
    mockedDb.chapter.findMany.mockResolvedValue([]);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(0);
  });

  it('returns 100 when all chapters are completed', async () => {
    const mockChapters = [
      { id: 'chapter-1', isPublished: true },
      { id: 'chapter-2', isPublished: true },
      { id: 'chapter-3', isPublished: true },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(3);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(100);
  });

  it('returns 50 when half of chapters are completed', async () => {
    const mockChapters = [
      { id: 'chapter-1', isPublished: true },
      { id: 'chapter-2', isPublished: true },
      { id: 'chapter-3', isPublished: true },
      { id: 'chapter-4', isPublished: true },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(2);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(50);
  });

  it('returns 0 when no chapters are completed', async () => {
    const mockChapters = [
      { id: 'chapter-1', isPublished: true },
      { id: 'chapter-2', isPublished: true },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(0);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(0);
  });

  it('calculates progress as decimal percentage', async () => {
    const mockChapters = [
      { id: 'chapter-1', isPublished: true },
      { id: 'chapter-2', isPublished: true },
      { id: 'chapter-3', isPublished: true },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(1); // 1/3 = 33.33%

    const progress = await getProgress(userId, courseId);

    expect(progress).toBeCloseTo(33.33, 0);
  });

  it('handles single chapter course correctly', async () => {
    const mockChapters = [
      { id: 'chapter-1', isPublished: true },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(1);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(100);
  });

  it('handles database errors gracefully', async () => {
    mockedDb.chapter.findMany.mockRejectedValue(new Error('Database connection error'));

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(0);
  });

  it('handles userProgress count errors gracefully', async () => {
    const mockChapters = [
      { id: 'chapter-1', isPublished: true },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockRejectedValue(new Error('Count error'));

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(0);
  });

  it('correctly calculates progress for large number of chapters', async () => {
    const mockChapters = Array.from({ length: 100 }, (_, i) => ({
      id: `chapter-${i + 1}`,
      isPublished: true,
    }));

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    mockedDb.user_progress.count.mockResolvedValue(75);

    const progress = await getProgress(userId, courseId);

    expect(progress).toBe(75);
  });

  it('can exceed 100 with data inconsistency', async () => {
    const mockChapters = [
      { id: 'chapter-1', isPublished: true },
      { id: 'chapter-2', isPublished: true },
    ];

    mockedDb.chapter.findMany.mockResolvedValue(mockChapters);
    // Simulate data inconsistency where more chapters are marked complete than exist
    mockedDb.user_progress.count.mockResolvedValue(5);

    const progress = await getProgress(userId, courseId);

    // 5/2 = 250% - data inconsistency may produce values > 100
    expect(progress).toBeGreaterThan(100);
  });
});
