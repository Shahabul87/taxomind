import { POST } from '@/app/api/proctoring/violation/route';
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

const proctorSession = ensureModel('proctorSession', ['findFirst', 'update']);
const proctorViolation = ensureModel('proctorViolation', ['create']);

function createRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/proctoring/violation', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/proctoring/violation route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    proctorSession.findFirst.mockResolvedValue({ id: 'session-1', userId: 'user-1', status: 'ACTIVE' });
    proctorViolation.create.mockResolvedValue({
      id: 'violation-1',
      type: 'TAB_SWITCH',
      severity: 'LOW',
    });
    proctorSession.update.mockResolvedValue({ id: 'session-1', violationCount: 1 });
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(
      createRequest({
        sessionId: 'session-1',
        type: 'TAB_SWITCH',
        severity: 'LOW',
        description: 'Switched tab',
      })
    );

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid violation payload', async () => {
    const res = await POST(
      createRequest({
        sessionId: 'session-1',
        type: 'NOT_VALID',
        severity: 'LOW',
        description: 'Bad type',
      })
    );

    expect(res.status).toBe(400);
  });

  it('returns 404 when active proctor session is not found', async () => {
    proctorSession.findFirst.mockResolvedValueOnce(null);

    const res = await POST(
      createRequest({
        sessionId: 'missing-session',
        type: 'TAB_SWITCH',
        severity: 'LOW',
        description: 'Switched tab',
      })
    );

    expect(res.status).toBe(404);
  });

  it('returns warning when user is one violation from auto-termination', async () => {
    proctorSession.update.mockResolvedValueOnce({ id: 'session-1', violationCount: 4 });

    const res = await POST(
      createRequest({
        sessionId: 'session-1',
        type: 'WINDOW_BLUR',
        severity: 'MEDIUM',
        description: 'Lost focus',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalViolations).toBe(4);
    expect(body.data.warning).toContain('1 violation(s) remaining');
    expect(body.data.sessionTerminated).toBe(false);
  });

  it('auto-terminates session when max violations are reached', async () => {
    proctorSession.update
      .mockResolvedValueOnce({ id: 'session-1', violationCount: 5 })
      .mockResolvedValueOnce({ id: 'session-1', status: 'TERMINATED' });

    const res = await POST(
      createRequest({
        sessionId: 'session-1',
        type: 'DEVTOOLS_OPEN',
        severity: 'HIGH',
        description: 'Devtools opened',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.sessionTerminated).toBe(true);
    expect(proctorSession.update).toHaveBeenCalledTimes(2);
    expect(proctorSession.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'session-1' },
        data: expect.objectContaining({ status: 'TERMINATED' }),
      })
    );
  });
});
