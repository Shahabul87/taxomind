jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/utils/sam-database', () => ({
  awardSAMPoints: jest.fn(),
}));

import { POST } from '@/app/api/sam/points/route';
import { auth } from '@/auth';
import { awardSAMPoints } from '@/lib/sam/utils/sam-database';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockAwardSAMPoints = awardSAMPoints as jest.Mock;

describe('/api/sam/points route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockAwardSAMPoints.mockResolvedValue({ totalPoints: 150 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/points', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/points', {
      method: 'POST',
      body: JSON.stringify({ points: 10 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('awards points successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/points', {
      method: 'POST',
      body: JSON.stringify({
        points: 20,
        reason: 'quiz completed',
        source: 'QUIZ',
        courseId: 'c1',
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalPoints).toBe(150);
    expect(mockAwardSAMPoints).toHaveBeenCalledWith('user-1', {
      points: 20,
      reason: 'quiz completed',
      source: 'QUIZ',
      courseId: 'c1',
      chapterId: undefined,
      sectionId: undefined,
    });
  });
});
