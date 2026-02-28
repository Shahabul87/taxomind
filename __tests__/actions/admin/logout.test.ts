jest.unmock('@/actions/admin/logout');

jest.mock('@/auth.admin', () => ({
  adminSignOut: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

import { adminLogout, adminLogoutAndRedirect } from '@/actions/admin/logout';
import { adminSignOut } from '@/auth.admin';
import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';

const mockAdminSignOut = adminSignOut as jest.Mock;
const mockLogger = logger as unknown as {
  info: jest.Mock;
  error: jest.Mock;
};
const mockRedirect = redirect as jest.Mock;

describe('admin logout actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminSignOut.mockResolvedValue(undefined);
    mockRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  it('adminLogout signs out successfully', async () => {
    const result = await adminLogout();

    expect(mockAdminSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(mockLogger.info).toHaveBeenCalledWith('Admin logout successful');
    expect(result).toEqual({ success: true });
  });

  it('adminLogout returns error response when signout fails', async () => {
    mockAdminSignOut.mockRejectedValue(new Error('signout failed'));

    const result = await adminLogout();

    expect(result).toEqual({
      success: false,
      error: 'signout failed',
    });
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('adminLogoutAndRedirect redirects to admin login after signout', async () => {
    await expect(adminLogoutAndRedirect()).rejects.toThrow('NEXT_REDIRECT');

    expect(mockAdminSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(mockRedirect).toHaveBeenCalledWith('/admin/auth/login');
  });

  it('adminLogoutAndRedirect still redirects when signout throws', async () => {
    mockAdminSignOut.mockRejectedValue(new Error('signout failed'));

    await expect(adminLogoutAndRedirect()).rejects.toThrow('NEXT_REDIRECT');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Admin logout error:',
      expect.any(Error),
    );
    expect(mockRedirect).toHaveBeenCalledWith('/admin/auth/login');
  });
});
