import { DELETE, GET, POST } from '@/app/api/proctoring/session/route';
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

const proctorSession = ensureModel('proctorSession', ['findFirst', 'create', 'update']);

describe('/api/proctoring/session route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    proctorSession.findFirst.mockResolvedValue(null);
    proctorSession.create.mockResolvedValue({
      id: 'session-1',
      status: 'ACTIVE',
      startTime: new Date('2026-02-01T10:00:00.000Z'),
    });
    proctorSession.update.mockResolvedValue({
      id: 'session-1',
      status: 'COMPLETED',
      integrityScore: 94,
      endTime: new Date('2026-02-01T10:05:00.000Z'),
    });
  });

  it('POST returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/proctoring/session', {
      method: 'POST',
      body: JSON.stringify({ examId: 'exam-1' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('POST returns existing active session if found', async () => {
    proctorSession.findFirst.mockResolvedValueOnce({ id: 'session-existing', status: 'ACTIVE' });

    const req = new NextRequest('http://localhost:3000/api/proctoring/session', {
      method: 'POST',
      body: JSON.stringify({ examId: 'exam-1' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.sessionId).toBe('session-existing');
    expect(body.data.message).toBe('Existing session found');
    expect(proctorSession.create).not.toHaveBeenCalled();
  });

  it('POST creates a new active session', async () => {
    const req = new NextRequest('http://localhost:3000/api/proctoring/session', {
      method: 'POST',
      body: JSON.stringify({
        examId: 'exam-1',
        userAgent: 'Jest',
        screenWidth: 1200,
        screenHeight: 800,
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.sessionId).toBe('session-1');
    expect(proctorSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          examId: 'exam-1',
          status: 'ACTIVE',
          integrityScore: 100,
        }),
      })
    );
  });

  it('GET returns 404 when no active session exists', async () => {
    const req = new NextRequest('http://localhost:3000/api/proctoring/session?examId=exam-1');
    const res = await GET(req);

    expect(res.status).toBe(404);
  });

  it('GET returns active session with recent violations', async () => {
    proctorSession.findFirst.mockResolvedValueOnce({
      id: 'session-1',
      examId: 'exam-1',
      status: 'ACTIVE',
      integrityScore: 97,
      violationCount: 1,
      startTime: new Date('2026-02-01T10:00:00.000Z'),
      violations: [{ id: 'v1', severity: 'LOW' }],
    });

    const req = new NextRequest('http://localhost:3000/api/proctoring/session?examId=exam-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.sessionId).toBe('session-1');
    expect(body.data.recentViolations).toHaveLength(1);
  });

  it('DELETE returns 400 when sessionId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/proctoring/session', {
      method: 'DELETE',
    });
    const res = await DELETE(req);

    expect(res.status).toBe(400);
  });

  it('DELETE ends session and computes final integrity score', async () => {
    proctorSession.findFirst.mockResolvedValueOnce({
      id: 'session-1',
      userId: 'user-1',
      status: 'ACTIVE',
      startTime: new Date('2026-02-01T10:00:00.000Z'),
      violations: [{ severity: 'LOW' }, { severity: 'HIGH' }],
    });
    proctorSession.update.mockResolvedValueOnce({
      id: 'session-1',
      status: 'COMPLETED',
      integrityScore: 94,
      endTime: new Date('2026-02-01T10:05:00.000Z'),
    });

    const req = new NextRequest('http://localhost:3000/api/proctoring/session?sessionId=session-1', {
      method: 'DELETE',
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.integrityScore).toBe(94);
    expect(body.data.totalViolations).toBe(2);
    expect(proctorSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-1' },
        data: expect.objectContaining({ status: 'COMPLETED', integrityScore: 94 }),
      })
    );
  });
});
