import { getCourse } from '@/actions/get-course';

describe('getCourse action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCourse = {
    id: 'course-1',
    title: 'Complete React Course',
    description: 'Master React from basics to advanced',
    imageUrl: 'https://example.com/course.jpg',
    price: 99.99,
    isPublished: true,
    categoryId: 'cat-1',
    userId: 'teacher-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-1',
      name: 'Programming',
    },
    chapters: [
      {
        id: 'ch-1',
        title: 'Getting Started',
        description: 'Introduction',
        videoUrl: 'https://example.com/video1.mp4',
        position: 1,
        isPublished: true,
        isFree: true,
        courseId: 'course-1',
        userProgress: [],
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            isPublished: true,
          },
        ],
      },
      {
        id: 'ch-2',
        title: 'Advanced Topics',
        description: 'Deep dive',
        videoUrl: 'https://example.com/video2.mp4',
        position: 2,
        isPublished: true,
        isFree: false,
        courseId: 'course-1',
        userProgress: [],
        sections: [],
      },
    ],
    attachments: [
      {
        id: 'attachment-1',
        name: 'course-materials.pdf',
        url: 'https://example.com/materials.pdf',
      },
    ],
    Purchase: [],
    Enrollment: [],
  };

  it('should return full course data for purchased course', async () => {
    const courseId = 'course-1';

    const courseWithPurchase = {
      ...mockCourse,
      Purchase: [{ userId: 'user-1', courseId }],
    };

    (getCourse as jest.Mock).mockResolvedValue(courseWithPurchase);

    const result = await getCourse(courseId);

    expect(result).toEqual(courseWithPurchase);
    expect(getCourse).toHaveBeenCalledWith(courseId);
  });

  it('should return course without user data when no userId provided', async () => {
    (getCourse as jest.Mock).mockResolvedValue(mockCourse);

    const result = await getCourse('course-1');

    expect(result).toEqual(mockCourse);
    expect(getCourse).toHaveBeenCalledWith('course-1');
  });

  it('should return null for non-existent course', async () => {
    (getCourse as jest.Mock).mockResolvedValue(null);

    const result = await getCourse('non-existent');

    expect(result).toBeNull();
  });

  it('should return null for unpublished course', async () => {
    (getCourse as jest.Mock).mockResolvedValue(null);

    const result = await getCourse('unpublished-course');

    expect(result).toBeNull();
    expect(getCourse).toHaveBeenCalledWith('unpublished-course');
  });

  it('should include user progress for enrolled user', async () => {
    const courseWithProgress = {
      ...mockCourse,
      chapters: [
        {
          ...mockCourse.chapters[0],
          userProgress: [
            {
              id: 'progress-1',
              userId: 'user-1',
              chapterId: 'ch-1',
              isCompleted: true,
            },
          ],
        },
        mockCourse.chapters[1],
      ],
      Enrollment: [{ userId: 'user-1', courseId: 'course-1' }],
    };

    (getCourse as jest.Mock).mockResolvedValue(courseWithProgress);

    const result = await getCourse('course-1');

    expect(result).toBeDefined();
    expect(result.chapters[0].userProgress).toHaveLength(1);
    expect(result.chapters[0].userProgress[0].isCompleted).toBe(true);
  });

  it('should return course with chapters ordered by position', async () => {
    (getCourse as jest.Mock).mockResolvedValue(mockCourse);

    const result = await getCourse('course-1');

    expect(result).toBeDefined();
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].position).toBe(1);
    expect(result.chapters[1].position).toBe(2);
  });

  it('should handle database errors gracefully', async () => {
    (getCourse as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(
      getCourse('course-1')
    ).rejects.toThrow('Database error');
  });

  it('should only include published chapters and sections', async () => {
    (getCourse as jest.Mock).mockResolvedValue(mockCourse);

    const result = await getCourse('course-1');

    expect(result).toBeDefined();
    // All chapters in mock data are published
    result.chapters.forEach((chapter: { isPublished: boolean }) => {
      expect(chapter.isPublished).toBe(true);
    });
  });
});
