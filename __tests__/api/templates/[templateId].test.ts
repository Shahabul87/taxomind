jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/templates/[templateId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

const params = { params: Promise.resolve({ templateId: 'tpl-1' }) };

function template(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tpl-1',
    creatorId: 'user-1',
    isPublic: false,
    ...overrides,
  };
}

describe('GET/PUT/DELETE /api/templates/[templateId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.adminAccount = {
      findUnique: jest.fn().mockResolvedValue(null),
    };
    mockDb.aIContentTemplate = {
      findUnique: jest.fn().mockResolvedValue(template()),
      update: jest.fn().mockResolvedValue({ id: 'tpl-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'tpl-1' }),
    };
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 403 when non-owner accesses private template', async () => {
    mockDb.aIContentTemplate.findUnique.mockResolvedValueOnce(
      template({ creatorId: 'other-user', isPublic: false })
    );

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(403);
  });

  it('PUT updates template for owner', async () => {
    const res = await PUT(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Template' }),
      }),
      params
    );

    expect(res.status).toBe(200);
    expect(mockDb.aIContentTemplate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tpl-1' },
      })
    );
  });

  it('DELETE removes template for owner', async () => {
    const res = await DELETE(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('deleted');
    expect(mockDb.aIContentTemplate.delete).toHaveBeenCalledWith({
      where: { id: 'tpl-1' },
    });
  });
});
