/**
 * Tests for lib/tokens.ts
 *
 * Covers three exported functions:
 *   - generateTwoFactorToken
 *   - generatePasswordResetToken
 *   - generateVerificationToken
 *
 * Each function follows the same pattern:
 *   1. Generate a token (crypto.randomInt for 2FA, uuidv4 for the others)
 *   2. Set an expiry (5 min for 2FA, 1 hour for the others)
 *   3. Check for an existing token by email
 *   4. Delete old token if one exists
 *   5. Create a new token record
 *   6. Return { email, token, expires }
 */

// Unmock @/lib/tokens so we test the real implementation
jest.unmock('@/lib/tokens');

// Explicitly mock the data layer modules that the SUT imports.
// jest.setup.js only mocks @/data/two-factor-token globally; we need all three.
jest.mock('@/data/verification-token', () => ({
  getVerificationTokenByEmail: jest.fn(),
  getVerificationTokenByToken: jest.fn(),
}));

jest.mock('@/data/password-reset-token', () => ({
  getPasswordResetTokenByEmail: jest.fn(),
  getPasswordResetTokenByToken: jest.fn(),
}));

jest.mock('@/data/two-factor-token', () => ({
  getTwoFactorTokenByEmail: jest.fn(),
  getTwoFactorTokenByToken: jest.fn(),
}));

import { v4 as uuidv4 } from 'uuid';
import { getVerificationTokenByEmail } from '@/data/verification-token';
import { getPasswordResetTokenByEmail } from '@/data/password-reset-token';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { db } from '@/lib/db';

// Import the actual module under test
import {
  generateTwoFactorToken,
  generatePasswordResetToken,
  generateVerificationToken,
} from '@/lib/tokens';

// Cast uuid mock so we can restore its return value in beforeEach
// (the CI jest config has resetMocks: true which clears mock implementations)
const mockUuidV4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

// Cast mocks for type safety
const mockGetTwoFactorTokenByEmail = getTwoFactorTokenByEmail as jest.MockedFunction<
  typeof getTwoFactorTokenByEmail
>;
const mockGetPasswordResetTokenByEmail = getPasswordResetTokenByEmail as jest.MockedFunction<
  typeof getPasswordResetTokenByEmail
>;
const mockGetVerificationTokenByEmail = getVerificationTokenByEmail as jest.MockedFunction<
  typeof getVerificationTokenByEmail
>;

const mockDb = db as jest.Mocked<typeof db>;

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const TEST_EMAIL = 'test@example.com';

/** Freeze Date.now so expiry assertions are deterministic. */
function withFrozenTime(fn: (now: number) => void | Promise<void>) {
  const realDateNow = Date.now;
  const frozenNow = 1700000000000; // arbitrary fixed timestamp
  Date.now = jest.fn(() => frozenNow);

  // Also freeze the Date constructor for "new Date()" calls inside the SUT
  const RealDate = global.Date;
  const MockDate = class extends RealDate {
    constructor(...args: ConstructorParameters<typeof RealDate>) {
      if (args.length === 0) {
        super(frozenNow);
      } else {
        // @ts-ignore -- spread into Date constructor
        super(...args);
      }
    }

    static now() {
      return frozenNow;
    }
  } as DateConstructor;
  global.Date = MockDate;

  const restore = () => {
    Date.now = realDateNow;
    global.Date = RealDate;
  };

  try {
    const result = fn(frozenNow);
    if (result && typeof (result as Promise<void>).then === 'function') {
      return (result as Promise<void>).finally(restore);
    }
    restore();
  } catch (err) {
    restore();
    throw err;
  }
}

// ----------------------------------------------------------------
// Tests
// ----------------------------------------------------------------

