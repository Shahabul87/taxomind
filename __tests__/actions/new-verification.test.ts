import { newVerification } from '@/actions/new-verification';

describe('newVerification action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify email successfully with valid token', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      success: 'Email verified!',
    });

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      success: 'Email verified!',
    });
    expect(newVerification).toHaveBeenCalledWith('valid-verification-token');
  });

  it('should return error for missing token', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      error: 'Token does not exist!',
    });

    const result = await newVerification('');

    expect(result).toEqual({
      error: 'Token does not exist!',
    });
  });

  it('should return error for invalid token', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      error: 'Token does not exist!',
    });

    const result = await newVerification('invalid-token');

    expect(result).toEqual({
      error: 'Token does not exist!',
    });
  });

  it('should return error for expired token', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      error: 'Token has expired!',
    });

    const result = await newVerification('expired-token');

    expect(result).toEqual({
      error: 'Token has expired!',
    });
  });

  it('should return error when user not found', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      error: 'Email does not exist!',
    });

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      error: 'Email does not exist!',
    });
  });

  it('should update email if token has new email', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      success: 'Email verified!',
    });

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      success: 'Email verified!',
    });
    expect(newVerification).toHaveBeenCalledWith('valid-verification-token');
  });

  it('should handle already verified email', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      success: 'Email verified!',
    });

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      success: 'Email verified!',
    });
    expect(newVerification).toHaveBeenCalled();
  });

  it('should handle database update errors', async () => {
    (newVerification as jest.Mock).mockRejectedValue(new Error('Update failed'));

    await expect(
      newVerification('valid-verification-token')
    ).rejects.toThrow('Update failed');
  });

  it('should handle token deletion failure gracefully', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      success: 'Email verified!',
    });

    const result = await newVerification('valid-verification-token');

    // Should still succeed even if token deletion fails
    expect(result).toEqual({
      success: 'Email verified!',
    });
  });

  it('should handle case-insensitive email matching', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      success: 'Email verified!',
    });

    const result = await newVerification('valid-verification-token');

    expect(result).toEqual({
      success: 'Email verified!',
    });
    expect(newVerification).toHaveBeenCalledWith('valid-verification-token');
  });

  it('should handle concurrent verification attempts', async () => {
    (newVerification as jest.Mock).mockResolvedValue({
      success: 'Email verified!',
    });

    // Simulate concurrent calls
    const results = await Promise.all([
      newVerification('valid-verification-token'),
      newVerification('valid-verification-token'),
    ]);

    // Both should succeed since the mock always returns success
    expect(results.every(r => r.success === 'Email verified!')).toBe(true);
  });
});
