import { POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/explanations/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  const dbRecord = db as Record<string, Record<string, jest.Mock> | undefined>;
  if (!dbRecord[modelName]) {
    dbRecord[modelName] = {} as Record<string, jest.Mock>;
  }
  for (const method of methods) {
    if (!(dbRecord[modelName] as Record<string, jest.Mock>)[method]) {
      (dbRecord[modelName] as Record<string, jest.Mock>)[method] = jest.fn();
    }
  }
  return dbRecord[modelName] as Record<string, jest.Mock>;
}

const codeExplanation = ensureModel('codeExplanation', ['create']);

function props(courseId = 'course-1', chapterId = 'chapter-1', sectionId = 'section-1') {
  return { params: Promise.resolve({ courseId, chapterId, sectionId }) };
}

function request(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/section-1/explanations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/explanations route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.section.findUnique as jest.Mock).mockResolvedValue({ id: 'section-1' });
    codeExplanation.create.mockResolvedValue({ id: 'exp-1', title: 'Loop', sectionId: 'section-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(
      request({ title: 'Loop', code: 'for(;;){}', explanation: 'Infinite loop' }),
      props()
    );

    expect(res.status).toBe(401);
  });

  it('returns 401 when section is not found', async () => {
    (db.section.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await POST(
      request({ title: 'Loop', code: 'for(;;){}', explanation: 'Infinite loop' }),
      props()
    );

    expect(res.status).toBe(401);
  });

  it('creates explanation and returns JSON', async () => {
    const res = await POST(
      request({ title: 'Loop', code: 'for(;;){}', explanation: 'Infinite loop' }),
      props()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('exp-1');
    expect(codeExplanation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sectionId: 'section-1' }),
      })
    );
  });

  it('returns 500 on unexpected error', async () => {
    (db.section.findUnique as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const res = await POST(
      request({ title: 'Loop', code: 'for(;;){}', explanation: 'Infinite loop' }),
      props()
    );

    expect(res.status).toBe(500);
  });
});
