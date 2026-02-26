jest.mock('@/lib/google-calendar', () => ({
  revokeAccess: jest.fn(),
  listCalendars: jest.fn(),
  getValidTokens: jest.fn(),
}));

import { DELETE, GET } from '@/app/api/calendar/status/route';
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

const googleCalendarIntegration = ensureModel('googleCalendarIntegration', ['findUnique', 'delete']);
const calendarEventMapping = ensureModel('calendarEventMapping', ['deleteMany']);
const calendarSyncLog = ensureModel('calendarSyncLog', ['deleteMany']);

describe('/api/calendar/status route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetValidTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    mockListCalendars.mockResolvedValue([{ id: 'cal-1', summary: 'Primary', primary: true }]);
    googleCalendarIntegration.findUnique.mockResolvedValue({
      id: 'gci-1',
      userId: 'user-1',
      accessToken: 'token',
      googleEmail: 'user@example.com',
      googleAccountId: 'ga-1',
      selectedCalendarId: 'cal-1',
      selectedCalendarName: 'Primary',
      createDedicatedCalendar: false,
      status: 'CONNECTED',
      lastSyncAt: null,
      lastSyncError: null,
      syncErrorCount: 0,
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
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      syncLogs: [
        {
          id: 'log-1',
          syncType: 'initial',
          status: 'success',
          eventsCreated: 1,
          eventsUpdated: 0,
          eventsDeleted: 0,
          eventsFailed: 0,
          startedAt: new Date('2026-02-01T00:00:00.000Z'),
          completedAt: new Date('2026-02-01T00:00:01.000Z'),
          durationMs: 1000,
          errorMessage: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ],
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/calendar/status'));
    expect(res.status).toBe(401);
  });

  it('GET returns disconnected state when no integration exists', async () => {
    googleCalendarIntegration.findUnique.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/calendar/status'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.connected).toBe(false);
  });

  it('GET returns integration status payload', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/calendar/status'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.connected).toBe(true);
    expect(Array.isArray(body.data.calendars)).toBe(true);
  });

  it('DELETE returns 404 when integration is missing', async () => {
    googleCalendarIntegration.findUnique.mockResolvedValueOnce(null);

    const res = await DELETE(new NextRequest('http://localhost:3000/api/calendar/status', { method: 'DELETE' }));
    expect(res.status).toBe(404);
  });

  it('DELETE disconnects integration and cleans up mappings/logs', async () => {
    googleCalendarIntegration.delete.mockResolvedValue({ id: 'gci-1' });
    calendarEventMapping.deleteMany.mockResolvedValue({ count: 1 });
    calendarSyncLog.deleteMany.mockResolvedValue({ count: 1 });

    const res = await DELETE(new NextRequest('http://localhost:3000/api/calendar/status', { method: 'DELETE' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(calendarEventMapping.deleteMany).toHaveBeenCalled();
    expect(calendarSyncLog.deleteMany).toHaveBeenCalled();
    expect(googleCalendarIntegration.delete).toHaveBeenCalled();
  });
});
