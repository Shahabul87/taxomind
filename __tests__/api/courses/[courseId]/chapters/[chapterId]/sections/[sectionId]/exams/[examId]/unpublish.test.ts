import { PATCH } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/exams/[examId]/unpublish/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function props() {
  return {
    params: Promise.resolve({
      courseId: 'course-1',
      chapterId: 'chapter-1',
      sectionId: 'section-1',
      examId: 'exam-1',
    }),
  };
}

describe('/api/courses/[courseId]/.../exams/[examId]/unpublish route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'course-1', userId: 'user-1' });
    (db.exam.findUnique as jest.Mock).mockResolvedValue({ id: 'exam-1', sectionId: 'section-1' });
    (db.exam.update as jest.Mock).mockResolvedValue({ id: 'exam-1', isPublished: false });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await PATCH(new Request('http://localhost') as never, props());
    expect(res.status).toBe(401);
  });

  it('returns 401 when course is not owned', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await PATCH(new Request('http://localhost') as never, props());
    expect(res.status).toBe(401);
  });

  it('returns 404 when exam is missing', async () => {
    (db.exam.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await PATCH(new Request('http://localhost') as never, props());
    expect(res.status).toBe(404);
  });

  it('unpublishes exam successfully', async () => {
    const res = await PATCH(new Request('http://localhost') as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isPublished).toBe(false);
    expect(db.exam.update).toHaveBeenCalledWith({
      where: { id: 'exam-1' },
      data: { isPublished: false },
    });
  });
});
