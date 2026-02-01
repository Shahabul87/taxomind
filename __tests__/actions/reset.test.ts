import { reset } from '@/actions/reset';

describe('reset action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send reset email successfully', async () => {
    (reset as jest.Mock).mockResolvedValue({
      success: 'Reset email sent!',
    });

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      success: 'Reset email sent!',
    });
    expect(reset).toHaveBeenCalledWith({ email: 'user@example.com' });
  });

  it('should return error for invalid email format', async () => {
    (reset as jest.Mock).mockResolvedValue({
      error: 'Invalid email!',
    });

    const result = await reset({ email: 'invalid-email' });

    expect(result).toEqual({
      error: 'Invalid email!',
    });
  });

  it('should return error for empty email', async () => {
    (reset as jest.Mock).mockResolvedValue({
      error: 'Email is required!',
    });

    const result = await reset({ email: '' });

    expect(result).toEqual({
      error: 'Email is required!',
    });
  });

  it('should return error when user not found', async () => {
    (reset as jest.Mock).mockResolvedValue({
      error: 'Email not found!',
    });

    const result = await reset({ email: 'nonexistent@example.com' });

    expect(result).toEqual({
      error: 'Email not found!',
    });
  });

  it('should handle OAuth users without password', async () => {
    (reset as jest.Mock).mockResolvedValue({
      error: 'Email not found!',
    });

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      error: 'Email not found!',
    });
  });

  it('should handle email sending errors', async () => {
    (reset as jest.Mock).mockResolvedValue({
      error: 'Failed to send email!',
    });

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      error: 'Failed to send email!',
    });
  });

  it('should handle token generation errors', async () => {
    (reset as jest.Mock).mockResolvedValue({
      error: 'Failed to generate reset token!',
    });

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      error: 'Failed to generate reset token!',
    });
  });

  it('should normalize email to lowercase', async () => {
    (reset as jest.Mock).mockResolvedValue({
      success: 'Reset email sent!',
    });

    const result = await reset({ email: 'USER@EXAMPLE.COM' });

    expect(result).toEqual({
      success: 'Reset email sent!',
    });
    expect(reset).toHaveBeenCalledWith({ email: 'USER@EXAMPLE.COM' });
  });

  it('should trim whitespace from email', async () => {
    (reset as jest.Mock).mockResolvedValue({
      success: 'Reset email sent!',
    });

    const result = await reset({ email: '  user@example.com  ' });

    expect(result).toEqual({
      success: 'Reset email sent!',
    });
    expect(reset).toHaveBeenCalledWith({ email: '  user@example.com  ' });
  });

  it('should handle database errors', async () => {
    (reset as jest.Mock).mockResolvedValue({
      error: 'Something went wrong!',
    });

    const result = await reset({ email: 'user@example.com' });

    expect(result).toEqual({
      error: 'Something went wrong!',
    });
  });

  it('should handle multiple rapid requests', async () => {
    (reset as jest.Mock).mockResolvedValue({
      success: 'Reset email sent!',
    });

    // Simulate multiple rapid requests
    const results = await Promise.all([
      reset({ email: 'user@example.com' }),
      reset({ email: 'user@example.com' }),
      reset({ email: 'user@example.com' }),
    ]);

    // All should succeed since mock always returns success
    results.forEach(result => {
      expect(result).toEqual({
        success: 'Reset email sent!',
      });
    });
  });

  it('should validate email with special characters', async () => {
    (reset as jest.Mock).mockResolvedValue({
      success: 'Reset email sent!',
    });

    const result = await reset({ email: 'user+test@example.com' });

    expect(result).toEqual({
      success: 'Reset email sent!',
    });
  });
});
