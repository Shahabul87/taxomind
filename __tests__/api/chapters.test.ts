import { NextResponse } from 'next/server';
import { PATCH, DELETE } from '@/app/api/courses/[courseId]/chapters/[chapterId]/route';
import { PATCH as POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/publish/route';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    course: {
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
    muxData: {
      delete: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/mux', () => ({
  video: {
    assets: {
      delete: jest.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

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
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.update as jest.Mock).mockResolvedValue({
        id: chapterId,
        ...updateData,
      });

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(updateData);
      expect(db.chapter.update).toHaveBeenCalledWith({
        where: {
          id: chapterId,
          courseId,
        },
        data: {
          ...updateData,
        },
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(401);
      expect(db.chapter.update).not.toHaveBeenCalled();
    });

    it('returns 401 when user does not own the course', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'different-user' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId: 'original-owner',
      });

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(401);
      expect(db.chapter.update).not.toHaveBeenCalled();
    });

    it('handles database errors gracefully', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PATCH(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /api/courses/[courseId]/chapters/[chapterId]', () => {
    it('deletes chapter successfully when user owns course', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: chapterId,
        courseId,
        videoUrl: null,
      });
      (db.chapter.delete as jest.Mock).mockResolvedValue({ id: chapterId });
      (db.chapter.findMany as jest.Mock).mockResolvedValue([
        { id: 'other-chapter-1', isPublished: true },
        { id: 'other-chapter-2', isPublished: true },
      ]);

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(200);
      expect(db.chapter.delete).toHaveBeenCalledWith({
        where: {
          id: chapterId,
          courseId,
        },
      });
    });

    it('unpublishes course when deleting last published chapter', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: chapterId,
        courseId,
        videoUrl: null,
      });
      (db.chapter.delete as jest.Mock).mockResolvedValue({ id: chapterId });
      (db.chapter.findMany as jest.Mock).mockResolvedValue([]); // No other published chapters

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(200);
      expect(db.course.update).toHaveBeenCalledWith({
        where: {
          id: courseId,
        },
        data: {
          isPublished: false,
        },
      });
    });

    it('returns 401 when user is not authenticated', async () => {
      (currentUser as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(401);
      expect(db.chapter.delete).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/courses/[courseId]/chapters/[chapterId]/publish', () => {
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
        videoUrl: 'https://example.com/video.mp4',
      });
      (db.section.findMany as jest.Mock).mockResolvedValue([
        { id: 'section-1', isPublished: true },
      ]);
      (db.chapter.update as jest.Mock).mockResolvedValue({
        id: chapterId,
        isPublished: true,
      });

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456/publish', {
        method: 'POST',
      });

      const response = await POST(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(200);
      expect(db.chapter.update).toHaveBeenCalledWith({
        where: {
          id: chapterId,
          courseId,
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
        videoUrl: 'https://example.com/video.mp4',
      });

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456/publish', {
        method: 'POST',
      });

      const response = await POST(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(400);
      expect(db.chapter.update).not.toHaveBeenCalled();
    });

    it('returns 400 when chapter has no published sections', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: userId });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId,
      });
      (db.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: chapterId,
        title: 'Chapter Title',
        description: 'Chapter Description',
        videoUrl: 'https://example.com/video.mp4',
      });
      (db.section.findMany as jest.Mock).mockResolvedValue([]); // No published sections

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456/publish', {
        method: 'POST',
      });

      const response = await POST(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(400);
      expect(db.chapter.update).not.toHaveBeenCalled();
    });

    it('returns 401 when user does not own the course', async () => {
      (currentUser as jest.Mock).mockResolvedValue({ id: 'different-user' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: courseId,
        userId: 'original-owner',
      });

      const request = new Request('http://localhost:3000/api/courses/course-123/chapters/chapter-456/publish', {
        method: 'POST',
      });

      const response = await POST(request, { params: { courseId, chapterId } });

      expect(response.status).toBe(401);
      expect(db.chapter.update).not.toHaveBeenCalled();
    });
  });
});