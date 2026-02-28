jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/sections/[sectionId]/discussions/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;
const params = { params: Promise.resolve({ sectionId: 'section-1' }) };

describe('GET/POST /api/sections/[sectionId]/discussions', () => {
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
    mockDb.discussion = {
      findUnique: jest.fn().mockResolvedValue({ id: 'parent-1', sectionId: 'section-1' }),
      create: jest.fn().mockResolvedValue({
        id: 'd1',
        content: 'Hello',
        user: { id: 'user-1' },
        votes: [],
        _count: { replies: 0 },
      }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'd1',
          content: 'Hello',
          votes: [{ id: 'v1', userId: 'user-1', voteType: 'UPVOTE' }],
          replies: [],
          _count: { replies: 0 },
          user: { id: 'user-1', name: 'U' },
          isPinned: false,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]),
    };
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'hello' }),
      }),
      params
    );
    expect(res.status).toBe(401);
  });

  it('POST creates discussion for enrolled user', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'hello world' }),
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.discussion.id).toBe('d1');
  });

  it('GET returns discussions with score fields', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.discussions[0].score).toBe(1);
    expect(body.discussions[0].userVote).toBe('UPVOTE');
  });
});
