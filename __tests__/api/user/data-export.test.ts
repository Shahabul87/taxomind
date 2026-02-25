/**
 * Tests for GDPR Data Export Route - app/api/user/data-export/route.ts
 *
 * Covers: auth check, data gathering, JSON download format, error handling
 */

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { GET } from '@/app/api/user/data-export/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

describe('GET /api/user/data-export', () => {
  const mockUserData = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date('2025-01-01'),
    lastLoginAt: new Date('2026-02-20'),
    accounts: [{ id: 'acc-1', provider: 'google' }],
    authSessions: [{ id: 'sess-1' }],
    Enrollment: [{ id: 'enroll-1', courseId: 'course-1' }],
    courses: [{ id: 'course-1', title: 'My Course' }],
    Post: [{ id: 'post-1', title: 'My Post' }],
    Comment: [{ id: 'comment-1', text: 'A comment' }],
    Article: [],
    Blog: [],
  };

  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });
    (db.user.findUnique as jest.Mock).mockResolvedValue(mockUserData);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns JSON data with Content-Disposition header', async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');

    const disposition = res.headers.get('Content-Disposition');
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('taxomind-data-export');
    expect(disposition).toContain('user-1');
  });

  it('includes all required data sections in export', async () => {
    const res = await GET();
    const text = await res.text();
    const body = JSON.parse(text);

    expect(body.profile).toBeDefined();
    expect(body.profile.id).toBe('user-1');
    expect(body.profile.name).toBe('Test User');
    expect(body.profile.email).toBe('test@example.com');
    expect(body.accounts).toHaveLength(1);
    expect(body.enrollments).toHaveLength(1);
    expect(body.courses).toHaveLength(1);
    expect(body.posts).toHaveLength(1);
    expect(body.comments).toHaveLength(1);
    expect(body.articles).toEqual([]);
    expect(body.blogs).toEqual([]);
    expect(body.exportedAt).toBeDefined();
    expect(body.exportVersion).toBe('1.0');
  });

  it('handles user with no related data', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-2',
      name: 'Empty User',
      email: 'empty@example.com',
      createdAt: new Date('2025-06-01'),
      lastLoginAt: null,
      accounts: [],
      authSessions: [],
      Enrollment: [],
      courses: [],
      Post: [],
      Comment: [],
      Article: [],
      Blog: [],
    });

    const res = await GET();
    const text = await res.text();
    const body = JSON.parse(text);

    expect(res.status).toBe(200);
    expect(body.profile.name).toBe('Empty User');
    expect(body.accounts).toEqual([]);
    expect(body.enrollments).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    (db.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
