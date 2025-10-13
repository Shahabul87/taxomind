import { getChapter } from '@/actions/get-chapter';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

describe('getChapter action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockChapter = {
    id: 'chapter-1',
    title: 'Introduction to React',
    description: 'Learn React basics',
    videoUrl: 'https://example.com/video.mp4',
    position: 1,
    isPublished: true,
    isFree: false,
    courseId: 'course-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    course: {
      id: 'course-1',
      price: 99.99,
    },
    muxData: {
      id: 'mux-1',
      playbackId: 'playback-123',
    },
    attachments: [
      {
        id: 'attachment-1',
        name: 'slides.pdf',
        url: 'https://example.com/slides.pdf',
      },
    ],
    userProgress: [],
  };

  const mockNextChapter = {
    id: 'chapter-2',
    title: 'Advanced React',
    position: 2,
  };

  it('should return chapter data for authenticated user with purchase', async () => {
    const userId = 'user-1';
    const courseId = 'course-1';
    const chapterId = 'chapter-1';

    (getChapter as jest.Mock).mockResolvedValue({
      userId,
      courseId,
    });

    (getChapter as jest.Mock).mockResolvedValue(mockChapter);
    (getChapter as jest.Mock).mockResolvedValue(mockNextChapter);

    const result = await getChapter({ userId, courseId, chapterId });

    expect(result).toEqual({
      chapter: mockChapter,
      course: mockChapter.course,
      muxData: mockChapter.muxData,
      attachments: mockChapter.attachments,
      nextChapter: mockNextChapter,
      userProgress: mockChapter.userProgress[0] || null,
      purchase: { userId, courseId },
    });

    expect(getChapter).toHaveBeenCalledWith({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });
  });

  it('should return chapter data for free chapter without purchase', async () => {
    const freeChapter = {
      ...mockChapter,
      isFree: true,
    };

    (getChapter as jest.Mock).mockResolvedValue(null);
    (getChapter as jest.Mock).mockResolvedValue(freeChapter);
    (getChapter as jest.Mock).mockResolvedValue(mockNextChapter);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(result.chapter).toEqual(freeChapter);
    expect(result.purchase).toBeNull();
  });

  it('should return null values for locked chapter without purchase', async () => {
    const lockedChapter = {
      ...mockChapter,
      isFree: false,
      muxData: null,
      attachments: [],
    };

    (getChapter as jest.Mock).mockResolvedValue(null);
    (getChapter as jest.Mock).mockResolvedValue(lockedChapter);
    (getChapter as jest.Mock).mockResolvedValue(null);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(result.chapter).toBeTruthy();
    expect(result.muxData).toBeNull();
    expect(result.attachments).toEqual([]);
  });

  it('should handle chapter not found', async () => {
    (getChapter as jest.Mock).mockResolvedValue(null);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'non-existent',
    });

    expect(result).toEqual({
      chapter: null,
      course: null,
      muxData: null,
      attachments: [],
      nextChapter: null,
      userProgress: null,
      purchase: null,
    });
  });

  it('should return user progress when available', async () => {
    const chapterWithProgress = {
      ...mockChapter,
      userProgress: [
        {
          id: 'progress-1',
          userId: 'user-1',
          chapterId: 'chapter-1',
          isCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    (getChapter as jest.Mock).mockResolvedValue({ userId: 'user-1', courseId: 'course-1' });
    (getChapter as jest.Mock).mockResolvedValue(chapterWithProgress);
    (getChapter as jest.Mock).mockResolvedValue(null);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(result.userProgress).toEqual(chapterWithProgress.userProgress[0]);
  });

  it('should find next chapter correctly', async () => {
    (getChapter as jest.Mock).mockResolvedValue({ userId: 'user-1', courseId: 'course-1' });
    (getChapter as jest.Mock).mockResolvedValue(mockChapter);
    (getChapter as jest.Mock).mockResolvedValue(mockNextChapter);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(getChapter).toHaveBeenCalledWith({
      where: {
        courseId: 'course-1',
        isPublished: true,
        position: {
          gt: 1, // Greater than current chapter position
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    expect(result.nextChapter).toEqual(mockNextChapter);
  });

  it('should handle enrollment instead of purchase', async () => {
    (getChapter as jest.Mock).mockResolvedValue(null);
    (getChapter as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      courseId: 'course-1',
    });
    (getChapter as jest.Mock).mockResolvedValue(mockChapter);
    (getChapter as jest.Mock).mockResolvedValue(null);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(result.chapter).toEqual(mockChapter);
  });

  it('should handle database errors gracefully', async () => {
    (getChapter as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(
      getChapter({
        userId: 'user-1',
        courseId: 'course-1',
        chapterId: 'chapter-1',
      })
    ).rejects.toThrow('Database error');
  });
});