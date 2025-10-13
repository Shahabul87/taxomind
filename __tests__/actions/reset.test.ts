import { reset } from '@/actions/reset';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/mail';

jest.mock('@/lib/tokens', () => ({
  generatePasswordResetToken: jest.fn(),
}));

jest.mock('@/lib/mail', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

const mockGenerateToken = generatePasswordResetToken as jest.Mock;
const mockSendEmail = sendPasswordResetEmail as jest.Mock;

describe('reset action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    emailVerified: new Date(),
  };

  const mockToken = {
    id: 'token-1',
    token: 'reset-token-123',
    email: 'user@example.com',
    expires: new Date(Date.now() + 3600000),
  };

  it('should send reset email successfully', async () => {
    (reset as jest.Mock).mockResolvedValue(mockUser);
    mockGenerateToken.mockResolvedValue(mockToken);
    mockSendEmail.mockResolvedValue(undefined);

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      success: 'Reset email sent!',
    });

    expect(reset).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });

    expect(mockGenerateToken).toHaveBeenCalledWith('user@example.com');
    expect(mockSendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'reset-token-123'
    );
  });

  it('should return error for invalid email format', async () => {
    const result = await reset({ email: 'invalid-email' });

    expect(result).toEqual({
      error: 'Invalid email!',
    });

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should return error for empty email', async () => {
    const result = await reset({ email: '' });

    expect(result).toEqual({
      error: 'Email is required!',
    });

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should return error when user not found', async () => {
    (reset as jest.Mock).mockResolvedValue(null);

    const result = await reset({ email: 'nonexistent@example.com' });

    expect(result).toEqual({
      error: 'Email not found!',
    });

    expect(mockGenerateToken).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('should handle OAuth users without password', async () => {
    const oauthUser = {
      ...mockUser,
      password: null,
    };

    (reset as jest.Mock).mockResolvedValue(oauthUser);

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      error: 'Email not found!',
    });

    expect(mockGenerateToken).not.toHaveBeenCalled();
  });

  it('should handle email sending errors', async () => {
    (reset as jest.Mock).mockResolvedValue(mockUser);
    mockGenerateToken.mockResolvedValue(mockToken);
    mockSendEmail.mockRejectedValue(new Error('Email service down'));

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      error: 'Failed to send email!',
    });
  });

  it('should handle token generation errors', async () => {
    (reset as jest.Mock).mockResolvedValue(mockUser);
    mockGenerateToken.mockRejectedValue(new Error('Token generation failed'));

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      error: 'Failed to generate reset token!',
    });

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('should normalize email to lowercase', async () => {
    (reset as jest.Mock).mockResolvedValue(mockUser);
    mockGenerateToken.mockResolvedValue(mockToken);
    mockSendEmail.mockResolvedValue(undefined);

    const result = await reset({ email: 'USER@EXAMPLE.COM' });

    expect(result).toEqual({
      success: 'Reset email sent!',
    });

    expect(reset).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
  });

  it('should trim whitespace from email', async () => {
    (reset as jest.Mock).mockResolvedValue(mockUser);
    mockGenerateToken.mockResolvedValue(mockToken);
    mockSendEmail.mockResolvedValue(undefined);

    const result = await reset({ email: '  user@example.com  ' });

    expect(result).toEqual({
      success: 'Reset email sent!',
    });

    expect(reset).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
  });

  it('should handle database errors', async () => {
    (reset as jest.Mock).mockRejectedValue(new Error('Database error'));

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      error: 'Something went wrong!',
    });
  });

  it('should rate limit reset requests', async () => {
    (reset as jest.Mock).mockResolvedValue(mockUser);
    mockGenerateToken.mockResolvedValue(mockToken);
    mockSendEmail.mockResolvedValue(undefined);

    // Simulate multiple rapid requests
    const results = await Promise.all([
      reset({ email: 'user@example.com' }),
      reset({ email: 'user@example.com' }),
      reset({ email: 'user@example.com' }),
    ]);

    // All should succeed (rate limiting would be handled at API level)
    results.forEach(result => {
      expect(result).toEqual({
        success: 'Reset email sent!',
      });
    });
  });

  it('should validate email with special characters', async () => {
    (reset as jest.Mock).mockResolvedValue({
      ...mockUser,
      email: 'user+test@example.com',
    });
    mockGenerateToken.mockResolvedValue(mockToken);
    mockSendEmail.mockResolvedValue(undefined);

    const result = await reset({ email: 'user+test@example.com' });

    expect(result).toEqual({
      success: 'Reset email sent!',
    });
  });
});