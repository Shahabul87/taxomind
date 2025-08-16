import { getSection } from '@/actions/get-section';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

describe('getSection action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSection = {
    id: 'section-1',
    title: 'Introduction to Components',
    description: 'Learn about React components',
    videoUrl: 'https://example.com/video.mp4',
    position: 1,
    isPublished: true,
    isFree: false,
    duration: 600,
    chapterId: 'chapter-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    chapter: {
      id: 'chapter-1',
      courseId: 'course-1',
      course: {
        id: 'course-1',
        price: 99.99,
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

    prismaMock.section.findUnique.mockResolvedValue(mockSection);
    prismaMock.purchase.findUnique.mockResolvedValue({
      userId,
      courseId: 'course-1',
    });
    prismaMock.section.findFirst.mockResolvedValue({
      id: 'section-2',
      title: 'Next Section',
      position: 2,
    });

    const result = await getSection({ userId, sectionId });

    expect(result).toEqual({
      section: mockSection,
      muxData: mockSection.muxData,
      attachments: mockSection.attachments,
      nextSection: {
        id: 'section-2',
        title: 'Next Section',
        position: 2,
      },
      userProgress: null,
      purchase: {
        userId,
        courseId: 'course-1',
      },
      videos: mockSection.videos,
      blogs: mockSection.blogs,
      explanations: mockSection.explanations,
      codeExplanations: mockSection.codeExplanations,
      mathEquations: mockSection.mathEquations,
      exams: mockSection.exams,
    });
  });

  it('should return section data for free section without purchase', async () => {
    const freeSection = {
      ...mockSection,
      isFree: true,
    };

    prismaMock.section.findUnique.mockResolvedValue(freeSection);
    prismaMock.purchase.findUnique.mockResolvedValue(null);
    prismaMock.section.findFirst.mockResolvedValue(null);

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    expect(result.section).toEqual(freeSection);
    expect(result.purchase).toBeNull();
  });

  it('should return limited data for locked section', async () => {
    const lockedSection = {
      ...mockSection,
      isFree: false,
    };

    prismaMock.section.findUnique.mockResolvedValue(lockedSection);
    prismaMock.purchase.findUnique.mockResolvedValue(null);
    prismaMock.enrollment.findUnique.mockResolvedValue(null);

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    // Should have section but no premium content
    expect(result.section).toBeTruthy();
    expect(result.muxData).toBeNull();
    expect(result.attachments).toEqual([]);
  });

  it('should handle section not found', async () => {
    prismaMock.section.findUnique.mockResolvedValue(null);

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'non-existent',
    });

    expect(result).toEqual({
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
    });
  });

  it('should find next section correctly', async () => {
    prismaMock.section.findUnique.mockResolvedValue(mockSection);
    prismaMock.purchase.findUnique.mockResolvedValue({
      userId: 'user-1',
      courseId: 'course-1',
    });
    prismaMock.section.findFirst.mockResolvedValue({
      id: 'section-2',
      title: 'Next Section',
      position: 2,
    });

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    expect(prismaMock.section.findFirst).toHaveBeenCalledWith({
      where: {
        chapterId: 'chapter-1',
        isPublished: true,
        position: {
          gt: 1,
        },
      },
      orderBy: {
        position: 'asc',
      },
    });

    expect(result.nextSection).toEqual({
      id: 'section-2',
      title: 'Next Section',
      position: 2,
    });
  });

  it('should handle enrollment instead of purchase', async () => {
    prismaMock.section.findUnique.mockResolvedValue(mockSection);
    prismaMock.purchase.findUnique.mockResolvedValue(null);
    prismaMock.enrollment.findUnique.mockResolvedValue({
      userId: 'user-1',
      courseId: 'course-1',
    });

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    expect(result.section).toEqual(mockSection);
    expect(result.purchase).toBeNull();
  });

  it('should only return published exams', async () => {
    const sectionWithExams = {
      ...mockSection,
      exams: [
        { id: 'exam-1', title: 'Published Quiz', isPublished: true },
        { id: 'exam-2', title: 'Unpublished Quiz', isPublished: false },
      ],
    };

    prismaMock.section.findUnique.mockResolvedValue(sectionWithExams);
    prismaMock.purchase.findUnique.mockResolvedValue({
      userId: 'user-1',
      courseId: 'course-1',
    });

    const result = await getSection({
      userId: 'user-1',
      sectionId: 'section-1',
    });

    // Should only include published exam
    expect(result.exams).toHaveLength(1);
    expect(result.exams?.[0].id).toBe('exam-1');
  });

  it('should handle database errors gracefully', async () => {
    prismaMock.section.findUnique.mockRejectedValue(new Error('Database error'));

    await expect(
      getSection({ userId: 'user-1', sectionId: 'section-1' })
    ).rejects.toThrow('Database error');
  });
});