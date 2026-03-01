jest.unmock('@/actions/logout');

import { logout } from '@/actions/logout';
import { signOut } from '@/auth';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { authAuditHelpers } from '@/lib/audit/auth-audit';

// Mocks are already set up in jest.setup.comprehensive.js
const mockSignOut = signOut as jest.Mock;
const mockCurrentUser = currentUser as jest.Mock;
const mockLogger = logger as unknown as { error: jest.Mock };
const mockAuditHelpers = authAuditHelpers as unknown as {
  logSignOut: jest.Mock;
  logSuspiciousActivity: jest.Mock;
};

describe('logout action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should logout successfully with authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockCurrentUser.mockResolvedValue(mockUser);
    mockSignOut.mockResolvedValue(undefined);
    mockAuditHelpers.logSignOut.mockResolvedValue(undefined);

    const result = await logout();

    expect(result).toEqual({ success: true });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(mockAuditHelpers.logSignOut).toHaveBeenCalledWith('user-123', 'test@example.com', false);
  });

  it('should logout successfully with forced flag', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockCurrentUser.mockResolvedValue(mockUser);
    mockSignOut.mockResolvedValue(undefined);
    mockAuditHelpers.logSignOut.mockResolvedValue(undefined);

    const result = await logout(true);

    expect(result).toEqual({ success: true });
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(mockAuditHelpers.logSignOut).toHaveBeenCalledWith('user-123', 'test@example.com', true);
  });

  it('should handle anonymous logout', async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockSignOut.mockResolvedValue(undefined);
    mockAuditHelpers.logSignOut.mockResolvedValue(undefined);

    const result = await logout();

    expect(result).toEqual({ success: true });
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(mockAuditHelpers.logSignOut).toHaveBeenCalledWith(undefined, undefined, false);
  });

  it('should handle signOut errors', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockCurrentUser.mockResolvedValue(mockUser);
    const error = new Error('Sign out failed');
    mockSignOut.mockRejectedValue(error);
    mockAuditHelpers.logSuspiciousActivity.mockResolvedValue(undefined);

    const result = await logout();

    expect(result).toEqual({ 
      success: false, 
      error: 'Sign out failed' 
    });
    expect(mockLogger.error).toHaveBeenCalledWith('Server action logout error:', error);
    expect(mockAuditHelpers.logSuspiciousActivity).toHaveBeenCalledWith(
      'user-123',
      'test@example.com',
      'LOGOUT_ERROR',
      'Logout failed: Sign out failed'
    );
  });

  it('should handle errors when currentUser fails during error handling', async () => {
    mockCurrentUser
      .mockResolvedValueOnce(null) // First call returns null (before signOut)
      .mockRejectedValueOnce(new Error('User fetch failed')); // Second call fails (during error handling)
    
    const error = new Error('Sign out failed');
    mockSignOut.mockRejectedValue(error);

    const result = await logout();

    expect(result).toEqual({ 
      success: false, 
      error: 'Sign out failed' 
    });
    expect(mockLogger.error).toHaveBeenCalledWith('Server action logout error:', error);
    // No suspicious activity logged since user fetch failed
    expect(mockAuditHelpers.logSuspiciousActivity).not.toHaveBeenCalled();
  });

  it('should handle non-Error exceptions', async () => {
    mockCurrentUser.mockResolvedValue(null);
    mockSignOut.mockRejectedValue('String error');

    const result = await logout();

    expect(result).toEqual({ 
      success: false, 
      error: 'Unknown error' 
    });
    expect(mockLogger.error).toHaveBeenCalledWith('Server action logout error:', 'String error');
  });
});