/**
 * Tests for Admin RAG Seed Route - app/api/admin/rag-seed/route.ts
 *
 * Covers: GET (index status), POST (seed courses for RAG)
 * Auth: Uses auth() from @/auth with role check
 */

jest.mock('@/lib/sam/course-creation/rag-indexer', () => ({
  indexCourseForRAG: jest.fn().mockResolvedValue(15),
}));

// Add missing model mock
import { db } from '@/lib/db';
if (!(db as Record<string, unknown>).sAMVectorEmbedding) {
  (db as Record<string, unknown>).sAMVectorEmbedding = {
    groupBy: jest.fn(() => Promise.resolve([])),
    findMany: jest.fn(() => Promise.resolve([])),
    count: jest.fn(() => Promise.resolve(0)),
  };
}

import { GET, POST } from '@/app/api/admin/rag-seed/route';
import { auth } from '@/auth';
import { indexCourseForRAG } from '@/lib/sam/course-creation/rag-indexer';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockIndexCourse = indexCourseForRAG as jest.Mock;

describe('GET /api/admin/rag-seed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns 403 for non-admin user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns index status for admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.course.count as jest.Mock).mockResolvedValue(10);
    ((db as Record<string, unknown>).sAMVectorEmbedding as { groupBy: jest.Mock }).groupBy
      .mockResolvedValue([]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.totalPublished).toBe(10);
    expect(data.data.indexedCourses).toBeDefined();
  });

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.course.count as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe('POST /api/admin/rag-seed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIndexCourse.mockResolvedValue(15);
  });

  it('returns 403 when not admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/admin/rag-seed', {
      method: 'POST',
      body: JSON.stringify({ mode: 'single', courseId: 'c1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('indexes single course', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      title: 'Test Course',
      isPublished: true,
    });

    const req = new NextRequest('http://localhost:3000/api/admin/rag-seed', {
      method: 'POST',
      body: JSON.stringify({ mode: 'single', courseId: 'c1' }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.mode).toBe('single');
    expect(data.data.chunksIndexed).toBe(15);
  });

  it('returns 404 when course not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/admin/rag-seed', {
      method: 'POST',
      body: JSON.stringify({ mode: 'single', courseId: 'nonexistent' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost:3000/api/admin/rag-seed', {
      method: 'POST',
      body: JSON.stringify({ mode: 'invalid' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('handles bulk indexing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.course.findMany as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Course 1' },
      { id: 'c2', title: 'Course 2' },
    ]);

    const req = new NextRequest('http://localhost:3000/api/admin/rag-seed', {
      method: 'POST',
      body: JSON.stringify({ mode: 'bulk', limit: 10 }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.mode).toBe('bulk');
    expect(data.data.coursesProcessed).toBe(2);
    expect(data.data.totalChunksIndexed).toBe(30);
  });
});
