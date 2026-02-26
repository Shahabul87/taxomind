jest.mock('@/auth.admin', () => ({ adminAuth: jest.fn() }));

import { GET } from '@/app/api/admin/notifications/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';

const mockAdminAuth = adminAuth as jest.Mock;

describe('/api/admin/notifications route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    (db.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1', email: 'u@test.com', name: 'User', createdAt: new Date() }]);
    (db.course.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', title: 'Course', createdAt: new Date(), isPublished: true }]);
    (db.post.findMany as jest.Mock).mockResolvedValue([{ id: 'p1', title: 'Post', createdAt: new Date(), published: false }]);
    (db.enrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'e1', createdAt: new Date(), courseId: 'c1', Course: { title: 'Course' } }]);
  });

  it('returns 401 for unauthorized access', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns formatted notifications', async () => {
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
