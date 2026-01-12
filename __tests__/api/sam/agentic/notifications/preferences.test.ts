/**
 * Tests for SAM Notification Preferences API
 */

import { NextRequest } from 'next/server';

// Mock auth first
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Mock the pooled db module which is the source
jest.mock('@/lib/db-pooled', () => {
  const mocks = {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  };
  return {
    db: {
      userNotificationPreferences: mocks,
    },
    getDb: () => ({
      userNotificationPreferences: mocks,
    }),
    getDbMetrics: jest.fn(),
    checkDatabaseHealth: jest.fn(),
    __mocks__: mocks, // Export for test access
  };
});

// Mock the db module that re-exports from db-pooled
jest.mock('@/lib/db', () => {
  const pooled = jest.requireMock('@/lib/db-pooled');
  return {
    db: pooled.db,
  };
});

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
import { GET, POST, PATCH } from '@/app/api/sam/agentic/notifications/preferences/route';
import { auth } from '@/auth';

// Access mocks from the mocked module
const dbPooledMock = jest.requireMock('@/lib/db-pooled');
const mockAuth = auth as jest.Mock;
const mockFindUnique = dbPooledMock.__mocks__.findUnique as jest.Mock;
const mockCreate = dbPooledMock.__mocks__.create as jest.Mock;
const mockUpsert = dbPooledMock.__mocks__.upsert as jest.Mock;

// Default mock preferences from database
const mockDbPreferences = {
  samEnabled: true,
  samStudyReminders: true,
  samGoalProgress: true,
  samCheckIns: true,
  samAchievements: true,
  samStruggles: true,
  samRecommendations: true,
  samSound: true,
  samQuietHoursEnabled: false,
  samQuietHoursStart: 22,
  samQuietHoursEnd: 7,
};

describe('GET /api/sam/agentic/notifications/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return existing preferences', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindUnique.mockResolvedValue(mockDbPreferences);

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      studyReminders: true,
      goalProgress: true,
      checkIns: true,
      achievements: true,
      struggles: true,
      recommendations: true,
      enabled: true,
      sound: true,
      quietHoursEnabled: false,
      quietHoursStart: 22,
      quietHoursEnd: 7,
    });
  });

  it('should create default preferences if none exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue(mockDbPreferences);

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockCreate).toHaveBeenCalled();
  });
});

describe('POST /api/sam/agentic/notifications/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({ preferences: {} }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should save preferences successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockUpsert.mockResolvedValue({
      ...mockDbPreferences,
      samEnabled: false,
      samStudyReminders: false,
    });

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'user-123',
        preferences: {
          enabled: false,
          studyReminders: false,
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('should prevent updating another user preferences', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'another-user',
        preferences: { enabled: false },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Cannot update preferences for another user');
  });

  it('should return 400 for invalid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify({
        preferences: {
          quietHoursStart: 25, // Invalid: must be 0-23
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid preferences data');
  });
});

describe('PATCH /api/sam/agentic/notifications/preferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ enabled: false }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should partially update preferences', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockUpsert.mockResolvedValue({
      ...mockDbPreferences,
      samSound: false,
    });

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ sound: false }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.sound).toBe(false);
  });

  it('should return 400 if no valid preferences to update', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No valid preferences to update');
  });

  it('should update quiet hours settings', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-123' } });
    mockUpsert.mockResolvedValue({
      ...mockDbPreferences,
      samQuietHoursEnabled: true,
      samQuietHoursStart: 20,
      samQuietHoursEnd: 8,
    });

    const request = new NextRequest('http://localhost/api/sam/agentic/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify({
        quietHoursEnabled: true,
        quietHoursStart: 20,
        quietHoursEnd: 8,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.quietHoursEnabled).toBe(true);
    expect(data.data.quietHoursStart).toBe(20);
    expect(data.data.quietHoursEnd).toBe(8);
  });
});
