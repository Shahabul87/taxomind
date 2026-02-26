/**
 * Tests for Settings Preferences Route - app/api/settings/preferences/route.ts
 */

import { GET, PUT } from '@/app/api/settings/preferences/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).userNotificationPreferences) {
  (db as Record<string, unknown>).userNotificationPreferences = {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  };
}
if (!(db as Record<string, unknown>).userPrivacySettings) {
  (db as Record<string, unknown>).userPrivacySettings = {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  };
}

const mockNotif = (db as Record<string, any>).userNotificationPreferences;
const mockPrivacy = (db as Record<string, any>).userPrivacySettings;

function getReq() {
  return new NextRequest('http://localhost:3000/api/settings/preferences', { method: 'GET' });
}

function putReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/settings/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Settings preferences route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockNotif.findUnique.mockResolvedValue({
      emailNotifications: true,
      emailCourseUpdates: true,
      emailNewMessages: true,
      emailMarketingEmails: false,
      emailWeeklyDigest: true,
      pushNotifications: true,
      pushCourseReminders: true,
      pushNewMessages: true,
      pushAchievements: true,
    });
    mockPrivacy.findUnique.mockResolvedValue({
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showLearningProgress: true,
      allowDataCollection: true,
      allowPersonalization: true,
      cookieNecessary: true,
      cookieFunctional: true,
      cookieAnalytics: true,
      cookieMarketing: false,
    });
    mockNotif.create.mockResolvedValue({ userId: 'user-1' });
    mockPrivacy.create.mockResolvedValue({ userId: 'user-1' });
    mockNotif.upsert.mockResolvedValue({ userId: 'user-1' });
    mockPrivacy.upsert.mockResolvedValue({ userId: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET creates defaults when preferences do not exist', async () => {
    mockNotif.findUnique.mockResolvedValue(null);
    mockPrivacy.findUnique.mockResolvedValue(null);

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockNotif.create).toHaveBeenCalled();
    expect(mockPrivacy.create).toHaveBeenCalled();
  });

  it('PUT returns 400 for invalid payload', async () => {
    const res = await PUT(putReq({ privacy: { profileVisibility: 'everyone' } }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('PUT updates notification and privacy preferences', async () => {
    const res = await PUT(putReq({
      notifications: { emailNotifications: false, pushNotifications: true },
      privacy: { profileVisibility: 'private', showEmail: false },
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockNotif.upsert).toHaveBeenCalled();
    expect(mockPrivacy.upsert).toHaveBeenCalled();
  });
});
