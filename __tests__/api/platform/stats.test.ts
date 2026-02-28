import { GET } from '@/app/api/platform/stats/route';
import { db } from '@/lib/db';

describe('/api/platform/stats route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (db.user.count as jest.Mock).mockResolvedValue(1000);
    (db.enrollment.count as jest.Mock)
      .mockResolvedValueOnce(12500)
      .mockResolvedValueOnce(6250);
    (db.course.count as jest.Mock).mockResolvedValue(220);
    (db.courseReview.count as jest.Mock).mockResolvedValue(880);
  });

  it('returns aggregated platform statistics', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalUsers).toBe(1000);
    expect(body.data.activeLearners).toBe(12500);
    expect(body.data.activeLearnerDisplay).toBe('13K+');
    expect(body.data.completedEnrollments).toBe(6250);
    expect(body.data.successRate).toBe(50);
    expect(body.data.totalCourses).toBe(220);
    expect(body.data.totalReviews).toBe(880);
  });

  it('queries completed enrollments and published courses filters', async () => {
    await GET();

    expect(db.enrollment.count).toHaveBeenCalledWith({
      where: {
        status: 'COMPLETED',
      },
    });
    expect(db.course.count).toHaveBeenCalledWith({
      where: {
        isPublished: true,
      },
    });
  });

  it('returns fallback payload when queries fail', async () => {
    (db.user.count as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.activeLearners).toBe(0);
    expect(body.data.activeLearnerDisplay).toBe('0+');
    expect(body.metadata.error).toBe('Stats temporarily unavailable');
  });
});