describe('lib/tokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-apply uuid mock return value (resetMocks: true in CI config clears it)
    mockUuidV4.mockReturnValue('mock-uuid-v4');

    // Default: no existing tokens
    mockGetTwoFactorTokenByEmail.mockResolvedValue(null);
    mockGetPasswordResetTokenByEmail.mockResolvedValue(null);
    mockGetVerificationTokenByEmail.mockResolvedValue(null);

    // db.*.create returns a resolved promise (the SUT does not use the return value)
    (mockDb.twoFactorToken.create as jest.Mock).mockResolvedValue({});
    (mockDb.twoFactorToken.delete as jest.Mock).mockResolvedValue({});
    (mockDb.passwordResetToken.create as jest.Mock).mockResolvedValue({});
    (mockDb.passwordResetToken.delete as jest.Mock).mockResolvedValue({});
    (mockDb.verificationToken.create as jest.Mock).mockResolvedValue({});
    (mockDb.verificationToken.delete as jest.Mock).mockResolvedValue({});
  });

  // ==============================================================
  // generateTwoFactorToken
  // ==============================================================

  describe('generateTwoFactorToken', () => {
    it('should return an object with email, token, and expires', async () => {
      const result = await generateTwoFactorToken(TEST_EMAIL);

      expect(result).toHaveProperty('email', TEST_EMAIL);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expires');
      expect(result.expires).toBeInstanceOf(Date);
    });

    it('should generate a 6-digit numeric string token', async () => {
      const result = await generateTwoFactorToken(TEST_EMAIL);

      // Token must be a string of exactly 6 digits (100000..999999)
      expect(result.token).toMatch(/^\d{6}$/);
      const num = parseInt(result.token, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    });

    it('should set expiry to 5 minutes from now', async () => {
      await withFrozenTime(async (now) => {
        const result = await generateTwoFactorToken(TEST_EMAIL);
        const expectedExpiry = new Date(now + 5 * 60 * 1000);

        expect(result.expires.getTime()).toBe(expectedExpiry.getTime());
      });
    });

    it('should delete the existing token when one already exists for the email', async () => {
      const existingToken = {
        id: 'existing-2fa-id',
        email: TEST_EMAIL,
        token: '111111',
        expires: new Date(),
      };
      mockGetTwoFactorTokenByEmail.mockResolvedValue(existingToken);

      await generateTwoFactorToken(TEST_EMAIL);

      expect(mockDb.twoFactorToken.delete).toHaveBeenCalledWith({
        where: { id: 'existing-2fa-id' },
      });
    });

    it('should not delete any token when none exists for the email', async () => {
      mockGetTwoFactorTokenByEmail.mockResolvedValue(null);

      await generateTwoFactorToken(TEST_EMAIL);

      expect(mockDb.twoFactorToken.delete).not.toHaveBeenCalled();
    });

    it('should create a new token record with correct data', async () => {
      await withFrozenTime(async (now) => {
        const result = await generateTwoFactorToken(TEST_EMAIL);
        const expectedExpiry = new Date(now + 5 * 60 * 1000);

        expect(mockDb.twoFactorToken.create).toHaveBeenCalledTimes(1);
        expect(mockDb.twoFactorToken.create).toHaveBeenCalledWith({
          data: {
            email: TEST_EMAIL,
            token: result.token,
            expires: expectedExpiry,
          },
        });
      });
    });
  });

  // ==============================================================
  // generatePasswordResetToken
  // ==============================================================

  describe('generatePasswordResetToken', () => {
    it('should return an object with email, token, and expires', async () => {
      const result = await generatePasswordResetToken(TEST_EMAIL);

      expect(result).toHaveProperty('email', TEST_EMAIL);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expires');
      expect(result.expires).toBeInstanceOf(Date);
    });

    it('should generate a UUID v4 token', async () => {
      const result = await generatePasswordResetToken(TEST_EMAIL);

      // uuidv4 is mocked globally to return 'mock-uuid-v4' (jest.setup.js)
      expect(result.token).toBe('mock-uuid-v4');
    });

    it('should set expiry to 1 hour from now', async () => {
      await withFrozenTime(async (now) => {
        const result = await generatePasswordResetToken(TEST_EMAIL);
        const expectedExpiry = new Date(now + 3600 * 1000);

        expect(result.expires.getTime()).toBe(expectedExpiry.getTime());
      });
    });

    it('should delete the existing token when one already exists for the email', async () => {
      const existingToken = {
        id: 'existing-reset-id',
        email: TEST_EMAIL,
        token: 'old-uuid',
        expires: new Date(),
      };
      mockGetPasswordResetTokenByEmail.mockResolvedValue(existingToken);

      await generatePasswordResetToken(TEST_EMAIL);

      expect(mockDb.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { id: 'existing-reset-id' },
      });
    });

    it('should not delete any token when none exists for the email', async () => {
      mockGetPasswordResetTokenByEmail.mockResolvedValue(null);

      await generatePasswordResetToken(TEST_EMAIL);

      expect(mockDb.passwordResetToken.delete).not.toHaveBeenCalled();
    });

    it('should create a new token record with correct data', async () => {
      await withFrozenTime(async (now) => {
        const result = await generatePasswordResetToken(TEST_EMAIL);
        const expectedExpiry = new Date(now + 3600 * 1000);

        expect(mockDb.passwordResetToken.create).toHaveBeenCalledTimes(1);
        expect(mockDb.passwordResetToken.create).toHaveBeenCalledWith({
          data: {
            email: TEST_EMAIL,
            token: 'mock-uuid-v4',
            expires: expectedExpiry,
          },
        });
      });
    });
  });

  // ==============================================================
  // generateVerificationToken
  // ==============================================================

  describe('generateVerificationToken', () => {
    it('should return an object with email, token, and expires', async () => {
      const result = await generateVerificationToken(TEST_EMAIL);

      expect(result).toHaveProperty('email', TEST_EMAIL);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expires');
      expect(result.expires).toBeInstanceOf(Date);
    });

    it('should generate a UUID v4 token', async () => {
      const result = await generateVerificationToken(TEST_EMAIL);

      expect(result.token).toBe('mock-uuid-v4');
    });

    it('should set expiry to 1 hour from now', async () => {
      await withFrozenTime(async (now) => {
        const result = await generateVerificationToken(TEST_EMAIL);
        const expectedExpiry = new Date(now + 3600 * 1000);

        expect(result.expires.getTime()).toBe(expectedExpiry.getTime());
      });
    });

    it('should delete the existing token when one already exists for the email', async () => {
      const existingToken = {
        id: 'existing-verify-id',
        email: TEST_EMAIL,
        token: 'old-verify-uuid',
        expires: new Date(),
      };
      mockGetVerificationTokenByEmail.mockResolvedValue(existingToken);

      await generateVerificationToken(TEST_EMAIL);

      expect(mockDb.verificationToken.delete).toHaveBeenCalledWith({
        where: { id: 'existing-verify-id' },
      });
    });

    it('should not delete any token when none exists for the email', async () => {
      mockGetVerificationTokenByEmail.mockResolvedValue(null);

      await generateVerificationToken(TEST_EMAIL);

      expect(mockDb.verificationToken.delete).not.toHaveBeenCalled();
    });

    it('should create a new token record with correct data', async () => {
      await withFrozenTime(async (now) => {
        const result = await generateVerificationToken(TEST_EMAIL);
        const expectedExpiry = new Date(now + 3600 * 1000);

        expect(mockDb.verificationToken.create).toHaveBeenCalledTimes(1);
        expect(mockDb.verificationToken.create).toHaveBeenCalledWith({
          data: {
            email: TEST_EMAIL,
            token: 'mock-uuid-v4',
            expires: expectedExpiry,
          },
        });
      });
    });
  });

  // ==============================================================
  // Cross-cutting / additional edge-case tests
  // ==============================================================

  describe('cross-cutting concerns', () => {
    it('should call getTwoFactorTokenByEmail with the provided email', async () => {
      await generateTwoFactorToken('user@domain.com');

      expect(mockGetTwoFactorTokenByEmail).toHaveBeenCalledTimes(1);
      expect(mockGetTwoFactorTokenByEmail).toHaveBeenCalledWith('user@domain.com');
    });

    it('should call getPasswordResetTokenByEmail with the provided email', async () => {
      await generatePasswordResetToken('reset@domain.com');

      expect(mockGetPasswordResetTokenByEmail).toHaveBeenCalledTimes(1);
      expect(mockGetPasswordResetTokenByEmail).toHaveBeenCalledWith('reset@domain.com');
    });

    it('should call getVerificationTokenByEmail with the provided email', async () => {
      await generateVerificationToken('verify@domain.com');

      expect(mockGetVerificationTokenByEmail).toHaveBeenCalledTimes(1);
      expect(mockGetVerificationTokenByEmail).toHaveBeenCalledWith('verify@domain.com');
    });
  });
});
