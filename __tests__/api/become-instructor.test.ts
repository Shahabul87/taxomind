import { POST } from '@/app/api/become-instructor/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/become-instructor route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ isTeacher: false });
    (db.user.update as jest.Mock).mockResolvedValue({ id: 'user-1', isTeacher: true });
    (db.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });
  });

  it('returns 401 for unauthenticated user', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/become-instructor', {
      method: 'POST',
      body: JSON.stringify({ expertise: 'TS', experience: '5 years' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when already instructor', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce({ isTeacher: true });

    const req = new NextRequest('http://localhost:3000/api/become-instructor', {
      method: 'POST',
      body: JSON.stringify({ expertise: 'TS', experience: '5 years' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 on schema validation failure', async () => {
    const req = new NextRequest('http://localhost:3000/api/become-instructor', {
      method: 'POST',
      body: JSON.stringify({ expertise: '', experience: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('promotes user to instructor and writes audit log', async () => {
    const req = new NextRequest('http://localhost:3000/api/become-instructor', {
      method: 'POST',
      body: JSON.stringify({
        expertise: 'TypeScript and architecture',
        experience: '5 years building production systems',
        linkedIn: 'https://www.linkedin.com/in/example',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.isTeacher).toBe(true);
    expect(db.auditLog.create).toHaveBeenCalled();
  });
});
