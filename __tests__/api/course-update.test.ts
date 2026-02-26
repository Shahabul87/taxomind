import { POST } from '@/app/api/course-update/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

describe('/api/course-update route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'course-1', userId: 'user-1' });
    (db.course.update as jest.Mock).mockResolvedValue({ id: 'course-1', title: 'Updated' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/course-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: 'course-1', title: 'Updated' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when courseId is missing', async () => {
    const req = new Request('http://localhost:3000/api/course-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when course is not found for user', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/course-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: 'course-1', title: 'Updated' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 when no update fields are provided', async () => {
    const req = new Request('http://localhost:3000/api/course-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: 'course-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('updates course and returns success response', async () => {
    const req = new Request('http://localhost:3000/api/course-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: 'course-1', title: 'Updated' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.course.update).toHaveBeenCalled();
  });
});
