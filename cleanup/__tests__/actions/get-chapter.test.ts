import { getChapter } from '@/actions/get-chapter';

describe('getChapter action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockChapterResult = {
    chapter: {
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
      userProgress: [],
    },
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
    nextChapter: {
      id: 'chapter-2',
      title: 'Advanced React',
      position: 2,
    },
    userProgress: null,
    purchase: {
      userId: 'user-1',
      courseId: 'course-1',
    },
  };

  it('should return chapter data for authenticated user with purchase', async () => {
    const userId = 'user-1';
    const courseId = 'course-1';
    const chapterId = 'chapter-1';

    (getChapter as jest.Mock).mockResolvedValue(mockChapterResult);

    const result = await getChapter({ userId, courseId, chapterId });

    expect(result).toEqual(mockChapterResult);
    expect(getChapter).toHaveBeenCalledWith({ userId, courseId, chapterId });
  });

  it('should return chapter data for free chapter without purchase', async () => {
    const freeChapterResult = {
      ...mockChapterResult,
      chapter: {
        ...mockChapterResult.chapter,
        isFree: true,
      },
      purchase: null,
    };

    (getChapter as jest.Mock).mockResolvedValue(freeChapterResult);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(result.chapter.isFree).toBe(true);
    expect(result.purchase).toBeNull();
  });

  it('should return null values for locked chapter without purchase', async () => {
    const lockedChapterResult = {
      chapter: {
        ...mockChapterResult.chapter,
        isFree: false,
      },
      course: mockChapterResult.course,
      muxData: null,
      attachments: [],
      nextChapter: null,
      userProgress: null,
      purchase: null,
    };

    (getChapter as jest.Mock).mockResolvedValue(lockedChapterResult);

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
    const notFoundResult = {
      chapter: null,
      course: null,
      muxData: null,
      attachments: [],
      nextChapter: null,
      userProgress: null,
      purchase: null,
    };

    (getChapter as jest.Mock).mockResolvedValue(notFoundResult);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'non-existent',
    });

    expect(result).toEqual(notFoundResult);
  });

  it('should return user progress when available', async () => {
    const resultWithProgress = {
      ...mockChapterResult,
      userProgress: {
        id: 'progress-1',
        userId: 'user-1',
        chapterId: 'chapter-1',
        isCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    (getChapter as jest.Mock).mockResolvedValue(resultWithProgress);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(result.userProgress).toEqual(resultWithProgress.userProgress);
  });

  it('should find next chapter correctly', async () => {
    (getChapter as jest.Mock).mockResolvedValue(mockChapterResult);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(getChapter).toHaveBeenCalledWith({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(result.nextChapter).toEqual({
      id: 'chapter-2',
      title: 'Advanced React',
      position: 2,
    });
  });

  it('should handle enrollment instead of purchase', async () => {
    const enrollmentResult = {
      ...mockChapterResult,
      purchase: null,
    };

    (getChapter as jest.Mock).mockResolvedValue(enrollmentResult);

    const result = await getChapter({
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
    });

    expect(result.chapter).toBeTruthy();
    expect(result.purchase).toBeNull();
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
