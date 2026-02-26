import { GET } from '@/app/api/courses/[courseId]/cognitive-recommendations/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model as Record<string, jest.Mock>;
}

const courseCognitiveQuality = ensureModel('courseCognitiveQuality', ['create']);

describe('GET /api/courses/[courseId]/cognitive-recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/cognitive-recommendations'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(401);
  });

  it('returns 404 when course is not found', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/cognitive-recommendations'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(404);
  });

  it('returns recommendations using persisted cognitive quality', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'course-1',
      userId: 'user-1',
      chapters: [{ id: 'ch-1', title: 'Ch 1', sections: [{ id: 's1', title: 'Intro' }] }],
      cognitiveQuality: {
        rememberPercent: 20,
        understandPercent: 20,
        applyPercent: 20,
        analyzePercent: 15,
        evaluatePercent: 10,
        createPercent: 15,
        cognitiveScore: 82,
        cognitiveGrade: 'A',
      },
    });

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/cognitive-recommendations'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.currentScore).toBe(82);
    expect(Array.isArray(body.data.recommendations)).toBe(true);
  });

  it('creates cognitive quality when absent', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'course-1',
      userId: 'user-1',
      chapters: [{ id: 'ch-1', title: 'Apply concepts', sections: [{ id: 's1', title: 'Apply concepts' }] }],
      cognitiveQuality: null,
    });
    courseCognitiveQuality.create.mockResolvedValueOnce({ id: 'cq-1' });

    const res = await GET(
      new NextRequest('http://localhost:3000/api/courses/course-1/cognitive-recommendations'),
      { params: Promise.resolve({ courseId: 'course-1' }) }
    );

    expect(res.status).toBe(200);
    expect(courseCognitiveQuality.create).toHaveBeenCalled();
  });
});
