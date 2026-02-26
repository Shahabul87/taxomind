import { POST } from '@/app/api/adaptive-assessment/analyze/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/adaptive-assessment/analyze route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.userExamAttempt.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/adaptive-assessment/analyze', {
      method: 'POST',
      body: JSON.stringify({ sectionId: 'section-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when sectionId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/adaptive-assessment/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns starter recommendation when no attempts exist', async () => {
    const req = new NextRequest('http://localhost:3000/api/adaptive-assessment/analyze', {
      method: 'POST',
      body: JSON.stringify({ sectionId: 'section-1' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.analysis.overallPerformance.totalAttempts).toBe(0);
    expect(body.analysis.recommendations[0].type).toBe('practice');
  });

  it('returns 500 on database failure', async () => {
    (db.userExamAttempt.findMany as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const req = new NextRequest('http://localhost:3000/api/adaptive-assessment/analyze', {
      method: 'POST',
      body: JSON.stringify({ sectionId: 'section-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
