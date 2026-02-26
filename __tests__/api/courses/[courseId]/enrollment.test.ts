// Must mock server-only before imports that use @/lib/stripe
jest.mock('server-only', () => ({}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: jest.fn(),
      },
    },
  },
}));

import { GET } from '@/app/api/courses/[courseId]/enrollment/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function createRequest(courseId = 'course-1') {
  return new NextRequest(`http://localhost:3000/api/courses/${courseId}/enrollment`, {
    method: 'GET',
  });
}

describe('api/courses/[courseId]/enrollment route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(createRequest(), { params: Promise.resolve({ courseId: 'course-1' }) });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns enrollment when found', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue({
      id: 'enroll-1',
      userId: 'user-1',
      courseId: 'course-1',
      status: 'ACTIVE',
      Course: {
        title: 'Test Course',
      },
    });

    const res = await GET(createRequest('course-1'), { params: Promise.resolve({ courseId: 'course-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('enroll-1');
    expect(body.Course.title).toBe('Test Course');
  });
});
