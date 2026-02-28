jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/templates/categories/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET /api/templates/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.aIContentTemplate = {
      groupBy: jest
        .fn()
        .mockResolvedValueOnce([{ category: 'Writing', _count: { id: 2 } }])
        .mockResolvedValueOnce([{ templateType: 'ARTICLE', _count: { id: 2 } }]),
      findMany: jest.fn().mockResolvedValue([
        { templateType: 'ARTICLE', tags: ['a', 'b'] },
        { templateType: 'ARTICLE', tags: ['a'] },
      ]),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/templates/categories'));
    expect(res.status).toBe(401);
  });

  it('returns categories, content types, and popular tags', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/templates/categories'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.categories[0]).toEqual({ name: 'Writing', count: 2 });
    expect(body.contentTypes[0].count).toBe(2);
    expect(body.popularTags[0]).toEqual({ tag: 'a', count: 2 });
  });
});
