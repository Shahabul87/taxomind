jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/sam/social-engine/groups/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

describe('/api/sam/social-engine/groups route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.group.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'g1',
        name: 'Group 1',
        description: 'Desc',
        imageUrl: null,
        courseId: 'c1',
        _count: { members: 5 },
      },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns mapped groups payload', async () => {
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].memberCount).toBe(5);
  });
});
