import { getCourse } from '@/actions/get-course';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

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
    const userId = 'user-1';
    const courseId = 'course-1';

    const courseWithPurchase = {
      ...mockCourse,
      Purchase: [{ userId, courseId }],
    };

    (getCourse as jest.Mock).mockResolvedValue(courseWithPurchase);

    const result = await getCourse(courseId);

    expect(result.course).toEqual(courseWithPurchase);
    expect(result.error).toBeUndefined();

    expect(getCourse).toHaveBeenCalledWith({
      where: {
        id: courseId,
        isPublished: true,
      },
      include: {
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
          include: {
            userProgress: {
              where: {
                userId,
              },
            },
            sections: {
              where: {
                isPublished: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
        attachments: true,
        Purchase: {
          where: {
            userId,
          },
        },
        Enrollment: {
          where: {
            userId,
          },
        },
      },
    });
  });

  it('should return course without user data when no userId provided', async () => {
    (getCourse as jest.Mock).mockResolvedValue(mockCourse);

    const result = await getCourse('course-1');

    expect(result.course).toEqual(mockCourse);
    expect(result.error).toBeUndefined();

    expect(getCourse).toHaveBeenCalledWith({
      where: {
        id: 'course-1',
        isPublished: true,
      },
      include: {
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
          include: {
            userProgress: {
              where: {
                userId: undefined,
              },
            },
            sections: {
              where: {
                isPublished: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
        attachments: true,
        Purchase: {
          where: {
            userId: undefined,
          },
        },
        Enrollment: {
          where: {
            userId: undefined,
          },
        },
      },
    });
  });

  it('should return null for non-existent course', async () => {
    (getCourse as jest.Mock).mockResolvedValue(null);

    const result = await getCourse('non-existent');

    expect(result.course).toBeNull();
  });

  it('should return null for unpublished course', async () => {
    (getCourse as jest.Mock).mockResolvedValue(null);

    const result = await getCourse('unpublished-course');

    expect(result.course).toBeNull();

    // Verify query includes isPublished: true
    expect(getCourse).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'unpublished-course',
          isPublished: true,
        },
      })
    );
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

    expect(result.course?.chapters[0]).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should order chapters and sections by position', async () => {
    (getCourse as jest.Mock).mockResolvedValue(mockCourse);

    await getCourse('course-1');

    const callArgs = prismaMock.course.findUnique.mock.calls[0][0];
    
    expect(callArgs.include.chapters.orderBy).toEqual({
      position: 'asc',
    });
    
    expect(callArgs.include.chapters.include.sections.orderBy).toEqual({
      position: 'asc',
    });
  });

  it('should handle database errors gracefully', async () => {
    (getCourse as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(
      getCourse('course-1')
    ).rejects.toThrow('Database error');
  });

  it('should only include published chapters and sections', async () => {
    (getCourse as jest.Mock).mockResolvedValue(mockCourse);

    await getCourse('course-1');

    const callArgs = prismaMock.course.findUnique.mock.calls[0][0];
    
    expect(callArgs.include.chapters.where).toEqual({
      isPublished: true,
    });
    
    expect(callArgs.include.chapters.include.sections.where).toEqual({
      isPublished: true,
    });
  });
});