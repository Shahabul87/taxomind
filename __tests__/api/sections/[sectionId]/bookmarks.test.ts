jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/sections/[sectionId]/bookmarks/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;
const params = { params: { sectionId: 'section-1' } };

describe('GET/POST/DELETE /api/sections/[sectionId]/bookmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.section = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'section-1',
        chapter: {
          course: {
            userId: 'teacher-1',
            Enrollment: [{ userId: 'user-1' }],
          },
        },
      }),
    };
    mockDb.videoBookmark = {
      create: jest.fn().mockResolvedValue({ id: 'b1', timestamp: 15 }),
      findMany: jest.fn().mockResolvedValue([{ id: 'b1', timestamp: 15 }]),
      findUnique: jest.fn().mockResolvedValue({ id: 'b1', userId: 'user-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'b1' }),
    };
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timestamp: 10 }),
      }),
      params
    );
    expect(res.status).toBe(401);
  });

  it('POST creates bookmark for enrolled user', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ timestamp: 10, note: 'important' }),
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.videoBookmark.create).toHaveBeenCalled();
  });

  it('GET returns user bookmarks for section', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.bookmarks).toHaveLength(1);
  });

  it('DELETE returns 400 when bookmarkId missing', async () => {
    const res = await DELETE(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(400);
  });
});
