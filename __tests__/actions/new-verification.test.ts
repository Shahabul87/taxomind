import { newVerification } from '@/actions/new-verification';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';

describe('newVerification action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockToken = {
    id: 'token-1',
    token: 'valid-verification-token',
    email: 'user@example.com',
    expires: new Date(Date.now() + 3600000), // 1 hour from now
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    emailVerified: null,
  };

  it('should verify email successfully with valid token', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      emailVerified: new Date(),
      email: 'user@example.com',
    });
    prismaMock.verificationToken.delete.mockResolvedValue(mockToken);

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      success: 'Email verified!',
    });

    expect(prismaMock.verificationToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'valid-verification-token' },
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        emailVerified: expect.any(Date),
        email: 'user@example.com',
      },
    });

    expect(prismaMock.verificationToken.delete).toHaveBeenCalledWith({
      where: { id: 'token-1' },
    });
  });

  it('should return error for missing token', async () => {
    const result = await newVerification('');

    expect(result).toEqual({
      error: 'Token does not exist!',
    });

    expect(prismaMock.verificationToken.findUnique).not.toHaveBeenCalled();
  });

  it('should return error for invalid token', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(null);

    const result = await newVerification('invalid-token');

    expect(result).toEqual({
      error: 'Token does not exist!',
    });
  });

  it('should return error for expired token', async () => {
    const expiredToken = {
      ...mockToken,
      expires: new Date(Date.now() - 3600000), // 1 hour ago
    };

    prismaMock.verificationToken.findUnique.mockResolvedValue(expiredToken);

    const result = await newVerification('expired-token');

    expect(result).toEqual({
      error: 'Token has expired!',
    });
  });

  it('should return error when user not found', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      error: 'Email does not exist!',
    });
  });

  it('should update email if token has new email', async () => {
    const tokenWithNewEmail = {
      ...mockToken,
      email: 'newemail@example.com',
    };

    prismaMock.verificationToken.findUnique.mockResolvedValue(tokenWithNewEmail);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      emailVerified: new Date(),
      email: 'newemail@example.com',
    });
    prismaMock.verificationToken.delete.mockResolvedValue(tokenWithNewEmail);

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      success: 'Email verified!',
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        emailVerified: expect.any(Date),
        email: 'newemail@example.com',
      },
    });
  });

  it('should handle already verified email', async () => {
    const verifiedUser = {
      ...mockUser,
      emailVerified: new Date('2024-01-01'),
    };

    prismaMock.verificationToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(verifiedUser);
    prismaMock.user.update.mockResolvedValue({
      ...verifiedUser,
      emailVerified: new Date(),
    });
    prismaMock.verificationToken.delete.mockResolvedValue(mockToken);

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      success: 'Email verified!',
    });

    // Should still update emailVerified timestamp
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('should handle database update errors', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockRejectedValue(new Error('Update failed'));

    await expect(
      newVerification('valid-verification-token')
    ).rejects.toThrow('Update failed');
  });

  it('should clean up token even if delete fails', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      emailVerified: new Date(),
    });
    prismaMock.verificationToken.delete.mockRejectedValue(new Error('Delete failed'));

    const result = await newVerification('valid-verification-token');

    // Should still succeed even if token deletion fails
    expect(result).toEqual({
      success: 'Email verified!',
    });
  });

  it('should handle case-insensitive email matching', async () => {
    const tokenUpperCase = {
      ...mockToken,
      email: 'USER@EXAMPLE.COM',
    };

    prismaMock.verificationToken.findUnique.mockResolvedValue(tokenUpperCase);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      emailVerified: new Date(),
    });
    prismaMock.verificationToken.delete.mockResolvedValue(tokenUpperCase);

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      success: 'Email verified!',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'USER@EXAMPLE.COM' },
    });
  });

  it('should handle concurrent verification attempts', async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(mockToken);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      emailVerified: new Date(),
    });
    prismaMock.verificationToken.delete.mockResolvedValue(mockToken);

    // Simulate concurrent calls
    const results = await Promise.all([
      newVerification('valid-verification-token'),
      newVerification('valid-verification-token'),
    ]);

    // At least one should succeed
    expect(results.some(r => r.success === 'Email verified!')).toBe(true);
  });
});