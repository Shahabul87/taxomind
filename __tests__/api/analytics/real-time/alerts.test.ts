jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/analytics/real-time/alerts/route';
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

const userExamAttempt = ensureModel('userExamAttempt', ['findMany', 'groupBy', 'findFirst']);
const enrollment = ensureModel('enrollment', ['findMany']);
const learningMetrics = ensureModel('learning_metrics', ['groupBy']);
const course = ensureModel('course', ['findUnique']);
const section = ensureModel('section', ['findMany']);
const video = ensureModel('video', ['findMany']);

describe('/api/analytics/real-time/alerts route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    userExamAttempt.findMany.mockResolvedValue([]);
    userExamAttempt.groupBy.mockResolvedValue([]);
    userExamAttempt.findFirst.mockResolvedValue(null);
    enrollment.findMany.mockResolvedValue([]);
    learningMetrics.groupBy.mockResolvedValue([]);
    course.findUnique.mockResolvedValue(null);
    section.findMany.mockResolvedValue([]);
    video.findMany.mockResolvedValue([]);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/real-time/alerts');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns alerts payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/real-time/alerts?courseId=course-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.alerts)).toBe(true);
  });

  it('POST handles resolve/snooze/escalate and rejects invalid action', async () => {
    const resolveReq = new NextRequest('http://localhost:3000/api/analytics/real-time/alerts', {
      method: 'POST',
      body: JSON.stringify({ action: 'resolve', alertId: 'a1', data: {} }),
    });
    const resolveRes = await POST(resolveReq);
    expect(resolveRes.status).toBe(200);

    const snoozeReq = new NextRequest('http://localhost:3000/api/analytics/real-time/alerts', {
      method: 'POST',
      body: JSON.stringify({ action: 'snooze', alertId: 'a1', data: { duration: 15 } }),
    });
    const snoozeRes = await POST(snoozeReq);
    expect(snoozeRes.status).toBe(200);

    const invalidReq = new NextRequest('http://localhost:3000/api/analytics/real-time/alerts', {
      method: 'POST',
      body: JSON.stringify({ action: 'noop', alertId: 'a1', data: {} }),
    });
    const invalidRes = await POST(invalidReq);
    expect(invalidRes.status).toBe(400);
  });
});
