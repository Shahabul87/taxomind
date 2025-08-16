import { newPassword } from '@/actions/new-password';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

const mockBcryptHash = bcrypt.hash as jest.Mock;

describe('newPassword action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockToken = {
    id: 'token-1',
    token: 'valid-token-123',
    email: 'user@example.com',
    expires: new Date(Date.now() + 3600000), // 1 hour from now
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    password: 'old-hashed-password',
    emailVerified: new Date(),
  };

  it('should reset password successfully with valid token', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptHash.mockResolvedValue('new-hashed-password');
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      password: 'new-hashed-password',
    });
    prismaMock.passwordResetToken.delete.mockResolvedValue(mockToken);

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'valid-token-123');

    expect(result).toEqual({
      success: 'Password updated!',
    });

    expect(prismaMock.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'valid-token-123' },
    });

    expect(mockBcryptHash).toHaveBeenCalledWith('newPassword123!', 10);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: 'new-hashed-password' },
    });

    expect(prismaMock.passwordResetToken.delete).toHaveBeenCalledWith({
      where: { id: 'token-1' },
    });
  });

  it('should return error for missing token', async () => {
    const result = await newPassword({
      password: 'newPassword123!',
    }, '');

    expect(result).toEqual({
      error: 'Missing token!',
    });

    expect(prismaMock.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it('should return error for invalid token', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'invalid-token');

    expect(result).toEqual({
      error: 'Invalid token!',
    });
  });

  it('should return error for expired token', async () => {
    const expiredToken = {
      ...mockToken,
      expires: new Date(Date.now() - 3600000), // 1 hour ago
    };

    prismaMock.passwordResetToken.findUnique.mockResolvedValue(expiredToken);

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'expired-token');

    expect(result).toEqual({
      error: 'Token has expired!',
    });
  });

  it('should return error when user not found', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'valid-token-123');

    expect(result).toEqual({
      error: 'Email does not exist!',
    });
  });

  it('should validate password requirements', async () => {
    const result = await newPassword({
      password: '123', // Too short
    }, 'valid-token-123');

    expect(result).toEqual({
      error: 'Minimum 8 characters required!',
    });
  });

  it('should handle bcrypt hashing errors', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptHash.mockRejectedValue(new Error('Hashing failed'));

    await expect(
      newPassword({
        password: 'newPassword123!',
      }, 'valid-token-123')
    ).rejects.toThrow('Hashing failed');
  });

  it('should handle database update errors', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptHash.mockResolvedValue('new-hashed-password');
    prismaMock.user.update.mockRejectedValue(new Error('Update failed'));

    await expect(
      newPassword({
        password: 'newPassword123!',
      }, 'valid-token-123')
    ).rejects.toThrow('Update failed');
  });

  it('should clean up token even if delete fails', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptHash.mockResolvedValue('new-hashed-password');
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      password: 'new-hashed-password',
    });
    prismaMock.passwordResetToken.delete.mockRejectedValue(new Error('Delete failed'));

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'valid-token-123');

    // Should still succeed even if token deletion fails
    expect(result).toEqual({
      success: 'Password updated!',
    });
  });

  it('should handle special characters in password', async () => {
    prismaMock.passwordResetToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptHash.mockResolvedValue('special-chars-hashed');
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      password: 'special-chars-hashed',
    });
    prismaMock.passwordResetToken.delete.mockResolvedValue(mockToken);

    const result = await newPassword({
      password: 'P@ssw0rd!#$%^&*()',
    }, 'valid-token-123');

    expect(result).toEqual({
      success: 'Password updated!',
    });
    expect(mockBcryptHash).toHaveBeenCalledWith('P@ssw0rd!#$%^&*()', 10);
  });
});