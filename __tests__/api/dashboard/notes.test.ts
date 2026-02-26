/**
 * Tests for Dashboard Notes Route - app/api/dashboard/notes/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/notes/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardNote) {
  (db as Record<string, unknown>).dashboardNote = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardNote;
  if (!model.count) model.count = jest.fn();
  if (!model.findMany) model.findMany = jest.fn();
  if (!model.create) model.create = jest.fn();
}

const mockNote = (db as Record<string, any>).dashboardNote;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/notes${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard notes route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockNote.count.mockResolvedValue(4);
    mockNote.findMany.mockResolvedValue([
      { id: 'n1', userId: 'user-1', title: 'Note A', content: 'content' },
    ]);
    mockNote.create.mockResolvedValue({
      id: 'n2',
      userId: 'user-1',
      title: 'Note B',
      content: 'new',
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated notes and supports filters', async () => {
    const res = await GET(getReq('page=1&limit=2&courseId=c1&activityId=a1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toEqual({ page: 1, limit: 2, total: 4 });
    expect(mockNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          courseId: 'c1',
          activityId: 'a1',
        }),
      })
    );
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ title: '', content: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates note for authenticated user', async () => {
    const res = await POST(postReq({
      title: 'Note B',
      content: 'new',
      tags: ['revision'],
      courseId: 'c1',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Note B',
          content: 'new',
        }),
      })
    );
  });

  it('GET returns 500 on unexpected db errors', async () => {
    mockNote.count.mockRejectedValue(new Error('db fail'));

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

