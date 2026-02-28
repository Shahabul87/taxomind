jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/templates/analytics/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET /api/templates/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.adminAccount = {
      findUnique: jest.fn().mockResolvedValue(null),
    };
    mockDb.aIContentTemplate = {
      findMany: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 'tpl-1',
            name: 'Template 1',
            usageCount: 5,
            createdAt: new Date('2026-01-01T00:00:00Z'),
            templateType: 'ARTICLE',
            category: 'Writing',
            User: { id: 'user-1', name: 'U', email: 'u@test.com' },
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'tpl-1',
            name: 'Template 1',
            createdAt: new Date('2026-01-01T00:00:00Z'),
            updatedAt: new Date('2026-01-01T00:00:00Z'),
            usageCount: 5,
            User: { id: 'user-1', name: 'U', email: 'u@test.com' },
          },
        ]),
      count: jest.fn().mockResolvedValue(1),
      groupBy: jest
        .fn()
        .mockResolvedValueOnce([
          { templateType: 'ARTICLE', _count: { id: 1 }, _sum: { usageCount: 5 } },
        ])
        .mockResolvedValueOnce([
          { category: 'Writing', _count: { id: 1 }, _sum: { usageCount: 5 } },
        ]),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/templates/analytics'));
    expect(res.status).toBe(401);
  });

  it('returns analytics overview and usage breakdown', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/templates/analytics?period=30d')
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overview.totalTemplates).toBe(1);
    expect(body.overview.totalUsage).toBe(5);
    expect(body.usageByType[0].templateCount).toBe(1);
    expect(body.usageByCategory[0].category).toBe('Writing');
    expect(body.recentActivity).toHaveLength(1);
  });
});
