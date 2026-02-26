jest.mock('@/auth.admin', () => ({ adminAuth: jest.fn() }));

import { GET } from '@/app/api/admin/dashboard/activity/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

describe('/api/admin/dashboard/activity route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1', email: 'u1@test.com', name: 'U1', createdAt: new Date() }]);
    (db.course.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', title: 'Course 1', updatedAt: new Date() }]);
    (db.post.findMany as jest.Mock).mockResolvedValue([{ id: 'p1', title: 'Post 1', createdAt: new Date(), published: false }]);
    (db.enrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'e1', createdAt: new Date(), courseId: 'c1', Course: { title: 'Course 1' } }]);
  });

  it('returns 401 for unauthorized user', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns recent activity list', async () => {
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
