import { GET, POST } from '@/app/api/courses/[courseId]/enroll/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

describe('api/courses/[courseId]/enroll route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        ...(globalThis.crypto || {}),
        randomUUID: jest.fn(() => 'uuid-enroll-1'),
      },
      configurable: true,
    });
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/courses/course-1/enroll', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params: Promise.resolve({ courseId: 'course-1' }) });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST creates free enrollment', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Course',
      isFree: true,
      price: 0,
      isPublished: true,
    });
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
    (db.enrollment.create as jest.Mock).mockResolvedValue({
      id: 'enroll-1',
      userId: 'user-1',
      courseId: 'course-1',
    });

    const req = new Request('http://localhost:3000/api/courses/course-1/enroll', {
      method: 'POST',
      body: JSON.stringify({ metadata: { source: 'test' } }),
    });
    const res = await POST(req, { params: Promise.resolve({ courseId: 'course-1' }) });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.enrollmentId).toBe('enroll-1');
  });

  it('GET returns enrollment status false when not enrolled', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/courses/course-1/enroll', { method: 'GET' });
    const res = await GET(req, { params: Promise.resolve({ courseId: 'course-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isEnrolled).toBe(false);
  });
});
