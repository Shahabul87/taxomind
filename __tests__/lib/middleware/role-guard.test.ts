/**
 * Tests for Role Guard Middleware - lib/middleware/role-guard.ts
 *
 * Covers: requireUser (auth, redirect), getDefaultDashboard, useUserType
 */

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// @/lib/auth is globally mocked

import { requireUser, getDefaultDashboard, useUserType } from '@/lib/middleware/role-guard';
import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

const mockCurrentUser = currentUser as jest.Mock;
const mockRedirect = redirect as jest.Mock;

describe('requireUser', () => {
  beforeEach(() => {
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  it('redirects to /auth/login when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    await expect(requireUser()).rejects.toThrow('NEXT_REDIRECT:/auth/login');
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });

  it('returns user when authenticated with no requirements', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test' });

    // requireTeacher is not set, so it should return user
    // But the current implementation always redirects if requireTeacher is true
    const user = await requireUser({});

    expect(user).toEqual({ id: 'user-1', name: 'Test' });
  });

  it('redirects to default dashboard when teacher is required', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test' });

    await expect(requireUser({ requireTeacher: true })).rejects.toThrow(
      'NEXT_REDIRECT:/dashboard/user'
    );
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard/user');
  });

  it('redirects to custom path when teacher required with redirectTo', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test' });

    await expect(
      requireUser({ requireTeacher: true, redirectTo: '/custom-path' })
    ).rejects.toThrow('NEXT_REDIRECT:/custom-path');
    expect(mockRedirect).toHaveBeenCalledWith('/custom-path');
  });
});

describe('getDefaultDashboard', () => {
  it('returns /dashboard/user', () => {
    expect(getDefaultDashboard()).toBe('/dashboard/user');
  });
});

describe('useUserType', () => {
  it('returns isAuthenticated and isTeacher functions', () => {
    const result = useUserType();

    expect(typeof result.isAuthenticated).toBe('function');
    expect(typeof result.isTeacher).toBe('function');
    expect(result.isAuthenticated()).toBe(true);
    expect(result.isTeacher()).toBe(false);
  });
});
