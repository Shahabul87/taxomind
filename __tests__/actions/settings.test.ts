/**
 * Unit tests for actions/settings.ts
 *
 * Tests the settings server action which handles user profile updates,
 * email changes, password changes, 2FA toggling, and audit logging.
 */

// Ensure the real settings action module is loaded (not auto-mocked).
jest.unmock('@/actions/settings');

// Mock all dependencies that settings.ts imports.
jest.mock('@/lib/auth');
jest.mock('@/data/user');
jest.mock('@/lib/db');
jest.mock('@/schemas', () => ({
  SettingsSchema: {},
}));
jest.mock('@/lib/tokens');
jest.mock('@/lib/mail');
jest.mock('@/lib/passwordUtils');
jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    logPasswordChanged: jest.fn().mockResolvedValue(undefined),
    logTwoFactorEnabled: jest.fn().mockResolvedValue(undefined),
    logTwoFactorDisabled: jest.fn().mockResolvedValue(undefined),
    logSuspiciousActivity: jest.fn().mockResolvedValue(undefined),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { settings } from '@/actions/settings';
import { currentUser } from '@/lib/auth';
import { getUserByEmail, getUserById } from '@/data/user';
import { db } from '@/lib/db';
import { generateVerificationToken } from '@/lib/tokens';
import { sendVerificationEmail } from '@/lib/mail';
import { hashPassword, verifyPassword } from '@/lib/passwordUtils';
import { authAuditHelpers } from '@/lib/audit/auth-audit';

// ---------------------------------------------------------------------------
// Typed mock references
// ---------------------------------------------------------------------------

const mockCurrentUser = currentUser as jest.Mock;
const mockGetUserById = getUserById as jest.Mock;
const mockGetUserByEmail = getUserByEmail as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;
const mockGenerateVerificationToken = generateVerificationToken as jest.Mock;
const mockSendVerificationEmail = sendVerificationEmail as jest.Mock;
const mockHashPassword = hashPassword as jest.Mock;
const mockVerifyPassword = verifyPassword as jest.Mock;

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const mockSessionUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  isOAuth: false,
};

const mockDbUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed-existing-password',
  isTwoFactorEnabled: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('settings action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Sensible defaults -- each test overrides as needed.
    mockCurrentUser.mockResolvedValue(mockSessionUser);
    mockGetUserById.mockResolvedValue(mockDbUser);
    (mockDb.user.update as jest.Mock).mockResolvedValue({ id: mockDbUser.id });
  });

  // -----------------------------------------------------------------------
  // 1. Unauthorized - no user
  // -----------------------------------------------------------------------
  it('returns Unauthorized when no session user exists', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const result = await settings({ name: 'New Name' });

    expect(result).toEqual({ error: 'Unauthorized' });
    expect(mockGetUserById).not.toHaveBeenCalled();
    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 1b. Unauthorized - user object exists but id is missing
  // -----------------------------------------------------------------------
  it('returns Unauthorized when session user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ email: 'test@example.com' });

    const result = await settings({ name: 'New Name' });

    expect(result).toEqual({ error: 'Unauthorized' });
    expect(mockGetUserById).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 2. User not found in DB
  // -----------------------------------------------------------------------
  it('returns Unauthorized when user is not found in database', async () => {
    mockGetUserById.mockResolvedValue(null);

    const result = await settings({ name: 'New Name' });

    expect(result).toEqual({ error: 'Unauthorized' });
    expect(mockGetUserById).toHaveBeenCalledWith('user-123');
    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 3. OAuth user - email/password/2FA fields stripped
  // -----------------------------------------------------------------------
  it('strips email, password, newPassword, and isTwoFactorEnabled for OAuth users', async () => {
    const oauthUser = { ...mockSessionUser, isOAuth: true };
    mockCurrentUser.mockResolvedValue(oauthUser);

    const result = await settings({
      name: 'OAuth User',
      email: 'hacker@evil.com',
      password: 'shouldBeStripped',
      newPassword: 'shouldBeStripped',
      isTwoFactorEnabled: true,
    });

    expect(result).toEqual({ success: 'Settings Updated!' });

    // The db update should only contain the name -- email, password, and
    // isTwoFactorEnabled must have been cleared before building updateData.
    const updateCall = (mockDb.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data).toEqual({ name: 'OAuth User' });
    expect(updateCall.data).not.toHaveProperty('email');
    expect(updateCall.data).not.toHaveProperty('password');
    expect(updateCall.data).not.toHaveProperty('isTwoFactorEnabled');
  });

  // -----------------------------------------------------------------------
  // 4. Name update succeeds
  // -----------------------------------------------------------------------
  it('updates the user name successfully', async () => {
    const result = await settings({ name: 'Updated Name' });

    expect(result).toEqual({ success: 'Settings Updated!' });
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { name: 'Updated Name' },
    });
  });

  // -----------------------------------------------------------------------
  // 5. Email change - sends verification
  // -----------------------------------------------------------------------
  it('sends verification email when user changes their email', async () => {
    mockGetUserByEmail.mockResolvedValue(null);

    const mockToken = {
      email: 'new@example.com',
      token: 'verification-token-abc',
      expires: new Date(),
    };
    mockGenerateVerificationToken.mockResolvedValue(mockToken);

    const result = await settings({ email: 'new@example.com' });

    expect(result).toEqual({ success: 'Verification email sent!' });
    expect(mockGetUserByEmail).toHaveBeenCalledWith('new@example.com');
    expect(mockGenerateVerificationToken).toHaveBeenCalledWith('new@example.com');
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      'new@example.com',
      'verification-token-abc'
    );
    // The db.user.update should NOT be called -- the action returns early.
    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 6. Email change - duplicate email error
  // -----------------------------------------------------------------------
  it('returns error when new email is already in use by another user', async () => {
    mockGetUserByEmail.mockResolvedValue({
      id: 'other-user-456',
      email: 'taken@example.com',
    });

    const result = await settings({ email: 'taken@example.com' });

    expect(result).toEqual({ error: 'Email already in use!' });
    expect(mockGenerateVerificationToken).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 6b. Email same as current user email -- no change triggered
  // -----------------------------------------------------------------------
  it('does not trigger email change flow when email matches current user', async () => {
    const result = await settings({ email: 'test@example.com' });

    // values.email === user.email => branch is not entered
    expect(result).toEqual({ success: 'Settings Updated!' });
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 7. Password change - success
  // -----------------------------------------------------------------------
  it('updates password when current password is correct', async () => {
    mockVerifyPassword.mockResolvedValue(true);
    mockHashPassword.mockResolvedValue('new-hashed-password');

    const result = await settings({
      password: 'OldPassword1!',
      newPassword: 'NewPassword1!',
    });

    expect(result).toEqual({ success: 'Settings Updated!' });
    expect(mockVerifyPassword).toHaveBeenCalledWith(
      'OldPassword1!',
      'hashed-existing-password'
    );
    expect(mockHashPassword).toHaveBeenCalledWith('NewPassword1!');

    const updateCall = (mockDb.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.password).toBe('new-hashed-password');

    // Audit log for password change
    expect(authAuditHelpers.logPasswordChanged).toHaveBeenCalledWith(
      'user-123',
      'test@example.com',
      'settings'
    );
  });

  // -----------------------------------------------------------------------
  // 8. Password change - wrong current password (+ audit log)
  // -----------------------------------------------------------------------
  it('returns error and logs suspicious activity when current password is wrong', async () => {
    mockVerifyPassword.mockResolvedValue(false);

    const result = await settings({
      password: 'WrongPassword1!',
      newPassword: 'NewPassword1!',
    });

    expect(result).toEqual({ error: 'Incorrect password!' });
    expect(authAuditHelpers.logSuspiciousActivity).toHaveBeenCalledWith(
      'user-123',
      'test@example.com',
      'PASSWORD_CHANGE_FAILED',
      'Incorrect current password provided'
    );
    expect(mockHashPassword).not.toHaveBeenCalled();
    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 9. 2FA enable (+ audit log)
  // -----------------------------------------------------------------------
  it('enables two-factor authentication and logs the change', async () => {
    // dbUser starts with isTwoFactorEnabled: false
    const result = await settings({ isTwoFactorEnabled: true });

    expect(result).toEqual({ success: 'Settings Updated!' });

    const updateCall = (mockDb.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.isTwoFactorEnabled).toBe(true);

    expect(authAuditHelpers.logTwoFactorEnabled).toHaveBeenCalledWith(
      'user-123',
      'test@example.com'
    );
    expect(authAuditHelpers.logTwoFactorDisabled).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 10. 2FA disable (+ audit log)
  // -----------------------------------------------------------------------
  it('disables two-factor authentication and logs the change', async () => {
    const dbUserWith2FA = { ...mockDbUser, isTwoFactorEnabled: true };
    mockGetUserById.mockResolvedValue(dbUserWith2FA);

    const result = await settings({ isTwoFactorEnabled: false });

    expect(result).toEqual({ success: 'Settings Updated!' });

    const updateCall = (mockDb.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.isTwoFactorEnabled).toBe(false);

    expect(authAuditHelpers.logTwoFactorDisabled).toHaveBeenCalledWith(
      'user-123',
      'test@example.com'
    );
    expect(authAuditHelpers.logTwoFactorEnabled).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 10b. 2FA unchanged - no audit log
  // -----------------------------------------------------------------------
  it('does not log 2FA change when value matches existing setting', async () => {
    // dbUser already has isTwoFactorEnabled: false
    const result = await settings({ isTwoFactorEnabled: false });

    expect(result).toEqual({ success: 'Settings Updated!' });
    expect(authAuditHelpers.logTwoFactorEnabled).not.toHaveBeenCalled();
    expect(authAuditHelpers.logTwoFactorDisabled).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // 11. Profile fields update (bio, phone, location, website)
  // -----------------------------------------------------------------------
  it('updates profile fields: bio, phone, location, and website', async () => {
    const result = await settings({
      bio: 'A short biography.',
      phone: '+15551234567',
      location: 'San Francisco, CA',
      website: 'https://example.com',
    });

    expect(result).toEqual({ success: 'Settings Updated!' });

    const updateCall = (mockDb.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data).toEqual({
      bio: 'A short biography.',
      phone: '+15551234567',
      location: 'San Francisco, CA',
      website: 'https://example.com',
    });
  });

  // -----------------------------------------------------------------------
  // 11b. Profile fields with empty strings resolve to null
  // -----------------------------------------------------------------------
  it('converts empty profile field strings to null', async () => {
    const result = await settings({
      bio: '',
      phone: '',
      website: '',
      image: '',
    });

    expect(result).toEqual({ success: 'Settings Updated!' });

    const updateCall = (mockDb.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.bio).toBeNull();
    expect(updateCall.data.phone).toBeNull();
    expect(updateCall.data.website).toBeNull();
    expect(updateCall.data.image).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 12. Multiple fields updated at once
  // -----------------------------------------------------------------------
  it('updates multiple fields in a single call', async () => {
    mockVerifyPassword.mockResolvedValue(true);
    mockHashPassword.mockResolvedValue('new-hash-xyz');

    const result = await settings({
      name: 'Multi Update',
      password: 'OldPassword1!',
      newPassword: 'NewPassword1!',
      isTwoFactorEnabled: true,
      bio: 'Updated bio',
      location: 'New York',
      learningStyle: 'VISUAL',
    });

    expect(result).toEqual({ success: 'Settings Updated!' });

    const updateCall = (mockDb.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data).toEqual(
      expect.objectContaining({
        name: 'Multi Update',
        password: 'new-hash-xyz',
        isTwoFactorEnabled: true,
        bio: 'Updated bio',
        location: 'New York',
        learningStyle: 'VISUAL',
      })
    );

    // Both password change and 2FA enable should be audit-logged.
    expect(authAuditHelpers.logPasswordChanged).toHaveBeenCalledWith(
      'user-123',
      'test@example.com',
      'settings'
    );
    expect(authAuditHelpers.logTwoFactorEnabled).toHaveBeenCalledWith(
      'user-123',
      'test@example.com'
    );
  });

  // -----------------------------------------------------------------------
  // 13. Image and learningStyle are passed through correctly
  // -----------------------------------------------------------------------
  it('updates image URL and learningStyle', async () => {
    const result = await settings({
      image: 'https://cdn.example.com/avatar.png',
      learningStyle: 'KINESTHETIC',
    });

    expect(result).toEqual({ success: 'Settings Updated!' });

    const updateCall = (mockDb.user.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.image).toBe('https://cdn.example.com/avatar.png');
    expect(updateCall.data.learningStyle).toBe('KINESTHETIC');
  });

  // -----------------------------------------------------------------------
  // 14. Password fields without dbUser.password -- branch is skipped
  // -----------------------------------------------------------------------
  it('skips password verification when dbUser has no stored password', async () => {
    const dbUserNoPassword = { ...mockDbUser, password: null };
    mockGetUserById.mockResolvedValue(dbUserNoPassword);

    const result = await settings({
      password: 'SomePass1!',
      newPassword: 'NewPass1!',
    });

    // dbUser.password is null so the password-change branch is skipped.
    expect(result).toEqual({ success: 'Settings Updated!' });
    expect(mockVerifyPassword).not.toHaveBeenCalled();
    expect(mockHashPassword).not.toHaveBeenCalled();
  });
});
