import { newPassword } from '@/actions/new-password';

describe('newPassword action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reset password successfully with valid token', async () => {
    (newPassword as jest.Mock).mockResolvedValue({
      success: 'Password updated!',
    });

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'valid-token-123');

    expect(result).toEqual({
      success: 'Password updated!',
    });
    expect(newPassword).toHaveBeenCalledWith(
      { password: 'newPassword123!' },
      'valid-token-123'
    );
  });

  it('should return error for missing token', async () => {
    (newPassword as jest.Mock).mockResolvedValue({
      error: 'Missing token!',
    });

    const result = await newPassword({
      password: 'newPassword123!',
    }, '');

    expect(result).toEqual({
      error: 'Missing token!',
    });
  });

  it('should return error for invalid token', async () => {
    (newPassword as jest.Mock).mockResolvedValue({
      error: 'Invalid token!',
    });

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'invalid-token');

    expect(result).toEqual({
      error: 'Invalid token!',
    });
  });

  it('should return error for expired token', async () => {
    (newPassword as jest.Mock).mockResolvedValue({
      error: 'Token has expired!',
    });

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'expired-token');

    expect(result).toEqual({
      error: 'Token has expired!',
    });
  });

  it('should return error when user not found', async () => {
    (newPassword as jest.Mock).mockResolvedValue({
      error: 'Email does not exist!',
    });

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'valid-token-123');

    expect(result).toEqual({
      error: 'Email does not exist!',
    });
  });

  it('should validate password requirements', async () => {
    (newPassword as jest.Mock).mockResolvedValue({
      error: 'Minimum 8 characters required!',
    });

    const result = await newPassword({
      password: '123', // Too short
    }, 'valid-token-123');

    expect(result).toEqual({
      error: 'Minimum 8 characters required!',
    });
  });

  it('should handle bcrypt hashing errors', async () => {
    (newPassword as jest.Mock).mockRejectedValue(new Error('Hashing failed'));

    await expect(
      newPassword({
        password: 'newPassword123!',
      }, 'valid-token-123')
    ).rejects.toThrow('Hashing failed');
  });

  it('should handle database update errors', async () => {
    (newPassword as jest.Mock).mockRejectedValue(new Error('Update failed'));

    await expect(
      newPassword({
        password: 'newPassword123!',
      }, 'valid-token-123')
    ).rejects.toThrow('Update failed');
  });

  it('should clean up token even if delete fails', async () => {
    (newPassword as jest.Mock).mockResolvedValue({
      success: 'Password updated!',
    });

    const result = await newPassword({
      password: 'newPassword123!',
    }, 'valid-token-123');

    // Should still succeed even if token deletion fails
    expect(result).toEqual({
      success: 'Password updated!',
    });
  });

  it('should handle special characters in password', async () => {
    (newPassword as jest.Mock).mockResolvedValue({
      success: 'Password updated!',
    });

    const result = await newPassword({
      password: 'P@ssw0rd!#$%^&*()',
    }, 'valid-token-123');

    expect(result).toEqual({
      success: 'Password updated!',
    });
    expect(newPassword).toHaveBeenCalledWith(
      { password: 'P@ssw0rd!#$%^&*()' },
      'valid-token-123'
    );
  });
});
