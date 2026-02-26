/**
 * Unit tests for actions/mfa-totp.ts
 *
 * Tests the five TOTP server actions:
 *   1. setupTOTP      - Initiate TOTP enrollment
 *   2. verifyTOTP     - Verify 6-digit token to enable TOTP
 *   3. disableTOTP    - Disable TOTP via token or recovery code
 *   4. regenerateRecoveryCodes - Generate fresh recovery codes
 *   5. getTOTPStatus  - Return current TOTP status
 *
 * Dependencies (@/auth, @/lib/db, @/lib/auth/totp, @/lib/logger) are
 * globally mocked via jest.setup.js. Each test overrides return values
 * as needed.
 */

// @/auth, @/lib/db, @/lib/auth/totp, @/lib/logger are globally mocked

import {
  setupTOTP,
  verifyTOTP,
  disableTOTP,
  regenerateRecoveryCodes,
  getTOTPStatus,
} from '@/actions/mfa-totp';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  createTOTPSetup,
  validateTOTPSetup,
  encryptTOTPSecret,
  encryptRecoveryCodes,
  decryptTOTPSecret,
  verifyTOTPToken,
  generateRecoveryCodes,
  verifyRecoveryCode,
} from '@/lib/auth/totp';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Typed mock references
// ---------------------------------------------------------------------------

const mockAuth = auth as jest.Mock;
const mockCreateTOTPSetup = createTOTPSetup as jest.Mock;
const mockValidateTOTPSetup = validateTOTPSetup as jest.Mock;
const mockEncryptTOTPSecret = encryptTOTPSecret as jest.Mock;
const mockEncryptRecoveryCodes = encryptRecoveryCodes as jest.Mock;
const mockDecryptTOTPSecret = decryptTOTPSecret as jest.Mock;
const mockVerifyTOTPToken = verifyTOTPToken as jest.Mock;
const mockGenerateRecoveryCodes = generateRecoveryCodes as jest.Mock;
const mockVerifyRecoveryCode = verifyRecoveryCode as jest.Mock;
const mockDbUserFindUnique = db.user.findUnique as jest.Mock;
const mockDbUserUpdate = db.user.update as jest.Mock;

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MOCK_USER_ID = 'user-totp-1';
const MOCK_USER_EMAIL = 'totp@example.com';

const authenticatedSession = {
  user: { id: MOCK_USER_ID, email: MOCK_USER_EMAIL },
};

const mockTOTPSetupData = {
  secret: 'JBSWY3DPEHPK3PXP',
  qrCodeUrl: 'data:image/png;base64,mockQR',
  backupCodes: [
    'AAAA-BBBB-CCCC-0001',
    'AAAA-BBBB-CCCC-0002',
    'AAAA-BBBB-CCCC-0003',
    'AAAA-BBBB-CCCC-0004',
    'AAAA-BBBB-CCCC-0005',
    'AAAA-BBBB-CCCC-0006',
    'AAAA-BBBB-CCCC-0007',
    'AAAA-BBBB-CCCC-0008',
    'AAAA-BBBB-CCCC-0009',
    'AAAA-BBBB-CCCC-0010',
  ],
};

// ---------------------------------------------------------------------------
// 1. setupTOTP
// ---------------------------------------------------------------------------

