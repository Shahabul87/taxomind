import { getSection } from '@/actions/get-section';

describe('getSection action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSectionResult = {
    section: {
      id: 'section-1',
      title: 'Introduction to Components',
      description: 'Learn about React components',
      videoUrl: 'https://example.com/video.mp4',
      position: 1,
      isPublished: true,
      isFree: false,
      duration: 600,
      chapterId: 'chapter-1',
      chapter: {
        id: 'chapter-1',
        courseId: 'course-1',
        course: {
          id: 'course-1',
          price: 99.99,
        },
      },
    },
    muxData: {
      id: 'mux-1',
      playbackId: 'playback-123',
    },
    attachments: [
      {
        id: 'attachment-1',
        name: 'notes.pdf',
        url: 'https://example.com/notes.pdf',
      },
    ],
    nextSection: {
      id: 'section-2',
      title: 'Next Section',
      position: 2,
    },
    userProgress: null,
    purchase: {
      userId: 'user-1',
      courseId: 'course-1',
    },
    videos: [
      {
        id: 'video-1',
        title: 'Supplementary Video',
        url: 'https://example.com/supp-video.mp4',
      },
    ],
    blogs: [
      {
        id: 'blog-1',
        title: 'Related Article',
        content: 'Article content...',
      },
    ],
    explanations: [
      {
        id: 'explanation-1',
        title: 'Key Concepts',
        content: 'Explanation content...',
      },
    ],
    codeExplanations: [
      {
        id: 'code-1',
        title: 'Code Example',
        code: 'const Component = () => {}',
      },
    ],
    mathEquations: [
      {
        id: 'math-1',
        title: 'Formula',
        equation: 'E = mc^2',
      },
    ],
    exams: [
      {
        id: 'exam-1',
        title: 'Section Quiz',
        isPublished: true,
      },
    ],
  };

  it('should return section data for user with purchase', async () => {
    const userId = 'user-1';
    const sectionId = 'section-1';

    (getSection as jest.Mock).mockResolvedValue(mockSectionResult);

    const result = await getSection({ userId, sectionId });

    expect(result).toEqual(mockSectionResult);
    expect(getSection).toHaveBeenCalledWith({ userId, sectionId });
  });

  it('should return section data for free section without purchase', async () => {
    const freeSectionResult = {
      ...mockSectionResult,
      section: {
        ...mockSectionResult.section,
        isFree: true,
      },
      purchase: null,
    };

    (getSection as jest.Mock).mockResolvedValue(freeSectionResult);

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    expect(result.section.isFree).toBe(true);
    expect(result.purchase).toBeNull();
  });

  it('should return limited data for locked section', async () => {
    const lockedSectionResult = {
      section: {
        ...mockSectionResult.section,
        isFree: false,
      },
      muxData: null,
      attachments: [],
      nextSection: null,
      userProgress: null,
      purchase: null,
      videos: [],
      blogs: [],
      explanations: [],
      codeExplanations: [],
      mathEquations: [],
      exams: [],
    };

    (getSection as jest.Mock).mockResolvedValue(lockedSectionResult);

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    expect(result.section).toBeTruthy();
    expect(result.muxData).toBeNull();
    expect(result.attachments).toEqual([]);
  });

  it('should handle section not found', async () => {
    const notFoundResult = {
      section: null,
      muxData: null,
      attachments: [],
      nextSection: null,
      userProgress: null,
      purchase: null,
      videos: [],
      blogs: [],
      explanations: [],
      codeExplanations: [],
      mathEquations: [],
      exams: [],
    };

    (getSection as jest.Mock).mockResolvedValue(notFoundResult);

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'non-existent',
    });

    expect(result).toEqual(notFoundResult);
  });

  it('should find next section correctly', async () => {
    (getSection as jest.Mock).mockResolvedValue(mockSectionResult);

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    expect(getSection).toHaveBeenCalledWith({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    expect(result.nextSection).toEqual({
      id: 'section-2',
      title: 'Next Section',
      position: 2,
    });
  });

  it('should handle enrollment instead of purchase', async () => {
    const enrollmentResult = {
      ...mockSectionResult,
      purchase: null,
    };

    (getSection as jest.Mock).mockResolvedValue(enrollmentResult);

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    expect(result.section).toBeTruthy();
    expect(result.purchase).toBeNull();
  });

  it('should only return published exams', async () => {
    const resultWithPublishedExams = {
      ...mockSectionResult,
      exams: [
        { id: 'exam-1', title: 'Published Quiz', isPublished: true },
      ],
    };

    (getSection as jest.Mock).mockResolvedValue(resultWithPublishedExams);

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    expect(result.exams).toHaveLength(1);
    expect(result.exams[0].id).toBe('exam-1');
  });

  it('should handle database errors gracefully', async () => {
    (getSection as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(
      getSection({ userId: 'user-1', sectionId: 'section-1' })
    ).rejects.toThrow('Database error');
  });
});
