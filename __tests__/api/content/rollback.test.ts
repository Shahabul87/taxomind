jest.mock('@/lib/api-protection', () => ({
  withAuth: jest.fn((handler: (...args: any[]) => Promise<Response>) => {
    return async (...args: any[]) => handler(...args);
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/content-versioning', () => ({
  ContentVersioningService: {
    rollbackToVersion: jest.fn(),
  },
}));

import { POST } from '@/app/api/content/rollback/route';
import { ContentVersioningService } from '@/lib/content-versioning';
import { NextRequest } from 'next/server';

const mockRollback = ContentVersioningService.rollbackToVersion as jest.Mock;

describe('/api/content/rollback route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRollback.mockResolvedValue({ id: 'v2', contentId: 'c1' });
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/rollback', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'post' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rolls back to target version successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/rollback', {
      method: 'POST',
      body: JSON.stringify({
        contentType: 'post',
        contentId: 'c1',
        targetVersionId: 'v2',
        reason: 'rollback',
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.version.id).toBe('v2');
    expect(mockRollback).toHaveBeenCalledWith('post', 'c1', 'v2', 'rollback');
  });

  it('returns 500 when rollback service throws', async () => {
    mockRollback.mockRejectedValueOnce(new Error('rollback failed'));
    const req = new NextRequest('http://localhost:3000/api/content/rollback', {
      method: 'POST',
      body: JSON.stringify({
        contentType: 'post',
        contentId: 'c1',
        targetVersionId: 'v2',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