describe('setupTOTP', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Defaults: authenticated user, no prior TOTP
    mockAuth.mockResolvedValue(authenticatedSession);

    mockDbUserFindUnique.mockResolvedValue({
      totpEnabled: false,
      totpVerified: false,
      totpSecret: null,
    });

    mockCreateTOTPSetup.mockResolvedValue(mockTOTPSetupData);
    mockValidateTOTPSetup.mockReturnValue({ isValid: true, errors: [] });
    mockEncryptTOTPSecret.mockResolvedValue('encrypted-secret');
    mockEncryptRecoveryCodes.mockResolvedValue(['enc-code-1', 'enc-code-2']);
    mockDbUserUpdate.mockResolvedValue({});
  });

  it('returns error when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await setupTOTP({});

    expect(result).toEqual({ error: 'Unauthorized - Please log in first' });
    expect(mockDbUserFindUnique).not.toHaveBeenCalled();
  });

  it('returns error when session has no email', async () => {
    mockAuth.mockResolvedValue({ user: { id: MOCK_USER_ID } });

    const result = await setupTOTP({});

    expect(result).toEqual({ error: 'Unauthorized - Please log in first' });
  });

  it('returns error when user is not found in database', async () => {
    mockDbUserFindUnique.mockResolvedValue(null);

    const result = await setupTOTP({});

    expect(result).toEqual({ error: 'User not found' });
  });

  it('returns error when TOTP is already enabled and verified', async () => {
    mockDbUserFindUnique.mockResolvedValue({
      totpEnabled: true,
      totpVerified: true,
      totpSecret: 'existing-secret',
    });

    const result = await setupTOTP({});

    expect(result).toEqual({
      error: 'TOTP is already enabled for this account',
    });
    expect(mockCreateTOTPSetup).not.toHaveBeenCalled();
  });

  it('allows re-setup when totpEnabled is true but totpVerified is false', async () => {
    mockDbUserFindUnique.mockResolvedValue({
      totpEnabled: true,
      totpVerified: false,
      totpSecret: 'old-secret',
    });

    const result = await setupTOTP({});

    expect(result.success).toBe(true);
    expect(mockCreateTOTPSetup).toHaveBeenCalledWith(MOCK_USER_EMAIL);
  });

  it('returns error when TOTP setup validation fails', async () => {
    mockValidateTOTPSetup.mockReturnValue({
      isValid: false,
      errors: ['Invalid TOTP secret'],
    });

    const result = await setupTOTP({});

    expect(result).toEqual({
      error: 'Failed to generate TOTP setup data',
    });
    expect(logger.error).toHaveBeenCalledWith(
      '[TOTP_SETUP_ACTION_ERROR] Invalid setup data',
      expect.objectContaining({ userId: MOCK_USER_ID })
    );
    expect(mockDbUserUpdate).not.toHaveBeenCalled();
  });

  it('returns QR code and backup codes on successful setup', async () => {
    const result = await setupTOTP({});

    expect(result.success).toBe(true);
    expect(result.data).toEqual(
      expect.objectContaining({
        qrCodeUrl: 'data:image/png;base64,mockQR',
        backupCodes: mockTOTPSetupData.backupCodes,
        setupComplete: false,
      })
    );
  });

  it('stores encrypted secret and recovery codes in database with TOTP disabled', async () => {
    await setupTOTP({});

    expect(mockDbUserUpdate).toHaveBeenCalledWith({
      where: { id: MOCK_USER_ID },
      data: {
        totpSecret: 'encrypted-secret',
        recoveryCodes: ['enc-code-1', 'enc-code-2'],
        totpEnabled: false,
        totpVerified: false,
      },
    });
  });

  it('logs successful setup attempt', async () => {
    await setupTOTP({});

    expect(logger.info).toHaveBeenCalledWith(
      '[TOTP_SETUP_ACTION_SUCCESS]',
      expect.objectContaining({
        userId: MOCK_USER_ID,
        userEmail: MOCK_USER_EMAIL,
      })
    );
  });

  it('returns generic error and logs when an unexpected exception occurs', async () => {
    mockCreateTOTPSetup.mockRejectedValue(new Error('Crypto failure'));

    const result = await setupTOTP({});

    expect(result).toEqual({
      error: 'Failed to setup TOTP. Please try again.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      '[TOTP_SETUP_ACTION_ERROR]',
      expect.objectContaining({ error: 'Crypto failure' })
    );
  });
});

// ---------------------------------------------------------------------------
// 2. verifyTOTP
// ---------------------------------------------------------------------------

