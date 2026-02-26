jest.mock('@/lib/google-calendar', () => ({
  getValidTokens: jest.fn(),
  listCalendars: jest.fn(),
  createTaxomindCalendar: jest.fn(),
}));

import { GET, PUT } from '@/app/api/calendar/settings/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getValidTokens, listCalendars } from '@/lib/google-calendar';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetValidTokens = getValidTokens as jest.Mock;
const mockListCalendars = listCalendars as jest.Mock;

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

describe('/api/calendar/settings route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    googleCalendarIntegration.findUnique.mockResolvedValue({
      id: 'gci-1',
      userId: 'user-1',
      selectedCalendarId: 'cal-1',
      selectedCalendarName: 'Primary',
      createDedicatedCalendar: false,
      syncDirection: 'TWO_WAY',
      autoSyncEnabled: true,
      autoSyncIntervalMinutes: 30,
      syncStudySessions: true,
      syncQuizzes: true,
      syncAssignments: true,
      syncGoalMilestones: true,
      syncLiveClasses: true,
      syncDailyTodos: true,
      studySessionColor: '#1E88E5',
      quizColor: '#43A047',
      assignmentColor: '#FB8C00',
      goalColor: '#8E24AA',
      liveClassColor: '#E53935',
      defaultReminderMinutes: 15,
      includeDescription: true,
      includeCourseLink: true,
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    googleCalendarIntegration.update.mockImplementation(async ({ data }) => ({
      ...(await googleCalendarIntegration.findUnique.mock.results[0]?.value),
      ...data,
      id: 'gci-1',
      updatedAt: new Date('2026-02-02T00:00:00.000Z'),
    }));
    mockGetValidTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    mockListCalendars.mockResolvedValue([{ id: 'cal-2', summary: 'Team Calendar' }]);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/calendar/settings'));
    expect(res.status).toBe(401);
  });

  it('GET returns null data when integration is missing', async () => {
    googleCalendarIntegration.findUnique.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/calendar/settings'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('PUT returns 400 on invalid settings', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/settings', {
      method: 'PUT',
      body: JSON.stringify({ autoSyncIntervalMinutes: 1 }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('PUT returns 404 when integration is missing', async () => {
    googleCalendarIntegration.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar/settings', {
      method: 'PUT',
      body: JSON.stringify({ syncDirection: 'TWO_WAY' }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(404);
  });

  it('PUT updates selected calendar and returns settings', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/settings', {
      method: 'PUT',
      body: JSON.stringify({ selectedCalendarId: 'cal-2' }),
    });

    const res = await PUT(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(googleCalendarIntegration.update).toHaveBeenCalled();
    expect(mockListCalendars).toHaveBeenCalled();
  });
});
