/**
 * Tests for Context Route - app/api/auth/context/route.ts
 *
 * Covers: GET (current context), POST (switch context)
 */

jest.mock('@/lib/auth/context-manager', () => ({
  getCurrentContext: jest.fn(),
  switchContext: jest.fn(),
  getAvailableContextSwitches: jest.fn(),
  getContextDashboardData: jest.fn(),
}));

jest.mock('@/lib/auth/capabilities', () => ({
  UserCapability: {
    STUDENT: 'STUDENT',
    TEACHER: 'TEACHER',
    AFFILIATE: 'AFFILIATE',
    CONTENT_CREATOR: 'CONTENT_CREATOR',
    MODERATOR: 'MODERATOR',
    REVIEWER: 'REVIEWER',
  },
}));

// @/auth, @/lib/db, @/lib/logger are globally mocked

import { GET, POST } from '@/app/api/auth/context/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  getCurrentContext,
  switchContext,
  getAvailableContextSwitches,
  getContextDashboardData,
} from '@/lib/auth/context-manager';

const mockAuth = auth as jest.Mock;
const mockGetContext = getCurrentContext as jest.Mock;
const mockSwitchContext = switchContext as jest.Mock;
const mockGetSwitches = getAvailableContextSwitches as jest.Mock;
const mockGetDashboard = getContextDashboardData as jest.Mock;

function createGetRequest() {
  return new NextRequest('http://localhost:3000/api/auth/context', {
    method: 'GET',
  });
}

function createPostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/auth/context', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const MOCK_CONTEXT = {
  activeCapability: 'STUDENT',
  capabilities: ['STUDENT', 'TEACHER'],
};

const MOCK_SWITCHES = [
  { capability: 'TEACHER', label: 'Switch to Teacher' },
];

const MOCK_DASHBOARD = {
  enrolledCourses: 5,
  completedCourses: 2,
};

// ============================================================
// GET /api/auth/context
// ============================================================
describe('GET /api/auth/context', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    mockGetContext.mockResolvedValue(MOCK_CONTEXT);
    mockGetSwitches.mockResolvedValue(MOCK_SWITCHES);
    mockGetDashboard.mockResolvedValue(MOCK_DASHBOARD);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 500 when no context is found', async () => {
    mockGetContext.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to get user context');
  });

  it('returns 200 with context, switches, and dashboard data', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.currentContext.capability).toBe('STUDENT');
    expect(body.data.currentContext.capabilities).toEqual(['STUDENT', 'TEACHER']);
    expect(body.data.availableSwitches).toEqual(MOCK_SWITCHES);
    expect(body.data.dashboardData).toEqual(MOCK_DASHBOARD);

    expect(mockGetContext).toHaveBeenCalledWith('user-1');
    expect(mockGetSwitches).toHaveBeenCalledWith('user-1', 'STUDENT');
    expect(mockGetDashboard).toHaveBeenCalledWith('user-1', 'STUDENT');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetContext.mockRejectedValue(new Error('Database error'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to fetch context');
  });
});

// ============================================================
// POST /api/auth/context
// ============================================================
describe('POST /api/auth/context', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    mockSwitchContext.mockResolvedValue({
      success: true,
      context: {
        capabilities: ['STUDENT', 'TEACHER'],
      },
    });

    mockGetSwitches.mockResolvedValue([
      { capability: 'STUDENT', label: 'Switch to Student' },
    ]);

    mockGetDashboard.mockResolvedValue({
      totalCourses: 10,
      publishedCourses: 7,
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createPostRequest({ context: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Unauthorized');
  });

  it('returns 400 for invalid body (invalid context value)', async () => {
    const res = await POST(createPostRequest({ context: 'INVALID_CONTEXT' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid request');
  });

  it('returns 400 when switch fails', async () => {
    mockSwitchContext.mockResolvedValue({
      success: false,
      error: 'You do not have this capability',
    });

    const res = await POST(createPostRequest({ context: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('do not have this capability');
  });

  it('returns 200 on successful context switch', async () => {
    const res = await POST(createPostRequest({ context: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('TEACHER');
    expect(body.data.newContext.capability).toBe('TEACHER');
    expect(body.data.newContext.capabilities).toEqual(['STUDENT', 'TEACHER']);
    expect(body.data.availableSwitches).toBeDefined();
    expect(body.data.dashboardData).toBeDefined();

    expect(mockSwitchContext).toHaveBeenCalledWith('user-1', 'TEACHER');
    expect(mockGetDashboard).toHaveBeenCalledWith('user-1', 'TEACHER');
    expect(mockGetSwitches).toHaveBeenCalledWith('user-1', 'TEACHER');
  });

  it('returns 200 when switching to STUDENT context', async () => {
    mockSwitchContext.mockResolvedValue({
      success: true,
      context: {
        capabilities: ['STUDENT'],
      },
    });

    const res = await POST(createPostRequest({ context: 'STUDENT' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.newContext.capability).toBe('STUDENT');
  });

  it('returns 500 on unexpected error', async () => {
    mockSwitchContext.mockRejectedValue(new Error('Database error'));

    const res = await POST(createPostRequest({ context: 'TEACHER' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to switch context');
  });
});