describe('verifyTOTP', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue(authenticatedSession);

    mockDbUserFindUnique.mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: false,
      totpVerified: false,
      email: MOCK_USER_EMAIL,
    });

    mockDecryptTOTPSecret.mockResolvedValue('JBSWY3DPEHPK3PXP');
    mockVerifyTOTPToken.mockReturnValue(true);
    mockDbUserUpdate.mockResolvedValue({
      totpEnabled: true,
      totpVerified: true,
      isTwoFactorEnabled: true,
    });
  });

  it('returns error for non-6-digit token (letters)', async () => {
    const result = await verifyTOTP({ token: 'abcdef' });

    expect(result.error).toBe('Invalid token format');
    expect(result.details).toBeDefined();
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it('returns error for token that is too short', async () => {
    const result = await verifyTOTP({ token: '123' });

    expect(result.error).toBe('Invalid token format');
  });

  it('returns error for token that is too long', async () => {
    const result = await verifyTOTP({ token: '1234567' });

    expect(result.error).toBe('Invalid token format');
  });

  it('returns error when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await verifyTOTP({ token: '123456' });

    expect(result).toEqual({ error: 'Unauthorized - Please log in first' });
  });

  it('returns error when user is not found in database', async () => {
    mockDbUserFindUnique.mockResolvedValue(null);

    const result = await verifyTOTP({ token: '123456' });

    expect(result).toEqual({ error: 'User not found' });
  });

  it('returns error when TOTP setup has not been initiated (no secret)', async () => {
    mockDbUserFindUnique.mockResolvedValue({
      totpSecret: null,
      totpEnabled: false,
      totpVerified: false,
      email: MOCK_USER_EMAIL,
    });

    const result = await verifyTOTP({ token: '123456' });

    expect(result).toEqual({
      error: 'TOTP setup not initiated. Please start setup first.',
    });
  });

  it('returns error when TOTP is already enabled and verified', async () => {
    mockDbUserFindUnique.mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: true,
      totpVerified: true,
      email: MOCK_USER_EMAIL,
    });

    const result = await verifyTOTP({ token: '123456' });

    expect(result).toEqual({
      error: 'TOTP is already enabled for this account',
    });
  });

  it('returns error when token verification fails', async () => {
    mockVerifyTOTPToken.mockReturnValue(false);

    const result = await verifyTOTP({ token: '123456' });

    expect(result).toEqual({
      error: 'Invalid verification code. Please try again.',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      '[TOTP_VERIFY_ACTION_FAILED]',
      expect.objectContaining({
        userId: MOCK_USER_ID,
        reason: 'Invalid token',
      })
    );
  });

  it('enables TOTP and 2FA in database on successful verification', async () => {
    const result = await verifyTOTP({ token: '123456' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(
      expect.objectContaining({
        totpEnabled: true,
        totpVerified: true,
        setupComplete: true,
      })
    );

    expect(mockDbUserUpdate).toHaveBeenCalledWith({
      where: { id: MOCK_USER_ID },
      data: {
        totpEnabled: true,
        totpVerified: true,
        isTwoFactorEnabled: true,
      },
    });
  });

  it('logs successful TOTP enablement', async () => {
    await verifyTOTP({ token: '123456' });

    expect(logger.info).toHaveBeenCalledWith(
      '[TOTP_ENABLED_ACTION]',
      expect.objectContaining({
        userId: MOCK_USER_ID,
        userEmail: MOCK_USER_EMAIL,
        method: 'TOTP',
      })
    );
  });

  it('returns generic error when decryption throws', async () => {
    mockDecryptTOTPSecret.mockRejectedValue(new Error('Decryption failed'));

    const result = await verifyTOTP({ token: '123456' });

    expect(result).toEqual({
      error: 'Failed to verify TOTP token. Please try again.',
    });
    expect(logger.error).toHaveBeenCalledWith(
      '[TOTP_VERIFY_ACTION_ERROR]',
      expect.objectContaining({ error: 'Decryption failed' })
    );
  });
});

// ---------------------------------------------------------------------------
// 3. disableTOTP
// ---------------------------------------------------------------------------

describe('disableTOTP', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue(authenticatedSession);

    mockDbUserFindUnique.mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: true,
      totpVerified: true,
      recoveryCodes: ['enc-code-1', 'enc-code-2'],
      email: MOCK_USER_EMAIL,
    });

    mockDecryptTOTPSecret.mockResolvedValue('JBSWY3DPEHPK3PXP');
    mockVerifyTOTPToken.mockReturnValue(true);
    mockVerifyRecoveryCode.mockResolvedValue({
      isValid: true,
      remainingCodes: ['enc-code-2'],
    });
    mockDbUserUpdate.mockResolvedValue({});
  });

  it('returns error when neither token nor recovery code is provided', async () => {
    const result = await disableTOTP({ confirmDisable: true });

    expect(result.error).toBe('Invalid request data');
  });

  it('returns error when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await disableTOTP({
      token: '123456',
      confirmDisable: true,
    });

    expect(result).toEqual({ error: 'Unauthorized - Please log in first' });
  });

  it('returns error when confirmDisable is false', async () => {
    const result = await disableTOTP({
      token: '123456',
      confirmDisable: false,
    });

    expect(result).toEqual({
      error: 'Confirmation required to disable TOTP',
    });
  });

  it('returns error when user is not found in database', async () => {
    mockDbUserFindUnique.mockResolvedValue(null);

    const result = await disableTOTP({
      token: '123456',
      confirmDisable: true,
    });

    expect(result).toEqual({ error: 'User not found' });
  });

  it('returns error when TOTP is not currently enabled', async () => {
    mockDbUserFindUnique.mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: false,
      totpVerified: false,
      recoveryCodes: [],
      email: MOCK_USER_EMAIL,
    });

    const result = await disableTOTP({
      token: '123456',
      confirmDisable: true,
    });

    expect(result).toEqual({
      error: 'TOTP is not currently enabled for this account',
    });
  });

  it('returns error when TOTP token verification fails and no recovery code', async () => {
    mockVerifyTOTPToken.mockReturnValue(false);

    const result = await disableTOTP({
      token: '999999',
      confirmDisable: true,
    });

    expect(result).toEqual({
      error: 'Invalid verification code. Please try again.',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      '[TOTP_DISABLE_ACTION_FAILED]',
      expect.objectContaining({
        userId: MOCK_USER_ID,
        reason: 'Invalid verification',
        method: 'TOTP',
      })
    );
  });

  it('successfully disables TOTP with a valid token', async () => {
    const result = await disableTOTP({
      token: '123456',
      confirmDisable: true,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      totpEnabled: false,
      totpVerified: false,
      twoFactorEnabled: false,
    });

    expect(mockDbUserUpdate).toHaveBeenCalledWith({
      where: { id: MOCK_USER_ID },
      data: expect.objectContaining({
        totpSecret: null,
        totpEnabled: false,
        totpVerified: false,
        isTwoFactorEnabled: false,
      }),
    });
  });

  it('successfully disables TOTP with a valid recovery code', async () => {
    const result = await disableTOTP({
      recoveryCode: 'AAAA-BBBB-CCCC-0001',
      confirmDisable: true,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      totpEnabled: false,
      totpVerified: false,
      twoFactorEnabled: false,
    });

    // Recovery codes should be updated with remaining codes
    expect(mockDbUserUpdate).toHaveBeenCalledWith({
      where: { id: MOCK_USER_ID },
      data: expect.objectContaining({
        recoveryCodes: ['enc-code-2'],
      }),
    });
  });

  it('falls back to recovery code when TOTP token fails', async () => {
    mockVerifyTOTPToken.mockReturnValue(false);
    mockVerifyRecoveryCode.mockResolvedValue({
      isValid: true,
      remainingCodes: ['enc-code-2'],
    });

    const result = await disableTOTP({
      token: '999999',
      recoveryCode: 'AAAA-BBBB-CCCC-0001',
      confirmDisable: true,
    });

    expect(result.success).toBe(true);
    expect(mockVerifyRecoveryCode).toHaveBeenCalled();
  });

  it('returns error when both TOTP token and recovery code fail', async () => {
    mockVerifyTOTPToken.mockReturnValue(false);
    mockVerifyRecoveryCode.mockResolvedValue({
      isValid: false,
    });

    const result = await disableTOTP({
      token: '999999',
      recoveryCode: 'XXXX-XXXX-XXXX-XXXX',
      confirmDisable: true,
    });

    expect(result).toEqual({
      error: 'Invalid verification code. Please try again.',
    });
  });

  it('returns error when decryption of TOTP secret fails', async () => {
    mockDecryptTOTPSecret.mockRejectedValue(new Error('Bad cipher'));

    const result = await disableTOTP({
      token: '123456',
      confirmDisable: true,
    });

    expect(result).toEqual({ error: 'Failed to verify TOTP token' });
    expect(logger.error).toHaveBeenCalledWith(
      '[TOTP_DISABLE_ACTION_DECRYPT_ERROR]',
      expect.objectContaining({ userId: MOCK_USER_ID })
    );
  });

  it('logs successful TOTP disable', async () => {
    await disableTOTP({ token: '123456', confirmDisable: true });

    expect(logger.info).toHaveBeenCalledWith(
      '[TOTP_DISABLED_ACTION]',
      expect.objectContaining({
        userId: MOCK_USER_ID,
        userEmail: MOCK_USER_EMAIL,
        verificationMethod: 'TOTP',
      })
    );
  });

  it('returns generic error when an unexpected exception occurs', async () => {
    mockDbUserFindUnique.mockRejectedValue(new Error('DB down'));

    const result = await disableTOTP({
      token: '123456',
      confirmDisable: true,
    });

    expect(result).toEqual({
      error: 'Failed to disable TOTP. Please try again.',
    });
  });
});

