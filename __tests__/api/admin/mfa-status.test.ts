/**
 * Tests for Admin MFA Status Route - app/api/admin/mfa-status/route.ts
 *
 * Covers: GET (fetch MFA enforcement status for admin)
 * Auth: Uses currentUser() from @/lib/auth
 */

jest.mock('@/lib/auth/mfa-enforcement', () => ({
  getAdminMFAInfo: jest.fn(),
}));

// @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { GET } from '@/app/api/admin/mfa-status/route';
import { currentUser } from '@/lib/auth';
import { getAdminMFAInfo } from '@/lib/auth/mfa-enforcement';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetAdminMFAInfo = getAdminMFAInfo as jest.Mock;

// =========================================================================
// GET /api/admin/mfa-status
// =========================================================================
describe('GET /api/admin/mfa-status', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'ADMIN',
    });
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 for non-admin user', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      role: 'USER',
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns MFA enforcement status', async () => {
    mockGetAdminMFAInfo.mockResolvedValue({
      mfaEnforcementStatus: {
        daysUntilEnforcement: 14,
        warningPeriodActive: true,
        enforcementLevel: 'WARNING',
        message: 'MFA will be required in 14 days',
      },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.daysUntilEnforcement).toBe(14);
    expect(body.warningPeriodActive).toBe(true);
    expect(body.enforcementLevel).toBe('WARNING');
    expect(body.message).toContain('MFA will be required');
  });

  it('returns 404 when MFA info not found', async () => {
    mockGetAdminMFAInfo.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('returns enforcement when MFA is enforced', async () => {
    mockGetAdminMFAInfo.mockResolvedValue({
      mfaEnforcementStatus: {
        daysUntilEnforcement: 0,
        warningPeriodActive: false,
        enforcementLevel: 'ENFORCED',
        message: 'MFA is required for all admin accounts',
      },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.enforcementLevel).toBe('ENFORCED');
    expect(body.daysUntilEnforcement).toBe(0);
  });

  it('returns 500 on error', async () => {
    mockGetAdminMFAInfo.mockRejectedValue(new Error('Service error'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
