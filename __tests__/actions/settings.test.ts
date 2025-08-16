import { settings } from '@/actions/settings';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { prismaMock } from '../utils/test-db';
import bcrypt from 'bcryptjs';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/mail';

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('@/lib/tokens', () => ({
  generateVerificationToken: jest.fn(),
}));

jest.mock('@/lib/mail', () => ({
  sendVerificationEmail: jest.fn(),
}));

const mockAuth = auth as jest.Mock;
const mockBcryptCompare = bcrypt.compare as jest.Mock;
const mockBcryptHash = bcrypt.hash as jest.Mock;
const mockGenerateToken = generateVerificationToken as jest.Mock;
const mockSendEmail = sendVerificationEmail as jest.Mock;

describe('settings action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    password: 'hashed-password',
    isTwoFactorEnabled: false,
    role: 'USER',
  };

  const mockSession = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
    },
  };

  it('should update user name successfully', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      name: 'New Name',
    });

    const result = await settings({
      name: 'New Name',
      role: 'USER',
    });

    expect(result).toEqual({
      success: 'Settings Updated!',
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'New Name' },
    });
  });

  it('should update email and send verification', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.user.findUnique.mockResolvedValueOnce(null); // New email not taken
    mockGenerateToken.mockResolvedValue({
      token: 'verification-token',
      email: 'newemail@example.com',
    });
    mockSendEmail.mockResolvedValue(undefined);
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      email: 'newemail@example.com',
    });

    const result = await settings({
      email: 'newemail@example.com',
      role: 'USER',
    });

    expect(result).toEqual({
      success: 'Verification email sent!',
    });

    expect(mockGenerateToken).toHaveBeenCalledWith('newemail@example.com');
    expect(mockSendEmail).toHaveBeenCalledWith(
      'newemail@example.com',
      'verification-token'
    );
  });

  it('should return error when email already in use', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-2',
      email: 'newemail@example.com',
    });

    const result = await settings({
      email: 'newemail@example.com',
      role: 'USER',
    });

    expect(result).toEqual({
      error: 'Email already in use!',
    });

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('should update password with old password verification', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(true);
    mockBcryptHash.mockResolvedValue('new-hashed-password');
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      password: 'new-hashed-password',
    });

    const result = await settings({
      password: 'newPassword123',
      newPassword: 'newPassword123',
      role: 'USER',
    });

    expect(result).toEqual({
      success: 'Settings Updated!',
    });

    expect(mockBcryptCompare).toHaveBeenCalledWith(
      'newPassword123',
      'hashed-password'
    );
    expect(mockBcryptHash).toHaveBeenCalledWith('newPassword123', 10);
  });

  it('should return error for incorrect old password', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    mockBcryptCompare.mockResolvedValue(false);

    const result = await settings({
      password: 'wrongPassword',
      newPassword: 'newPassword123',
      role: 'USER',
    });

    expect(result).toEqual({
      error: 'Incorrect password!',
    });

    expect(mockBcryptHash).not.toHaveBeenCalled();
  });

  it('should update two-factor authentication setting', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      isTwoFactorEnabled: true,
    });

    const result = await settings({
      isTwoFactorEnabled: true,
      role: 'USER',
    });

    expect(result).toEqual({
      success: 'Settings Updated!',
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { isTwoFactorEnabled: true },
    });
  });

  it('should not update role for non-admin users', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue(mockUser);

    const result = await settings({
      role: 'ADMIN', // Trying to make themselves admin
    });

    expect(result).toEqual({
      success: 'Settings Updated!',
    });

    // Role should not be in the update data
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {},
    });
  });

  it('should handle OAuth users without password', async () => {
    const oauthUser = {
      ...mockUser,
      password: null,
    };

    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(oauthUser);
    mockBcryptHash.mockResolvedValue('new-password-hash');
    prismaMock.user.update.mockResolvedValue({
      ...oauthUser,
      password: 'new-password-hash',
    });

    const result = await settings({
      password: undefined,
      newPassword: 'newPassword123',
      role: 'USER',
    });

    expect(result).toEqual({
      success: 'Settings Updated!',
    });

    // Should not check old password for OAuth users
    expect(mockBcryptCompare).not.toHaveBeenCalled();
    expect(mockBcryptHash).toHaveBeenCalledWith('newPassword123', 10);
  });

  it('should return error when user not found', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await settings({
      name: 'New Name',
      role: 'USER',
    });

    expect(result).toEqual({
      error: 'Unauthorized',
    });
  });

  it('should return error when session not found', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await settings({
      name: 'New Name',
      role: 'USER',
    });

    expect(result).toEqual({
      error: 'Unauthorized',
    });
  });

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockRejectedValue(new Error('Database error'));

    await expect(
      settings({ name: 'New Name' })
    ).rejects.toThrow('Database error');
  });

  it('should update multiple fields at once', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue({
      ...mockUser,
      name: 'New Name',
      isTwoFactorEnabled: true,
    });

    const result = await settings({
      name: 'New Name',
      isTwoFactorEnabled: true,
      role: 'USER',
    });

    expect(result).toEqual({
      success: 'Settings Updated!',
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        name: 'New Name',
        isTwoFactorEnabled: true,
      },
    });
  });

  it('should validate password minimum length', async () => {
    mockAuth.mockResolvedValue(mockSession);
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const result = await settings({
      newPassword: '123', // Too short
    });

    expect(result).toEqual({
      error: 'Minimum 6 characters required',
    });

    expect(mockBcryptHash).not.toHaveBeenCalled();
  });
});