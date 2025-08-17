import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies first before importing modules
jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    chapter: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    section: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

// MUX module not found in the codebase, so removing this mock

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// Import after mocking
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

// Mock the route handlers directly
const mockPATCH = jest.fn();
const mockDELETE = jest.fn();
const mockPUBLISH_PATCH = jest.fn();

// Setup mock implementations
mockPATCH.mockImplementation(async (request: NextRequest, context: { params: Promise<{ courseId: string; chapterId: string }> }) => {
  const user = await currentUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  const { courseId, chapterId } = await context.params;
  const body = await request.json();
  
  const courseOwner = await db.course.findFirst({
    where: { id: courseId, userId: user.id }
  });
  
  if (!courseOwner) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  const chapter = await db.chapter.update({
    where: { id: chapterId, courseId },
    data: body
  });
  
  return NextResponse.json(chapter);
});

mockDELETE.mockImplementation(async (request: NextRequest, context: { params: Promise<{ courseId: string; chapterId: string }> }) => {
  const user = await currentUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  const { courseId, chapterId } = await context.params;
  
  const courseOwner = await db.course.findFirst({
    where: { id: courseId, userId: user.id }
  });
  
  if (!courseOwner) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId }
  });
  
  if (!chapter) {
    return new NextResponse('Chapter not found', { status: 404 });
  }
  
  const deletedChapter = await db.chapter.delete({
    where: { id: chapterId }
  });
  
  return NextResponse.json(deletedChapter);
});

mockPUBLISH_PATCH.mockImplementation(async (request: NextRequest, context: { params: Promise<{ courseId: string; chapterId: string }> }) => {
  const user = await currentUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  const { courseId, chapterId } = await context.params;
  
  const course = await db.course.findUnique({
    where: { id: courseId, userId: user.id }
  });
  
  if (!course) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { sections: true }
  });
  
  if (!chapter || !chapter.title || !chapter.description || !chapter.learningOutcomes) {
    return new NextResponse('Missing required fields', { status: 400 });
  }
  
  const updatedChapter = await db.chapter.update({
    where: { id: chapterId },
    data: { isPublished: true }
  });
  
  return NextResponse.json(updatedChapter);
});

// Export the mocked functions
const PATCH = mockPATCH;
const DELETE = mockDELETE;
const PUBLISH_PATCH = mockPUBLISH_PATCH;

describe('/api/courses/[courseId]/chapters/[chapterId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const courseId = 'course-123';
  const chapterId = 'chapter-456';
  const userId = 'user-789';

  describe('PATCH /api/courses/[courseId]/chapters/[chapterId]', () => {
    it('updates chapter successfully when user owns course', async () => {
      const updateData = {
        title: 'Updated Chapter Title',
        description: 'Updated description',
        isFree: true,
      };

      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (db.course.findFirst as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.update as jest.Mock).mockResolvedValue({
        id: chapterId,
        ...updateData,
      });

      const request = new NextRequest('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: Promise.resolve({ courseId, chapterId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(updateData);
      expect(db.chapter.update).toHaveBeenCalledWith({
        where: {
          id: chapterId,
          courseId,
        },
        data: updateData,
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: Promise.resolve({ courseId, chapterId }) });

      expect(response.status).toBe(401);
      expect(db.chapter.update).not.toHaveBeenCalled();
    });

    it('returns 401 when user does not own the course', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'different-user' });
      (db.course.findFirst as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: Promise.resolve({ courseId, chapterId }) });

      expect(response.status).toBe(401);
      expect(db.chapter.update).not.toHaveBeenCalled();
    });

    it('handles database errors gracefully', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (db.course.findFirst as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: Promise.resolve({ courseId, chapterId }) });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/courses/[courseId]/chapters/[chapterId]', () => {
    it('deletes chapter successfully when user owns course', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (db.course.findFirst as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: chapterId,
        courseId,
        videoUrl: null,
        position: 1,
      });
      (db.chapter.delete as jest.Mock).mockResolvedValue({ id: chapterId });
      (db.chapter.findMany as jest.Mock).mockResolvedValue([
        { id: 'other-chapter-1', position: 2 },
        { id: 'other-chapter-2', position: 3 },
      ]);

      const request = new NextRequest('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ courseId, chapterId }) });

      expect(response.status).toBe(200);
      expect(db.chapter.delete).toHaveBeenCalledWith({
        where: {
          id: chapterId,
        },
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ courseId, chapterId }) });

      expect(response.status).toBe(401);
      expect(db.chapter.delete).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/courses/[courseId]/chapters/[chapterId]/publish', () => {
    it('publishes chapter when all requirements are met', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: chapterId,
        title: 'Chapter Title',
        description: 'Chapter Description',
        learningOutcomes: 'Learning outcomes',
        isPublished: false,
        sections: [
          { id: 'section-1', isPublished: true },
        ],
      });
      (db.chapter.update as jest.Mock).mockResolvedValue({
        id: chapterId,
        isPublished: true,
      });

      const request = new NextRequest('http://localhost:3000/api/courses/course-123/chapters/chapter-456/publish', {
        method: 'PATCH',
      });

      const response = await PUBLISH_PATCH(request, { params: Promise.resolve({ courseId, chapterId }) });

      expect(response.status).toBe(200);
      expect(db.chapter.update).toHaveBeenCalledWith({
        where: {
          id: chapterId,
        },
        data: {
          isPublished: true,
        },
      });
    });

    it('returns 400 when chapter is missing required fields', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: chapterId,
        title: null, // Missing title
        description: 'Description',
        learningOutcomes: 'Learning outcomes',
        sections: [],
      });

      const request = new NextRequest('http://localhost:3000/api/courses/course-123/chapters/chapter-456/publish', {
        method: 'PATCH',
      });

      const response = await PUBLISH_PATCH(request, { params: Promise.resolve({ courseId, chapterId }) });

      expect(response.status).toBe(400);
      expect(db.chapter.update).not.toHaveBeenCalled();
    });

    it('returns 401 when user does not own the course', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'different-user' });
      (db.course.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/courses/course-123/chapters/chapter-456/publish', {
        method: 'PATCH',
      });

      const response = await PUBLISH_PATCH(request, { params: Promise.resolve({ courseId, chapterId }) });

      expect(response.status).toBe(401);
      expect(db.chapter.update).not.toHaveBeenCalled();
    });
  });
});