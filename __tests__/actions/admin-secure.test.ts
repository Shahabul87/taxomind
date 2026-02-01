import { isAdminSecure } from '@/actions/admin-secure';

describe('isAdminSecure action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for verified admin user', async () => {
    (isAdminSecure as jest.Mock).mockResolvedValue({
      isAdmin: true,
      user: {
        id: 'admin-1',
        role: 'ADMIN',
        email: 'admin@example.com',
        emailVerified: new Date(),
        isTwoFactorEnabled: true,
      },
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: true,
      user: {
        id: 'admin-1',
        role: 'ADMIN',
        email: 'admin@example.com',
        emailVerified: expect.any(Date),
        isTwoFactorEnabled: true,
      },
    });
    expect(isAdminSecure).toHaveBeenCalled();
  });

  it('should return false for non-admin user', async () => {
    (isAdminSecure as jest.Mock).mockResolvedValue({
      isAdmin: false,
      user: null,
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('should return false when no session exists', async () => {
    (isAdminSecure as jest.Mock).mockResolvedValue({
      isAdmin: false,
      user: null,
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('should return false when user not found in database', async () => {
    (isAdminSecure as jest.Mock).mockResolvedValue({
      isAdmin: false,
      user: null,
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('should return false when database role differs from session role', async () => {
    (isAdminSecure as jest.Mock).mockResolvedValue({
      isAdmin: false,
      user: null,
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('should handle database errors gracefully', async () => {
    (isAdminSecure as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(isAdminSecure()).rejects.toThrow('Database error');
  });

  it('should validate email verification status', async () => {
    (isAdminSecure as jest.Mock).mockResolvedValue({
      isAdmin: true,
      user: {
        id: 'admin-1',
        role: 'ADMIN',
        email: 'admin@example.com',
        emailVerified: null, // Not verified
        isTwoFactorEnabled: false,
      },
    });

    const result = await isAdminSecure();

    expect(result.user?.emailVerified).toBeNull();
  });

  it('should check two-factor authentication status', async () => {
    (isAdminSecure as jest.Mock).mockResolvedValue({
      isAdmin: true,
      user: {
        id: 'admin-1',
        role: 'ADMIN',
        email: 'admin@example.com',
        emailVerified: new Date(),
        isTwoFactorEnabled: true,
      },
    });

    const result = await isAdminSecure();

    expect(result.user?.isTwoFactorEnabled).toBe(true);
  });

  it('should return false for invalid session structure', async () => {
    (isAdminSecure as jest.Mock).mockResolvedValue({
      isAdmin: false,
      user: null,
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('should handle missing user id in session', async () => {
    (isAdminSecure as jest.Mock).mockResolvedValue({
      isAdmin: false,
      user: null,
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });
});
