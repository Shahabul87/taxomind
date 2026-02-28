import { GET } from '@/app/api/integrity/report/[reportId]/route';
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

const integrityReport = ensureModel('integrityReport', ['findUnique']);

function params(reportId = 'report-1') {
  return { params: Promise.resolve({ reportId }) };
}

describe('/api/integrity/report/[reportId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'TEACHER' });
    integrityReport.findUnique.mockResolvedValue({
      id: 'report-1',
      answerId: 'answer-1',
      studentId: 'student-1',
      student: { id: 'student-1', name: 'Student', email: 'student@example.com' },
      exam: { id: 'exam-1', title: 'Midterm' },
      checkType: 'COMPREHENSIVE',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      overallScore: 90,
      plagiarismScore: 10,
      highestSimilarity: 0.1,
      aiProbability: 0.2,
      styleConsistency: 85,
      matches: [
        {
          id: 'm1',
          sourceType: 'WEB',
          sourceId: 'src-1',
          sourceTitle: 'Reference',
          similarity: 0.1,
          matchedText: 'sample',
        },
      ],
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date('2026-02-28T00:00:00.000Z'),
      updatedAt: new Date('2026-02-28T00:00:00.000Z'),
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/integrity/report/report-1');
    const res = await GET(req, params());

    expect(res.status).toBe(401);
  });

  it('returns 404 when report does not exist', async () => {
    integrityReport.findUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/integrity/report/report-1');
    const res = await GET(req, params());

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-owner non-privileged users', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'other-user', role: 'STUDENT' });
    const req = new NextRequest('http://localhost:3000/api/integrity/report/report-1');
    const res = await GET(req, params());

    expect(res.status).toBe(403);
  });

  it('returns report for privileged user with student details', async () => {
    const req = new NextRequest('http://localhost:3000/api/integrity/report/report-1');
    const res = await GET(req, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('report-1');
    expect(body.data.student.id).toBe('student-1');
    expect(body.data.matches).toHaveLength(1);
  });

  it('returns owner view without student payload for non-privileged role', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'student-1', role: 'STUDENT' });
    const req = new NextRequest('http://localhost:3000/api/integrity/report/report-1');
    const res = await GET(req, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.student).toBeUndefined();
  });
});
