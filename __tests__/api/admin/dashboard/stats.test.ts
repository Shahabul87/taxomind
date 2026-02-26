jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

import { GET } from '@/app/api/admin/dashboard/stats/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

describe('api/admin/dashboard/stats route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    if (!(db as any).activeSession) {
      (db as any).activeSession = { count: jest.fn() };
    }

    (db.user.count as jest.Mock).mockResolvedValue(500);
    (db.course.count as jest.Mock).mockResolvedValue(50);
    (db.post.count as jest.Mock).mockResolvedValue(10);
    ((db as any).activeSession.count as jest.Mock).mockResolvedValue(5);
  });

  it('returns 401 when admin auth fails', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns dashboard stats payload', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalUsers).toBeDefined();
    expect(body.data.totalCourses).toBeDefined();
    expect(body.metadata.version).toBe('1.0.0');
  });
});
