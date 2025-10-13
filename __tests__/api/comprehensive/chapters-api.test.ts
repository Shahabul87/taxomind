/**
 * Comprehensive Chapters API Test Suite
 * TypeScript-safe testing for chapter CRUD operations
 * Following enterprise standards with systematic coverage
 */

import { jest, describe, beforeEach, it, expect, beforeAll, afterAll } from '@jest/globals';
import { 
  MockUser,
  MockCourse,
  MockChapter,
  CreateChapterRequest,
  UpdateChapterRequest,
  ChapterWithRelations,
  ApiResponse,
  MockApiResponse,
} from '../types/api-test-types';
import {
  testDataGenerator,
  courseDataBuilder,
  databaseMockManager,
  AuthMockHelper,
  MockResponseBuilder,
  ErrorTestingHelper,
  ValidationHelper,
} from '../utils/test-helpers';
import { setupAllMocks } from '../utils/mock-setup';

// Setup all mocks before importing modules
setupAllMocks();

// Import after mocking
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

describe('/api/courses/[courseId]/chapters - Comprehensive Test Suite', () => {
  let authMock: AuthMockHelper;
  let dbMocks: Record<string, jest.Mock>;

  beforeAll(() => {
    // Setup database mocks
    dbMocks = {
      course: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
      chapter: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
      section: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
    };

    // Setup auth mock helper
    authMock = new AuthMockHelper(
      currentUser as jest.Mock,
      dbMocks.user.findUnique as jest.Mock
    );
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    databaseMockManager.clearAll();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Test data generators
  const adminUser: MockUser = testDataGenerator.user({
    id: 'admin-1',
    role: 'ADMIN',
    name: 'Admin User',
    email: 'admin@taxomind.com',
  });

  const instructorUser: MockUser = testDataGenerator.user({
    id: 'instructor-1',
    role: 'USER',
    name: 'Instructor User',
    email: 'instructor@taxomind.com',
    isTeacher: true,
  });

  const studentUser: MockUser = testDataGenerator.user({
    id: 'student-1',
    role: 'USER',
    name: 'Student User',
    email: 'student@taxomind.com',
  });

  const testCourse: MockCourse = {
    id: 'course-1',
    title: 'Test Course',
    description: 'A comprehensive test course',
    cleanDescription: 'A comprehensive test course',
    subtitle: 'Test Course Subtitle',
    imageUrl: 'https://example.com/image.jpg',
    price: 99,
    isPublished: true,
    isFeatured: false,
    categoryId: 'category-1',
    userId: instructorUser.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    whatYouWillLearn: ['Learn TypeScript', 'Learn Testing'],
    courseGoals: 'Master testing fundamentals',
  };

  // Mock API handlers following the established pattern
  const POST_ChapterHandler = async (
    courseId: string, 
    body: CreateChapterRequest
  ): Promise<MockApiResponse> => {
    try {
      const user = await currentUser();
      if (!user?.id) {
        return MockResponseBuilder.unauthorized();
      }

      // Check if course exists and user has permission
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { id: true, userId: true, title: true }
      });

      if (!course) {
        return MockResponseBuilder.notFound('Course');
      }

      // Check if user owns the course or is admin
      const userRecord = await db.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true }
      });

      if (!userRecord) {
        return MockResponseBuilder.unauthorized();
      }

      const isOwner = course.userId === user.id;
      const isAdmin = userRecord.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return MockResponseBuilder.forbidden('Only course owner or admin can create chapters');
      }

      // Validate required fields
      if (!body.title || body.title.trim().length === 0) {
        return MockResponseBuilder.validation('title', 'Chapter title is required');
      }

      // Get the next position if not provided
      let position = body.position || 1;
      if (!body.position) {
        const lastChapter = await db.chapter.findFirst({
          where: { courseId },
          orderBy: { position: 'desc' },
          select: { position: true }
        });
        position = (lastChapter?.position || 0) + 1;
      }

      const chapterData = {
        courseId,
        title: body.title.trim(),
        description: body.description || null,
        position,
        courseGoals: body.courseGoals || null,
        learningOutcomes: body.learningOutcomes || null,
        estimatedTime: body.estimatedTime || null,
        difficulty: body.difficulty || null,
        prerequisites: body.prerequisites || null,
        resources: body.resources || null,
        isPublished: false,
        isFree: false,
      };

      const createdChapter = await db.chapter.create({
        data: chapterData,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              userId: true,
            },
          },
          sections: true,
          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

      return MockResponseBuilder.success(createdChapter, 201);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Foreign key constraint')) {
          return MockResponseBuilder.error('Invalid course ID', 400, 'INVALID_COURSE');
        }
        if (error.message.includes('Unique constraint')) {
          return MockResponseBuilder.error('Chapter position already exists', 409, 'DUPLICATE_POSITION');
        }
      }
      return MockResponseBuilder.error('Internal Server Error', 500);
    }
  };

  const GET_ChaptersHandler = async (
    courseId: string,
    queryParams: Record<string, string> = {}
  ): Promise<MockApiResponse> => {
    try {
      const user = await currentUser();
      
      // Check if course exists
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { id: true, userId: true, isPublished: true }
      });

      if (!course) {
        return MockResponseBuilder.notFound('Course');
      }

      // Build where clause for chapters
      const whereClause: Record<string, unknown> = {
        courseId,
      };

      // If user is not the course owner or admin, only show published chapters
      if (user?.id !== course.userId) {
        const userRecord = await db.user.findUnique({
          where: { id: user?.id || '' },
          select: { role: true }
        });

        if (!userRecord || userRecord.role !== 'ADMIN') {
          whereClause.isPublished = true;
        }
      }

      const chapters = await db.chapter.findMany({
        where: whereClause,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              userId: true,
            },
          },
          sections: {
            where: user?.id === course.userId ? {} : { isPublished: true },
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              position: true,
              isPublished: true,
              isFree: true,
              duration: true,
            },
          },
          _count: {
            select: {
              sections: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      });

      return MockResponseBuilder.success(chapters);
    } catch (error) {
      return MockResponseBuilder.error('Internal Server Error', 500);
    }
  };

  const PATCH_ChapterHandler = async (
    courseId: string,
    chapterId: string,
    body: UpdateChapterRequest
  ): Promise<MockApiResponse> => {
    try {
      const user = await currentUser();
      if (!user?.id) {
        return MockResponseBuilder.unauthorized();
      }

      // Check if chapter exists and get course info
      const chapter = await db.chapter.findUnique({
        where: { id: chapterId },
        include: {
          course: {
            select: { id: true, userId: true }
          }
        }
      });

      if (!chapter) {
        return MockResponseBuilder.notFound('Chapter');
      }

      if (chapter.courseId !== courseId) {
        return MockResponseBuilder.error('Chapter does not belong to this course', 400, 'INVALID_CHAPTER_COURSE');
      }

      // Check permission
      const userRecord = await db.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true }
      });

      if (!userRecord) {
        return MockResponseBuilder.unauthorized();
      }

      const isOwner = chapter.course.userId === user.id;
      const isAdmin = userRecord.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return MockResponseBuilder.forbidden('Only course owner or admin can update chapters');
      }

      // Validate title if provided
      if (body.title !== undefined && (!body.title || body.title.trim().length === 0)) {
        return MockResponseBuilder.validation('title', 'Chapter title cannot be empty');
      }

      // Build update data
      const updateData: Partial<MockChapter> = {};
      
      if (body.title !== undefined) {
        updateData.title = body.title.trim();
      }
      if (body.description !== undefined) {
        updateData.description = body.description;
      }
      if (body.position !== undefined) {
        updateData.position = body.position;
      }
      if (body.isPublished !== undefined) {
        updateData.isPublished = body.isPublished;
      }
      if (body.isFree !== undefined) {
        updateData.isFree = body.isFree;
      }
      if (body.courseGoals !== undefined) {
        updateData.courseGoals = body.courseGoals;
      }
      if (body.learningOutcomes !== undefined) {
        updateData.learningOutcomes = body.learningOutcomes;
      }
      if (body.estimatedTime !== undefined) {
        updateData.estimatedTime = body.estimatedTime;
      }
      if (body.difficulty !== undefined) {
        updateData.difficulty = body.difficulty;
      }
      if (body.prerequisites !== undefined) {
        updateData.prerequisites = body.prerequisites;
      }
      if (body.resources !== undefined) {
        updateData.resources = body.resources;
      }

      updateData.updatedAt = new Date();

      const updatedChapter = await db.chapter.update({
        where: { id: chapterId },
        data: updateData,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              userId: true,
            },
          },
          sections: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              position: true,
              isPublished: true,
              isFree: true,
            },
          },
          _count: {
            select: {
              sections: true,
            },
          },
        },
      });

      return MockResponseBuilder.success(updatedChapter);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Unique constraint')) {
          return MockResponseBuilder.error('Chapter position already exists', 409, 'DUPLICATE_POSITION');
        }
      }
      return MockResponseBuilder.error('Internal Server Error', 500);
    }
  };

  const DELETE_ChapterHandler = async (
    courseId: string,
    chapterId: string
  ): Promise<MockApiResponse> => {
    try {
      const user = await currentUser();
      if (!user?.id) {
        return MockResponseBuilder.unauthorized();
      }

      // Check if chapter exists and get course info
      const chapter = await db.chapter.findUnique({
        where: { id: chapterId },
        include: {
          course: {
            select: { id: true, userId: true }
          },
          _count: {
            select: { sections: true }
          }
        }
      });

      if (!chapter) {
        return MockResponseBuilder.notFound('Chapter');
      }

      if (chapter.courseId !== courseId) {
        return MockResponseBuilder.error('Chapter does not belong to this course', 400, 'INVALID_CHAPTER_COURSE');
      }

      // Check permission
      const userRecord = await db.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true }
      });

      if (!userRecord) {
        return MockResponseBuilder.unauthorized();
      }

      const isOwner = chapter.course.userId === user.id;
      const isAdmin = userRecord.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return MockResponseBuilder.forbidden('Only course owner or admin can delete chapters');
      }

      // Check if chapter has sections
      if (chapter._count.sections > 0) {
        return MockResponseBuilder.error(
          'Cannot delete chapter with existing sections. Delete sections first.',
          400,
          'CHAPTER_HAS_SECTIONS'
        );
      }

      await db.chapter.delete({
        where: { id: chapterId }
      });

      return MockResponseBuilder.success({ message: 'Chapter deleted successfully' });
    } catch (error) {
      return MockResponseBuilder.error('Internal Server Error', 500);
    }
  };

  describe('POST /api/courses/[courseId]/chapters - Chapter Creation', () => {
    describe('Authentication and Authorization', () => {
      it('should reject unauthenticated requests', async () => {
        authMock.mockUnauthenticated();

        const chapterData: CreateChapterRequest = {
          title: 'Test Chapter',
          description: 'A test chapter',
        };

        const response = await POST_ChapterHandler('course-1', chapterData);
        expect(response.status).toBe(401);
        expect(dbMocks.chapter.create).not.toHaveBeenCalled();
      });

      it('should reject users who do not own the course', async () => {
        authMock.mockRegularUser(studentUser);
        
        // Mock course owned by instructor
        dbMocks.course.findUnique.mockResolvedValue(testCourse);

        const chapterData: CreateChapterRequest = {
          title: 'Test Chapter',
        };

        const response = await POST_ChapterHandler(testCourse.id, chapterData);
        expect(response.status).toBe(403);
        
        const responseData = await response.json!();
        expect(responseData.success).toBe(false);
        expect(responseData.error?.message).toContain('Only course owner or admin');
      });

      it('should allow course owners to create chapters', async () => {
        authMock.mockRegularUser(instructorUser);
        
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
        dbMocks.chapter.findFirst.mockResolvedValue(null); // No existing chapters
        
        const createdChapter = testDataGenerator.chapter({
          id: 'chapter-1',
          title: 'Introduction to React',
          courseId: testCourse.id,
          position: 1,
        });

        const chapterWithRelations: ChapterWithRelations = {
          ...createdChapter,
          course: {
            id: testCourse.id,
            title: testCourse.title,
            userId: testCourse.userId,
          },
          sections: [],
          _count: { sections: 0 },
        };

        dbMocks.chapter.create.mockResolvedValue(chapterWithRelations);

        const chapterData: CreateChapterRequest = {
          title: 'Introduction to React',
          description: 'Learn React fundamentals',
        };

        const response = await POST_ChapterHandler(testCourse.id, chapterData);
        expect(response.status).toBe(201);
        
        const responseData = await response.json!();
        expect(responseData.success).toBe(true);
        expect(responseData.data.title).toBe('Introduction to React');
        expect(responseData.data.position).toBe(1);
      });

      it('should allow admins to create chapters in any course', async () => {
        authMock.mockAdmin(adminUser);
        
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
        dbMocks.chapter.findFirst.mockResolvedValue(null);
        
        const createdChapter = testDataGenerator.chapter({
          title: 'Admin Chapter',
          courseId: testCourse.id,
        });

        const chapterWithRelations: ChapterWithRelations = {
          ...createdChapter,
          course: testCourse,
          sections: [],
          _count: { sections: 0 },
        };

        dbMocks.chapter.create.mockResolvedValue(chapterWithRelations);

        const chapterData: CreateChapterRequest = {
          title: 'Admin Chapter',
        };

        const response = await POST_ChapterHandler(testCourse.id, chapterData);
        expect(response.status).toBe(201);
      });
    });

    describe('Input Validation', () => {
      beforeEach(() => {
        authMock.mockRegularUser(instructorUser);
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
        dbMocks.chapter.findFirst.mockResolvedValue(null);
      });

      it('should require chapter title', async () => {
        const invalidData: CreateChapterRequest = {
          title: '', // Empty title
          description: 'Chapter without title',
        };

        const response = await POST_ChapterHandler(testCourse.id, invalidData);
        expect(response.status).toBe(400);
        
        const responseData = await response.json!();
        expect(responseData.success).toBe(false);
        expect(responseData.error?.message).toBe('Chapter title is required');
      });

      it('should trim whitespace from title', async () => {
        const createdChapter = testDataGenerator.chapter({
          title: 'Trimmed Chapter',
          courseId: testCourse.id,
        });

        const chapterWithRelations: ChapterWithRelations = {
          ...createdChapter,
          course: testCourse,
          sections: [],
          _count: { sections: 0 },
        };

        dbMocks.chapter.create.mockResolvedValue(chapterWithRelations);

        const chapterData: CreateChapterRequest = {
          title: '  Trimmed Chapter  ', // Title with whitespace
        };

        const response = await POST_ChapterHandler(testCourse.id, chapterData);
        expect(response.status).toBe(201);
        
        expect(dbMocks.chapter.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            title: 'Trimmed Chapter', // Should be trimmed
          }),
          include: expect.any(Object),
        });
      });

      it('should auto-assign position when not provided', async () => {
        // Mock existing chapter with position 2
        const existingChapter = testDataGenerator.chapter({
          position: 2,
          courseId: testCourse.id,
        });
        
        dbMocks.chapter.findFirst.mockResolvedValue(existingChapter);

        const createdChapter = testDataGenerator.chapter({
          title: 'Auto Position Chapter',
          courseId: testCourse.id,
          position: 3, // Should be next position
        });

        const chapterWithRelations: ChapterWithRelations = {
          ...createdChapter,
          course: testCourse,
          sections: [],
          _count: { sections: 0 },
        };

        dbMocks.chapter.create.mockResolvedValue(chapterWithRelations);

        const chapterData: CreateChapterRequest = {
          title: 'Auto Position Chapter',
          // No position provided
        };

        const response = await POST_ChapterHandler(testCourse.id, chapterData);
        expect(response.status).toBe(201);
        
        expect(dbMocks.chapter.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            position: 3, // Should be last position + 1
          }),
          include: expect.any(Object),
        });
      });

      it('should handle all optional fields correctly', async () => {
        const createdChapter = testDataGenerator.chapter({
          title: 'Complete Chapter',
          courseId: testCourse.id,
          courseGoals: 'Learn chapter goals',
          learningOutcomes: 'Students will understand...',
          estimatedTime: '2 hours',
          difficulty: 'Intermediate',
          prerequisites: 'Basic knowledge required',
          resources: 'Additional reading materials',
        });

        const chapterWithRelations: ChapterWithRelations = {
          ...createdChapter,
          course: testCourse,
          sections: [],
          _count: { sections: 0 },
        };

        dbMocks.chapter.create.mockResolvedValue(chapterWithRelations);

        const chapterData: CreateChapterRequest = {
          title: 'Complete Chapter',
          description: 'A comprehensive chapter',
          position: 1,
          courseGoals: 'Learn chapter goals',
          learningOutcomes: 'Students will understand...',
          estimatedTime: '2 hours',
          difficulty: 'Intermediate',
          prerequisites: 'Basic knowledge required',
          resources: 'Additional reading materials',
        };

        const response = await POST_ChapterHandler(testCourse.id, chapterData);
        expect(response.status).toBe(201);
        
        const responseData = await response.json!();
        expect(responseData.data).toMatchObject({
          title: 'Complete Chapter',
          courseGoals: 'Learn chapter goals',
          learningOutcomes: 'Students will understand...',
          estimatedTime: '2 hours',
          difficulty: 'Intermediate',
          prerequisites: 'Basic knowledge required',
          resources: 'Additional reading materials',
        });
      });
    });

    describe('Course Validation', () => {
      beforeEach(() => {
        authMock.mockRegularUser(instructorUser);
      });

      it('should return 404 for non-existent courses', async () => {
        dbMocks.course.findUnique.mockResolvedValue(null);

        const chapterData: CreateChapterRequest = {
          title: 'Chapter in Non-existent Course',
        };

        const response = await POST_ChapterHandler('non-existent-course', chapterData);
        expect(response.status).toBe(404);
        
        const responseData = await response.json!();
        expect(responseData.success).toBe(false);
        expect(responseData.error?.message).toBe('Course not found');
      });
    });

    describe('Database Error Handling', () => {
      beforeEach(() => {
        authMock.mockRegularUser(instructorUser);
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
      });

      it('should handle foreign key constraint errors', async () => {
        dbMocks.chapter.create.mockRejectedValue(
          new Error('Foreign key constraint failed')
        );

        const chapterData: CreateChapterRequest = {
          title: 'Chapter with Invalid Course',
        };

        const response = await POST_ChapterHandler('invalid-course-id', chapterData);
        expect(response.status).toBe(400);
        
        const responseData = await response.json!();
        expect(responseData.error?.code).toBe('INVALID_COURSE');
      });

      it('should handle position conflicts', async () => {
        dbMocks.chapter.create.mockRejectedValue(
          new Error('Unique constraint failed')
        );

        const chapterData: CreateChapterRequest = {
          title: 'Conflicting Position Chapter',
          position: 1,
        };

        const response = await POST_ChapterHandler(testCourse.id, chapterData);
        expect(response.status).toBe(409);
        
        const responseData = await response.json!();
        expect(responseData.error?.code).toBe('DUPLICATE_POSITION');
      });
    });
  });

  describe('GET /api/courses/[courseId]/chapters - Chapter Listing', () => {
    const testChapters: ChapterWithRelations[] = [
      {
        ...testDataGenerator.chapter({
          id: 'chapter-1',
          title: 'Introduction',
          position: 1,
          isPublished: true,
          courseId: testCourse.id,
        }),
        course: testCourse,
        sections: [],
        _count: { sections: 0 },
      },
      {
        ...testDataGenerator.chapter({
          id: 'chapter-2',
          title: 'Advanced Topics',
          position: 2,
          isPublished: false,
          courseId: testCourse.id,
        }),
        course: testCourse,
        sections: [],
        _count: { sections: 0 },
      },
    ];

    describe('Course Access Control', () => {
      it('should return 404 for non-existent courses', async () => {
        dbMocks.course.findUnique.mockResolvedValue(null);

        const response = await GET_ChaptersHandler('non-existent-course');
        expect(response.status).toBe(404);
      });

      it('should show all chapters to course owner', async () => {
        authMock.mockRegularUser(instructorUser);
        
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
        dbMocks.chapter.findMany.mockResolvedValue(testChapters);

        const response = await GET_ChaptersHandler(testCourse.id);
        expect(response.status).toBe(200);
        
        const responseData = await response.json!();
        expect(responseData.data).toHaveLength(2); // Both published and unpublished
      });

      it('should show only published chapters to non-owners', async () => {
        authMock.mockRegularUser(studentUser);
        
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
        
        const publishedChapters = testChapters.filter(c => c.isPublished);
        dbMocks.chapter.findMany.mockResolvedValue(publishedChapters);

        const response = await GET_ChaptersHandler(testCourse.id);
        expect(response.status).toBe(200);
        
        const responseData = await response.json!();
        expect(responseData.data).toHaveLength(1); // Only published chapter
        
        // Verify query filter was applied
        expect(dbMocks.chapter.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              isPublished: true,
            }),
          })
        );
      });

      it('should show all chapters to admins', async () => {
        authMock.mockAdmin(adminUser);
        
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
        dbMocks.chapter.findMany.mockResolvedValue(testChapters);

        const response = await GET_ChaptersHandler(testCourse.id);
        expect(response.status).toBe(200);
        
        const responseData = await response.json!();
        expect(responseData.data).toHaveLength(2); // Admin sees all chapters
      });
    });

    describe('Chapter Data Structure', () => {
      beforeEach(() => {
        authMock.mockRegularUser(instructorUser);
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
      });

      it('should return chapters with proper relationships', async () => {
        dbMocks.chapter.findMany.mockResolvedValue(testChapters);

        const response = await GET_ChaptersHandler(testCourse.id);
        expect(response.status).toBe(200);
        
        const responseData = await response.json!();
        const chapter = responseData.data[0];
        
        expect(chapter).toMatchObject({
          id: expect.any(String),
          title: expect.any(String),
          position: expect.any(Number),
          course: {
            id: testCourse.id,
            title: testCourse.title,
            userId: testCourse.userId,
          },
          sections: expect.any(Array),
          _count: {
            sections: expect.any(Number),
          },
        });
      });

      it('should order chapters by position', async () => {
        dbMocks.chapter.findMany.mockResolvedValue(testChapters);

        const response = await GET_ChaptersHandler(testCourse.id);
        expect(response.status).toBe(200);
        
        expect(dbMocks.chapter.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { position: 'asc' },
          })
        );
      });
    });

    describe('Section Visibility', () => {
      it('should show all sections to course owner', async () => {
        authMock.mockRegularUser(instructorUser);
        
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
        dbMocks.chapter.findMany.mockResolvedValue(testChapters);

        const response = await GET_ChaptersHandler(testCourse.id);
        expect(response.status).toBe(200);
        
        // Verify sections query includes all sections for owner
        expect(dbMocks.chapter.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            include: expect.objectContaining({
              sections: expect.objectContaining({
                where: {}, // Empty where clause for owner
              }),
            }),
          })
        );
      });

      it('should show only published sections to non-owners', async () => {
        authMock.mockRegularUser(studentUser);
        
        dbMocks.course.findUnique.mockResolvedValue(testCourse);
        dbMocks.chapter.findMany.mockResolvedValue([testChapters[0]]); // Only published chapter

        const response = await GET_ChaptersHandler(testCourse.id);
        expect(response.status).toBe(200);
        
        // Verify sections query filters for published sections
        expect(dbMocks.chapter.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            include: expect.objectContaining({
              sections: expect.objectContaining({
                where: { isPublished: true },
              }),
            }),
          })
        );
      });
    });
  });

  describe('PATCH /api/courses/[courseId]/chapters/[chapterId] - Chapter Updates', () => {
    const testChapter: ChapterWithRelations = {
      ...testDataGenerator.chapter({
        id: 'chapter-1',
        title: 'Original Chapter',
        courseId: testCourse.id,
      }),
      course: testCourse,
      sections: [],
      _count: { sections: 0 },
    };

    describe('Authorization', () => {
      it('should reject unauthorized users', async () => {
        authMock.mockUnauthenticated();

        const updateData: UpdateChapterRequest = {
          title: 'Updated Title',
        };

        const response = await PATCH_ChapterHandler(testCourse.id, 'chapter-1', updateData);
        expect(response.status).toBe(401);
      });

      it('should reject non-owners', async () => {
        authMock.mockRegularUser(studentUser);
        
        dbMocks.chapter.findUnique.mockResolvedValue(testChapter);

        const updateData: UpdateChapterRequest = {
          title: 'Updated Title',
        };

        const response = await PATCH_ChapterHandler(testCourse.id, 'chapter-1', updateData);
        expect(response.status).toBe(403);
      });

      it('should allow owners to update chapters', async () => {
        authMock.mockRegularUser(instructorUser);
        
        dbMocks.chapter.findUnique.mockResolvedValue(testChapter);
        
        const updatedChapter = {
          ...testChapter,
          title: 'Updated Chapter Title',
          updatedAt: new Date(),
        };
        
        dbMocks.chapter.update.mockResolvedValue(updatedChapter);

        const updateData: UpdateChapterRequest = {
          title: 'Updated Chapter Title',
        };

        const response = await PATCH_ChapterHandler(testCourse.id, testChapter.id, updateData);
        expect(response.status).toBe(200);
        
        const responseData = await response.json!();
        expect(responseData.success).toBe(true);
        expect(responseData.data.title).toBe('Updated Chapter Title');
      });
    });

    describe('Chapter Validation', () => {
      beforeEach(() => {
        authMock.mockRegularUser(instructorUser);
      });

      it('should return 404 for non-existent chapters', async () => {
        dbMocks.chapter.findUnique.mockResolvedValue(null);

        const updateData: UpdateChapterRequest = {
          title: 'Updated Title',
        };

        const response = await PATCH_ChapterHandler(testCourse.id, 'non-existent', updateData);
        expect(response.status).toBe(404);
      });

      it('should validate chapter belongs to course', async () => {
        const wrongCourseChapter = {
          ...testChapter,
          courseId: 'different-course',
        };
        
        dbMocks.chapter.findUnique.mockResolvedValue(wrongCourseChapter);

        const updateData: UpdateChapterRequest = {
          title: 'Updated Title',
        };

        const response = await PATCH_ChapterHandler(testCourse.id, testChapter.id, updateData);
        expect(response.status).toBe(400);
        
        const responseData = await response.json!();
        expect(responseData.error?.code).toBe('INVALID_CHAPTER_COURSE');
      });
    });

    describe('Field Updates', () => {
      beforeEach(() => {
        authMock.mockRegularUser(instructorUser);
        dbMocks.chapter.findUnique.mockResolvedValue(testChapter);
      });

      it('should update only provided fields', async () => {
        const updatedChapter = {
          ...testChapter,
          title: 'New Title',
          isPublished: true,
        };
        
        dbMocks.chapter.update.mockResolvedValue(updatedChapter);

        const updateData: UpdateChapterRequest = {
          title: 'New Title',
          isPublished: true,
          // Other fields not provided
        };

        const response = await PATCH_ChapterHandler(testCourse.id, testChapter.id, updateData);
        expect(response.status).toBe(200);
        
        expect(dbMocks.chapter.update).toHaveBeenCalledWith({
          where: { id: testChapter.id },
          data: {
            title: 'New Title',
            isPublished: true,
            updatedAt: expect.any(Date),
          },
          include: expect.any(Object),
        });
      });

      it('should validate empty title', async () => {
        const updateData: UpdateChapterRequest = {
          title: '', // Empty title
        };

        const response = await PATCH_ChapterHandler(testCourse.id, testChapter.id, updateData);
        expect(response.status).toBe(400);
        
        const responseData = await response.json!();
        expect(responseData.error?.message).toBe('Chapter title cannot be empty');
      });

      it('should handle all updatable fields', async () => {
        const completeUpdate = {
          ...testChapter,
          title: 'Complete Update',
          description: 'Updated description',
          position: 5,
          isPublished: true,
          isFree: true,
          courseGoals: 'Updated goals',
          learningOutcomes: 'Updated outcomes',
          estimatedTime: '3 hours',
          difficulty: 'Advanced',
          prerequisites: 'Updated prerequisites',
          resources: 'Updated resources',
        };
        
        dbMocks.chapter.update.mockResolvedValue(completeUpdate);

        const updateData: UpdateChapterRequest = {
          title: 'Complete Update',
          description: 'Updated description',
          position: 5,
          isPublished: true,
          isFree: true,
          courseGoals: 'Updated goals',
          learningOutcomes: 'Updated outcomes',
          estimatedTime: '3 hours',
          difficulty: 'Advanced',
          prerequisites: 'Updated prerequisites',
          resources: 'Updated resources',
        };

        const response = await PATCH_ChapterHandler(testCourse.id, testChapter.id, updateData);
        expect(response.status).toBe(200);
        
        const responseData = await response.json!();
        expect(responseData.data).toMatchObject(updateData);
      });
    });
  });

  describe('DELETE /api/courses/[courseId]/chapters/[chapterId] - Chapter Deletion', () => {
    const emptyChapter: ChapterWithRelations = {
      ...testDataGenerator.chapter({
        id: 'empty-chapter',
        courseId: testCourse.id,
      }),
      course: testCourse,
      sections: [],
      _count: { sections: 0 },
    };

    const chapterWithSections: ChapterWithRelations = {
      ...testDataGenerator.chapter({
        id: 'chapter-with-sections',
        courseId: testCourse.id,
      }),
      course: testCourse,
      sections: [
        {
          id: 'section-1',
          title: 'Test Section',
          position: 1,
          isPublished: true,
          isFree: false,
          duration: 300,
        },
      ],
      _count: { sections: 1 },
    };

    describe('Authorization', () => {
      it('should require authentication', async () => {
        authMock.mockUnauthenticated();

        const response = await DELETE_ChapterHandler(testCourse.id, 'chapter-1');
        expect(response.status).toBe(401);
      });

      it('should allow owners to delete chapters', async () => {
        authMock.mockRegularUser(instructorUser);
        
        dbMocks.chapter.findUnique.mockResolvedValue(emptyChapter);
        dbMocks.chapter.delete.mockResolvedValue(emptyChapter);

        const response = await DELETE_ChapterHandler(testCourse.id, emptyChapter.id);
        expect(response.status).toBe(200);
        
        const responseData = await response.json!();
        expect(responseData.success).toBe(true);
        expect(responseData.data.message).toBe('Chapter deleted successfully');
      });

      it('should allow admins to delete chapters', async () => {
        authMock.mockAdmin(adminUser);
        
        dbMocks.chapter.findUnique.mockResolvedValue(emptyChapter);
        dbMocks.chapter.delete.mockResolvedValue(emptyChapter);

        const response = await DELETE_ChapterHandler(testCourse.id, emptyChapter.id);
        expect(response.status).toBe(200);
      });
    });

    describe('Chapter Protection', () => {
      beforeEach(() => {
        authMock.mockRegularUser(instructorUser);
      });

      it('should prevent deletion of chapters with sections', async () => {
        dbMocks.chapter.findUnique.mockResolvedValue(chapterWithSections);

        const response = await DELETE_ChapterHandler(testCourse.id, chapterWithSections.id);
        expect(response.status).toBe(400);
        
        const responseData = await response.json!();
        expect(responseData.error?.code).toBe('CHAPTER_HAS_SECTIONS');
        expect(responseData.error?.message).toContain('Delete sections first');
        expect(dbMocks.chapter.delete).not.toHaveBeenCalled();
      });

      it('should allow deletion of empty chapters', async () => {
        dbMocks.chapter.findUnique.mockResolvedValue(emptyChapter);
        dbMocks.chapter.delete.mockResolvedValue(emptyChapter);

        const response = await DELETE_ChapterHandler(testCourse.id, emptyChapter.id);
        expect(response.status).toBe(200);
        
        expect(dbMocks.chapter.delete).toHaveBeenCalledWith({
          where: { id: emptyChapter.id },
        });
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        authMock.mockRegularUser(instructorUser);
      });

      it('should return 404 for non-existent chapters', async () => {
        dbMocks.chapter.findUnique.mockResolvedValue(null);

        const response = await DELETE_ChapterHandler(testCourse.id, 'non-existent');
        expect(response.status).toBe(404);
      });

      it('should validate chapter belongs to course', async () => {
        const wrongCourseChapter = {
          ...emptyChapter,
          courseId: 'different-course',
        };
        
        dbMocks.chapter.findUnique.mockResolvedValue(wrongCourseChapter);

        const response = await DELETE_ChapterHandler(testCourse.id, emptyChapter.id);
        expect(response.status).toBe(400);
        
        const responseData = await response.json!();
        expect(responseData.error?.code).toBe('INVALID_CHAPTER_COURSE');
      });
    });
  });
});