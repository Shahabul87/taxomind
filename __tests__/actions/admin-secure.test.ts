import { isAdminSecure } from '@/actions/admin-secure';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.Mock;

describe('isAdminSecure action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for verified admin user', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
    });

    (isAdminSecure as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      email: 'admin@example.com',
      emailVerified: new Date(),
      isTwoFactorEnabled: true,
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

    expect(isAdminSecure).toHaveBeenCalledWith({
      where: { id: 'admin-1' },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        isTwoFactorEnabled: true,
      },
    });
  });

  it('should return false for non-admin user', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-1',
        role: 'USER',
        email: 'user@example.com',
      },
    });

    (isAdminSecure as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'USER',
      email: 'user@example.com',
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('should return false when no session exists', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should return false when user not found in database', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'ADMIN',
        email: 'admin@example.com',
      },
    });

    (isAdminSecure as jest.Mock).mockResolvedValue(null);

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('should return false when database role differs from session role', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-1',
        role: 'ADMIN', // Session says admin
      },
    });

    (isAdminSecure as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'USER', // Database says user
      email: 'user@example.com',
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'ADMIN',
      },
    });

    (isAdminSecure as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(isAdminSecure()).rejects.toThrow('Database error');
  });

  it('should validate email verification status', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'ADMIN',
      },
    });

    (isAdminSecure as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      email: 'admin@example.com',
      emailVerified: null, // Not verified
      isTwoFactorEnabled: false,
    });

    const result = await isAdminSecure();

    expect(result.user?.emailVerified).toBeNull();
  });

  it('should check two-factor authentication status', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'admin-1',
        role: 'ADMIN',
      },
    });

    (isAdminSecure as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      role: 'ADMIN',
      email: 'admin@example.com',
      emailVerified: new Date(),
      isTwoFactorEnabled: true,
    });

    const result = await isAdminSecure();

    expect(result.user?.isTwoFactorEnabled).toBe(true);
  });

  it('should return false for invalid session structure', async () => {
    mockAuth.mockResolvedValue({
      // Missing user property
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('should handle missing user id in session', async () => {
    mockAuth.mockResolvedValue({
      user: {
        // Missing id
        role: 'ADMIN',
      },
    });

    const result = await isAdminSecure();

    expect(result).toEqual({
      isAdmin: false,
      user: null,
    });
  });
});