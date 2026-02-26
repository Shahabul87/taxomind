import { GET } from '@/app/api/courses/[courseId]/questions/sse/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/courses/[courseId]/questions/sse route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/courses/c1/questions/sse');
    const res = await GET(req, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(401);
  });
});
