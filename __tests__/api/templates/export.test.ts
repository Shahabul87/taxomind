jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/templates/export/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET /api/templates/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'User', email: 'u@test.com' });
    mockDb.adminAccount = {
      findUnique: jest.fn().mockResolvedValue(null),
    };
    mockDb.aIContentTemplate = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'tpl-1',
          name: 'Template 1',
          description: 'desc',
          contentType: 'ARTICLE',
          category: 'cat',
          templateData: '{"a":1}',
          tags: ['a'],
          isPublic: true,
          isOfficial: false,
          usageCount: 2,
          author: { name: 'User', email: 'u@test.com' },
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
          User: { id: 'user-1', name: 'User', email: 'u@test.com' },
        },
      ]),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/templates/export'));
    expect(res.status).toBe(401);
  });

  it('returns JSON export package by default', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/templates/export'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalTemplates).toBe(1);
    expect(body.templates[0].id).toBe('tpl-1');
    expect(mockDb.aIContentTemplate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [{ authorId: 'user-1' }, { isPublic: true }],
        }),
      })
    );
  });

  it('returns CSV when format=csv', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/templates/export?format=csv')
    );
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toContain('"ID","Name","Description"');
    expect(text).toContain('"tpl-1","Template 1"');
  });
});
