import { POST } from '@/app/api/integrity/analyze/route';
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
  return model;
}

const integrityReport = ensureModel('integrityReport', ['create']);

function req(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/integrity/analyze', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/integrity/analyze route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
    integrityReport.create.mockResolvedValue({
      id: 'report-1',
      riskLevel: 'LOW',
      overallScore: 98,
      plagiarismScore: 2,
      highestSimilarity: 0.02,
      aiProbability: 0.03,
      styleConsistency: 82,
      createdAt: new Date('2026-02-28T00:00:00.000Z'),
    });
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(req({}));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user has insufficient role', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'student-1', role: 'STUDENT' });
    const res = await POST(req({}));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid payload', async () => {
    const res = await POST(req({ answerId: 'a1' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates integrity report and returns analysis data', async () => {
    const res = await POST(
      req({
        answerId: 'answer-1',
        studentId: 'student-1',
        examId: 'exam-1',
        content: 'This is a sample answer content for integrity checks.',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.reportId).toBe('report-1');
    expect(body.data.aiDetection.isLikelyAI).toBe(false);
    expect(integrityReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          answerId: 'answer-1',
          studentId: 'student-1',
          examId: 'exam-1',
          checkType: 'COMPREHENSIVE',
        }),
      })
    );
  });

  it('returns 500 when persistence fails', async () => {
    integrityReport.create.mockRejectedValueOnce(new Error('db failure'));
    const res = await POST(
      req({
        answerId: 'answer-1',
        studentId: 'student-1',
        examId: 'exam-1',
        content: 'hello',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
