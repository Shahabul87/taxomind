/**
 * Tests for Course Progress Route - app/api/courses/[courseId]/progress/route.ts
 *
 * Covers: PUT and GET (both return 501 - not yet implemented)
 */

// @/lib/auth is globally mocked

import { PUT, GET } from '@/app/api/courses/[courseId]/progress/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';

const mockCurrentUser = currentUser as jest.Mock;

function createRequest(method: 'PUT' | 'GET' = 'GET') {
  return new NextRequest('http://localhost:3000/api/courses/course-1/progress', {
    method,
  });
}

function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

describe('PUT /api/courses/[courseId]/progress', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PUT(createRequest('PUT'), createParams());

    expect(res.status).toBe(401);
  });

  it('returns 501 (not implemented) for authenticated users', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    const res = await PUT(createRequest('PUT'), createParams());
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(body.error).toContain('not yet implemented');
  });
});

describe('GET /api/courses/[courseId]/progress', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createRequest('GET'), createParams());

    expect(res.status).toBe(401);
  });

  it('returns 501 (not implemented) for authenticated users', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    const res = await GET(createRequest('GET'), createParams());
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(body.error).toContain('not yet implemented');
  });
});
