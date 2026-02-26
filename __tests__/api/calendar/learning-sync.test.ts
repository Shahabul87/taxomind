jest.mock('@/lib/google-calendar', () => ({
  getValidTokens: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  getEvent: jest.fn(),
}));

import { POST } from '@/app/api/calendar/learning-sync/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getValidTokens } from '@/lib/google-calendar';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetValidTokens = getValidTokens as jest.Mock;

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

const googleCalendarIntegration = ensureModel('googleCalendarIntegration', ['findUnique', 'update']);

describe('/api/calendar/learning-sync route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    googleCalendarIntegration.findUnique.mockResolvedValue({
      id: 'gci-1',
      userId: 'user-1',
      selectedCalendarId: 'cal-1',
      syncErrorCount: 0,
      syncDirection: 'TWO_WAY',
      syncStudySessions: true,
      syncDailyTodos: true,
      syncGoalMilestones: true,
      studySessionColor: '#1E88E5',
      quizColor: '#43A047',
      assignmentColor: '#FB8C00',
      goalColor: '#8E24AA',
      liveClassColor: '#E53935',
      defaultReminderMinutes: 15,
      includeDescription: true,
      includeCourseLink: true,
    });
    mockGetValidTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar/learning-sync', {
      method: 'POST',
      body: JSON.stringify({ syncType: 'incremental' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/learning-sync', {
      method: 'POST',
      body: JSON.stringify({ syncType: 'wrong-type' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when integration is missing', async () => {
    googleCalendarIntegration.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar/learning-sync', {
      method: 'POST',
      body: JSON.stringify({ syncType: 'incremental' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 400 when selected calendar is missing', async () => {
    googleCalendarIntegration.findUnique.mockResolvedValueOnce({
      id: 'gci-1',
      userId: 'user-1',
      selectedCalendarId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/calendar/learning-sync', {
      method: 'POST',
      body: JSON.stringify({ syncType: 'incremental' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 401 when tokens are not available', async () => {
    mockGetValidTokens.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar/learning-sync', {
      method: 'POST',
      body: JSON.stringify({ syncType: 'incremental' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});