// ---------------------------------------------------------------------------
// 4. regenerateRecoveryCodes
// ---------------------------------------------------------------------------

describe('regenerateRecoveryCodes', () => {
  const newCodes = [
    'NEWC-0001-NEWC-0001',
    'NEWC-0002-NEWC-0002',
    'NEWC-0003-NEWC-0003',
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue(authenticatedSession);

    mockDbUserFindUnique.mockResolvedValue({
      totpSecret: 'encrypted-secret',
      totpEnabled: true,
      totpVerified: true,
      recoveryCodes: ['old-code-1', 'old-code-2'],
      email: MOCK_USER_EMAIL,
    });

    mockDecryptTOTPSecret.mockResolvedValue('JBSWY3DPEHPK3PXP');
    mockVerifyTOTPToken.mockReturnValue(true);
    mockGenerateRecoveryCodes.mockReturnValue(newCodes);
    mockEncryptRecoveryCodes.mockResolvedValue([
      'enc-new-1',
      'enc-new-2',
      'enc-new-3',
    ]);
    mockDbUserUpdate.mockResolvedValue({});
  });

  it('returns error for invalid token format', async () => {
    const result = await regenerateRecoveryCodes({
      token: 'abc',
      confirmRegenerate: true,
    });

    expect(result.error).toBe('Invalid request data');
    expect(result.details).toBeDefined();
  });

  it('returns error when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await regenerateRecoveryCodes({
      token: '123456',
      confirmRegenerate: true,
    });

    expect(result).toEqual({ error: 'Unauthorized - Please log in first' });
  });

  it('returns error when confirmRegenerate is false', async () => {
    const result = await regenerateRecoveryCodes({
      token: '123456',
      confirmRegenerate: false,
    });

    expect(result).toEqual({
      error: 'Confirmation required to regenerate recovery codes',
    });
  });

  it('returns error when user is not found in database', async () => {
    mockDbUserFindUnique.mockResolvedValue(null);

    const result = await regenerateRecoveryCodes({
      token: '123456',
      confirmRegenerate: true,
    });

    expect(result).toEqual({ error: 'User not found' });
  });

  it('returns error when TOTP is not enabled', async () => {
    mockDbUserFindUnique.mockResolvedValue({
      totpSecret: null,
      totpEnabled: false,
      totpVerified: false,
      recoveryCodes: [],
      email: MOCK_USER_EMAIL,
    });

    const result = await regenerateRecoveryCodes({
      token: '123456',
      confirmRegenerate: true,
    });

    expect(result).toEqual({
      error: 'TOTP must be enabled to manage recovery codes',
    });
  });

  it('returns error when TOTP token is invalid', async () => {
    mockVerifyTOTPToken.mockReturnValue(false);

    const result = await regenerateRecoveryCodes({
      token: '999999',
      confirmRegenerate: true,
    });

    expect(result).toEqual({
      error: 'Invalid verification code. Please try again.',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      '[RECOVERY_CODES_ACTION_VERIFY_FAILED]',
      expect.objectContaining({
        userId: MOCK_USER_ID,
        reason: 'Invalid TOTP token',
      })
    );
  });

  it('returns new recovery codes on success', async () => {
    const result = await regenerateRecoveryCodes({
      token: '123456',
      confirmRegenerate: true,
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(
      expect.objectContaining({
        recoveryCodes: newCodes,
        totalCodes: newCodes.length,
      })
    );
    expect(result.data.warning).toContain('save these codes');
  });

  it('stores encrypted new codes in database', async () => {
    await regenerateRecoveryCodes({
      token: '123456',
      confirmRegenerate: true,
    });

    expect(mockDbUserUpdate).toHaveBeenCalledWith({
      where: { id: MOCK_USER_ID },
      data: {
        recoveryCodes: ['enc-new-1', 'enc-new-2', 'enc-new-3'],
      },
    });
  });

  it('logs successful regeneration with code counts', async () => {
    await regenerateRecoveryCodes({
      token: '123456',
      confirmRegenerate: true,
    });

    expect(logger.info).toHaveBeenCalledWith(
      '[RECOVERY_CODES_ACTION_REGENERATED]',
      expect.objectContaining({
        userId: MOCK_USER_ID,
        previousCodesCount: 2,
        newCodesCount: newCodes.length,
      })
    );
  });

  it('returns generic error when an unexpected exception occurs', async () => {
    mockDecryptTOTPSecret.mockRejectedValue(new Error('Key rotation issue'));

    const result = await regenerateRecoveryCodes({
      token: '123456',
      confirmRegenerate: true,
    });

    expect(result).toEqual({
      error: 'Failed to generate recovery codes. Please try again.',
    });
  });
});

// ---------------------------------------------------------------------------
// 5. getTOTPStatus
// ---------------------------------------------------------------------------

describe('getTOTPStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth.mockResolvedValue(authenticatedSession);

    mockDbUserFindUnique.mockResolvedValue({
      totpEnabled: true,
      totpVerified: true,
      isTwoFactorEnabled: true,
      recoveryCodes: ['code-1', 'code-2', 'code-3'],
    });
  });

  it('returns error when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getTOTPStatus();

    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('returns error when session has user but no id', async () => {
    mockAuth.mockResolvedValue({ user: { email: MOCK_USER_EMAIL } });

    const result = await getTOTPStatus();

    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('returns error when user is not found in database', async () => {
    mockDbUserFindUnique.mockResolvedValue(null);

    const result = await getTOTPStatus();

    expect(result).toEqual({ error: 'User not found' });
  });

  it('returns TOTP status for enabled user', async () => {
    const result = await getTOTPStatus();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      totpEnabled: true,
      totpVerified: true,
      twoFactorEnabled: true,
      remainingRecoveryCodes: 3,
      setupRequired: false,
    });
  });

  it('returns setupRequired true when TOTP is not enabled', async () => {
    mockDbUserFindUnique.mockResolvedValue({
      totpEnabled: false,
      totpVerified: false,
      isTwoFactorEnabled: false,
      recoveryCodes: [],
    });

    const result = await getTOTPStatus();

    expect(result.success).toBe(true);
    expect(result.data.setupRequired).toBe(true);
    expect(result.data.remainingRecoveryCodes).toBe(0);
  });

  it('returns remainingRecoveryCodes as 0 when recoveryCodes is null', async () => {
    mockDbUserFindUnique.mockResolvedValue({
      totpEnabled: true,
      totpVerified: true,
      isTwoFactorEnabled: true,
      recoveryCodes: null,
    });

    const result = await getTOTPStatus();

    expect(result.success).toBe(true);
    expect(result.data.remainingRecoveryCodes).toBe(0);
  });

  it('returns generic error when database throws', async () => {
    mockDbUserFindUnique.mockRejectedValue(new Error('Connection timeout'));

    const result = await getTOTPStatus();

    expect(result).toEqual({ error: 'Failed to get TOTP status' });
    expect(logger.error).toHaveBeenCalledWith(
      '[TOTP_STATUS_ACTION_ERROR]',
      expect.any(Error)
    );
  });
});
