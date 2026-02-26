jest.mock('@/lib/google-calendar', () => ({
  exchangeCodeForTokens: jest.fn(),
  getUserInfo: jest.fn(),
  listCalendars: jest.fn(),
  DEFAULT_SYNC_SETTINGS: {
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
  },
}));

import { GET } from '@/app/api/calendar/callback/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/calendar/callback route', () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it('redirects with oauth error when error param is present', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/callback?error=access_denied');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('calendar_error=access_denied');
  });

  it('redirects with no_code when code is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/calendar/callback');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('calendar_error=no_code');
  });

  it('redirects to signin when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/calendar/callback?code=abc123');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('/auth/signin');
  });

  it('redirects on state mismatch', async () => {
    const state = Buffer.from(JSON.stringify({ userId: 'other-user', timestamp: Date.now() })).toString('base64');
    const req = new NextRequest(`http://localhost:3000/api/calendar/callback?code=abc123&state=${encodeURIComponent(state)}`);
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(String(res.headers.get('location'))).toContain('calendar_error=state_mismatch');
  });
});
