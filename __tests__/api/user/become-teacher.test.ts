import { POST } from '@/app/api/user/become-teacher/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/user/become-teacher route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ isTeacher: false });
    (db.user.update as jest.Mock).mockResolvedValue({
      isTeacher: true,
      teacherActivatedAt: '2026-02-26T00:00:00.000Z',
    });
  });

  it('returns 401 for unauthenticated user', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns 400 when user is already teacher', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce({ isTeacher: true });
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it('upgrades user to teacher', async () => {
    const res = await POST();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isTeacher).toBe(true);
  });
});
