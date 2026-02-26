/**
 * Tests for lib/password-security.ts - PasswordSecurity class
 *
 * Covers: hash, verify, validateStrength, hasBeenUsedBefore,
 * saveToHistory, generateSecurePassword, shouldChangePassword,
 * updatePassword, and helper functions.
 */

import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import {
  PasswordSecurity,
  getPasswordStrengthColor,
  getPasswordStrengthWidth,
} from '@/lib/password-security';

// bcryptjs and @/lib/db are globally mocked in jest.setup.js
// bcrypt.hash returns `hashed_${password}`, bcrypt.compare returns hash === `hashed_${password}`

// The global mock db does not include passwordHistory or enhancedAuditLog models.
// We augment the mock db with these models before tests run.
const mockDb = db as Record<string, Record<string, jest.Mock>>;

function ensureMockModel(name: string): void {
  if (!mockDb[name]) {
    mockDb[name] = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(() => Promise.resolve(0)),
      aggregate: jest.fn(),
      groupBy: jest.fn(() => Promise.resolve([])),
    };
  }
}

beforeAll(() => {
  ensureMockModel('passwordHistory');
  ensureMockModel('enhancedAuditLog');
});

describe('PasswordSecurity', () => {
  // -------------------------------------------------------
  // hash
  // -------------------------------------------------------
  describe('hash', () => {
    it('should return a bcrypt hash of the password', async () => {
      const result = await PasswordSecurity.hash('MyPassword1!');

      expect(bcrypt.hash).toHaveBeenCalledWith('MyPassword1!', 12);
      expect(result).toBe('hashed_MyPassword1!');
    });

    it('should use 12 salt rounds', async () => {
      await PasswordSecurity.hash('test');

      expect(bcrypt.hash).toHaveBeenCalledWith('test', 12);
    });
  });

  // -------------------------------------------------------
  // verify
  // -------------------------------------------------------
  describe('verify', () => {
    it('should return true when the password matches the hash', async () => {
      const result = await PasswordSecurity.verify(
        'correctPassword',
        'hashed_correctPassword'
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correctPassword',
        'hashed_correctPassword'
      );
      expect(result).toBe(true);
    });

    it('should return false when the password does not match the hash', async () => {
      const result = await PasswordSecurity.verify(
        'wrongPassword',
        'hashed_correctPassword'
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongPassword',
        'hashed_correctPassword'
      );
      expect(result).toBe(false);
    });
  });

  // -------------------------------------------------------
  // validateStrength
  // -------------------------------------------------------
  describe('validateStrength', () => {
    it('should flag a short password as weak with feedback about minimum length', () => {
      // 'x' is 1 char: length fails, no upper, no number, no special
      // score: 0 (length) + 0 (upper) + 0.5 (lower) + 0 (number) + 0 (special) = 0.5 -> weak
      const result = PasswordSecurity.validateStrength('x');

      expect(result.strength).toBe('weak');
      expect(result.valid).toBe(false);
      expect(result.feedback).toContain(
        'Password must be at least 12 characters long'
      );
    });

    it('should flag missing uppercase letters', () => {
      // 12 chars, all lowercase + digit + special, no uppercase
      const result = PasswordSecurity.validateStrength('zxqwpmkj1!rv');

      expect(result.feedback).toContain(
        'Include at least 1 uppercase letter(s)'
      );
      expect(result.valid).toBe(false);
    });

    it('should flag missing lowercase letters', () => {
      // 12 chars, all uppercase + digit + special, no lowercase
      const result = PasswordSecurity.validateStrength('ZXQWPMKJRV1!');

      expect(result.feedback).toContain(
        'Include at least 1 lowercase letter(s)'
      );
      expect(result.valid).toBe(false);
    });

    it('should flag missing numbers', () => {
      // 12 chars, mixed case + special, no digit
      const result = PasswordSecurity.validateStrength('Zxqwpmkjrv!k');

      expect(result.feedback).toContain('Include at least 1 number(s)');
      expect(result.valid).toBe(false);
    });

    it('should flag missing special characters', () => {
      // 12 chars, mixed case + digit, no special
      const result = PasswordSecurity.validateStrength('Zxqwpmkjrv1k');

      expect(result.feedback).toContain(
        'Include at least 1 special character(s)'
      );
      expect(result.valid).toBe(false);
    });

    it('should detect common passwords', () => {
      const result = PasswordSecurity.validateStrength('password123');

      expect(result.feedback).toContain(
        'This password is too common. Please choose a unique password'
      );
    });

    it('should detect common passwords case-insensitively', () => {
      const result = PasswordSecurity.validateStrength('PASSWORD123');

      expect(result.feedback).toContain(
        'This password is too common. Please choose a unique password'
      );
    });

    it('should flag password containing the username', () => {
      const result = PasswordSecurity.validateStrength(
        'JohnDoe12345!@',
        'johndoe'
      );

      expect(result.feedback).toContain(
        'Password should not contain your username'
      );
    });

    it('should flag password containing the email prefix', () => {
      // 14 chars with upper + lower + digit + special, contains "charlie" from email
      const result = PasswordSecurity.validateStrength(
        'Xcharlie1245!@',
        undefined,
        'charlie@example.com'
      );

      expect(result.feedback).toContain(
        'Password should not contain parts of your email'
      );
    });

    it('should recognize a strong password meeting all requirements (16+ chars)', () => {
      // 17 chars, has upper, lower, numbers, special, no sequential, no common
      const password = 'Xk9!mRtQ7@wLpN2#z';
      const result = PasswordSecurity.validateStrength(password);

      expect(result.valid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(['good', 'strong', 'excellent']).toContain(result.strength);
    });

    it('should rate an excellent password (20+ chars, all requirements, bonus chars)', () => {
      // 24 chars with 3+ of each category to earn all bonus points.
      // Avoid any 3-char sequential letter/number runs.
      const password = 'AXC!@#dmf496GWIjrl780MN$';
      const result = PasswordSecurity.validateStrength(password);

      expect(result.score).toBeGreaterThanOrEqual(4.5);
      expect(result.strength).toBe('excellent');
      expect(result.feedback).toContain('Excellent password strength!');
    });

    it('should handle an empty password', () => {
      const result = PasswordSecurity.validateStrength('');

      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.score).toBe(0);
      expect(result.feedback).toContain(
        'Password must be at least 12 characters long'
      );
    });

    it('should calculate score accurately for a password meeting base requirements only', () => {
      // 12 chars, 1 upper, multiple lowercase (3+), 1 number, 1 special.
      // No sequential letters or numbers, no repeats.
      // "Wqjz1!gmpvkr" -> W=upper(1), q,j,z,g,m,p,v,k,r=lower(9), 1=number(1), !=special(1)
      const password = 'Wqjz1!gmpvkr';
      const result = PasswordSecurity.validateStrength(password);

      // Length >= 12: +1 (no 16+ bonus)
      // Uppercase (1): +0.5 (no 3+ bonus)
      // Lowercase (9): +0.5 + 0.5 = 1.0 (3+ bonus)
      // Numbers (1): +0.5 (no 3+ bonus)
      // Special (1): +0.5 (no 3+ bonus)
      // No penalties
      // Total: 1 + 0.5 + 1.0 + 0.5 + 0.5 = 3.5
      expect(result.score).toBe(3.5);
      expect(result.strength).toBe('good');
      expect(result.valid).toBe(true);
    });

    it('should penalize sequential letters', () => {
      // Contains "abc" which is a sequential letter sequence
      const password = 'Xabc1!gmpvkr';
      const result = PasswordSecurity.validateStrength(password);

      expect(result.feedback).toContain('Avoid sequential letters');
    });

    it('should penalize sequential numbers', () => {
      // Contains "123" which is a sequential number sequence
      const password = 'Ax123!gmpvkr';
      const result = PasswordSecurity.validateStrength(password);

      expect(result.feedback).toContain('Avoid sequential numbers');
    });

    it('should penalize repeated characters', () => {
      // Contains "xxx" (3 consecutive identical characters)
      const password = 'Axxx1!gmpvkr';
      const result = PasswordSecurity.validateStrength(password);

      expect(result.feedback).toContain('Avoid repeating characters');
    });

    it('should return strength levels that match the score thresholds', () => {
      // weak: score < 2
      const weakResult = PasswordSecurity.validateStrength('short');
      expect(weakResult.strength).toBe('weak');

      // fair: score >= 2 and < 3
      // 12 chars, 1 upper, lowercase, but missing number and special
      // Score: 1 (length) + 0.5 (upper 1) + 1.0 (lower 3+) = 2.5
      const fairPassword = 'Axqwpmkjrvzn';
      const fairResult = PasswordSecurity.validateStrength(fairPassword);
      expect(fairResult.strength).toBe('fair');
    });

    it('should add encouragement feedback for good passwords', () => {
      // A valid password that scores >= 3 with zero negative feedback.
      // "Wqjz1!gmpvkr" has score 3.5, no sequential, no repeats, not common, no username/email.
      const password = 'Wqjz1!gmpvkr';
      const result = PasswordSecurity.validateStrength(password);

      expect(result.valid).toBe(true);
      expect(result.feedback).toContain('Good password strength.');
    });

    it('should add encouragement for strong passwords (score >= 4)', () => {
      // 16+ chars, multiple char types for bonus. Avoid sequential.
      // "ABCxyz1!GHIjk2@m" contains "abc", "xyz", "ghi", "jk" sequences.
      // Use a password with 3+ uppercase, 3+ lowercase, 3+ numbers, 1 special, 16 chars.
      const password = 'AXG!xmq159JRtw28';
      const result = PasswordSecurity.validateStrength(password);

      // Score: 2 (length 16+) + 1 (upper 3+) + 1 (lower 3+) + 1 (numbers 3+) + 0.5 (special 1) = 5 -> capped at 5
      // That might be excellent. Let me target score 4-4.5.
      // Use 16 chars: 3 upper, 3 lower, 2 numbers, 1 special = score:
      // 2 (length) + 1 (upper 3+) + 1 (lower 3+) + 0.5 (numbers <3) + 0.5 (special <3) = 5 -> excellent
      // Need to get exactly 4. Use 12 chars: 3 upper, 3 lower, 3 numbers, 1 special.
      // 1 (length 12) + 1 (upper 3+) + 1 (lower 3+) + 1 (numbers 3+) + 0.5 (special 1) = 4.5 -> excellent
      // For exactly 4: 12 chars, 3 upper, 3 lower, 1 number, 3 special.
      // 1 + 1 + 1 + 0.5 + 1 = 4.5 -> excellent again
      // Score 4 needs: 12 chars, 3 upper, 1 lower, 3 numbers, 1 special
      // 1 + 1 + 0.5 + 1 + 0.5 = 4.0 -> strong
      const strongPassword = 'AXGq159!zzzz'; // has repeated chars penalty
      // Better: "AXGq159!wrtm" -> 3 upper(A,X,G), 4 lower (q,w,r,t,m), wait that is 5 lower
      // Let me just use: ABCq159!wrtm -> "ABC" is sequential -> penalty
      // Use: AXGq159!wrtm -> 3 upper, 4 lower, 3 numbers, 1 special
      // 1 + 1 + 1 + 1 + 0.5 = 4.5 -> excellent
      // For 4.0 exactly: AXGq15!wrtml -> 3 upper, 5 lower, 2 numbers, 1 special
      // 1 + 1 + 1 + 0.5 + 0.5 = 4.0 -> strong
      const strongPw = 'AXGq15!wrtml';
      const strongResult = PasswordSecurity.validateStrength(strongPw);

      expect(strongResult.score).toBeGreaterThanOrEqual(4);
      expect(strongResult.score).toBeLessThan(4.5);
      expect(strongResult.strength).toBe('strong');
      expect(strongResult.feedback).toContain(
        'Strong password! Consider adding more unique characters for maximum security.'
      );
    });

    it('should never return a score below 0 even with many penalties', () => {
      // Common password + sequential + contains username
      const result = PasswordSecurity.validateStrength(
        'password123',
        'password'
      );

      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should never return a score above 5', () => {
      // Very long password with many bonus chars
      const password =
        'AXC!@#dmf496GWIjrl780MN$zpQRS!tuVWX%ywAPC!@#dmf496GWI';
      const result = PasswordSecurity.validateStrength(password);

      expect(result.score).toBeLessThanOrEqual(5);
    });
  });

  // -------------------------------------------------------
  // hasBeenUsedBefore
  // -------------------------------------------------------
  describe('hasBeenUsedBefore', () => {
    it('should return true when password matches a history entry', async () => {
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([
        { id: 'ph-1', hashedPassword: 'hashed_OldPass1!xxxx', createdAt: new Date() },
      ]);

      const result = await PasswordSecurity.hasBeenUsedBefore(
        'user-1',
        'OldPass1!xxxx'
      );

      expect(result).toBe(true);
      expect(mockDb.passwordHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });

    it('should return false when password does not match any history entry', async () => {
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([
        { id: 'ph-1', hashedPassword: 'hashed_different', createdAt: new Date() },
      ]);

      const result = await PasswordSecurity.hasBeenUsedBefore(
        'user-1',
        'BrandNewPass1!'
      );

      expect(result).toBe(false);
    });

    it('should return false when password history is empty', async () => {
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([]);

      const result = await PasswordSecurity.hasBeenUsedBefore(
        'user-1',
        'AnyPass1!'
      );

      expect(result).toBe(false);
    });

    it('should return false on database error', async () => {
      mockDb.passwordHistory.findMany.mockRejectedValueOnce(
        new Error('DB connection failed')
      );

      const result = await PasswordSecurity.hasBeenUsedBefore(
        'user-1',
        'SomePass'
      );

      expect(result).toBe(false);
    });

    it('should respect the custom limit parameter', async () => {
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([]);

      await PasswordSecurity.hasBeenUsedBefore('user-1', 'SomePass', 10);

      expect(mockDb.passwordHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  // -------------------------------------------------------
  // saveToHistory
  // -------------------------------------------------------
  describe('saveToHistory', () => {
    it('should create a password history record', async () => {
      mockDb.passwordHistory.create.mockResolvedValueOnce({});
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([]);

      await PasswordSecurity.saveToHistory('user-1', 'hashed_password');

      expect(mockDb.passwordHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          hashedPassword: 'hashed_password',
        },
      });
    });

    it('should clean up old entries beyond the 10-record limit', async () => {
      mockDb.passwordHistory.create.mockResolvedValueOnce({});
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([
        { id: 'old-1' },
        { id: 'old-2' },
      ]);
      mockDb.passwordHistory.deleteMany.mockResolvedValueOnce({ count: 2 });

      await PasswordSecurity.saveToHistory('user-1', 'hashed_password');

      expect(mockDb.passwordHistory.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['old-1', 'old-2'] } },
      });
    });

    it('should not delete when there are no excess history entries', async () => {
      mockDb.passwordHistory.create.mockResolvedValueOnce({});
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([]);

      await PasswordSecurity.saveToHistory('user-1', 'hashed_password');

      expect(mockDb.passwordHistory.deleteMany).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // generateSecurePassword
  // -------------------------------------------------------
  describe('generateSecurePassword', () => {
    it('should generate a password of the specified length', () => {
      const password = PasswordSecurity.generateSecurePassword(20);

      expect(password.length).toBe(20);
    });

    it('should default to 16 characters when no length is provided', () => {
      const password = PasswordSecurity.generateSecurePassword();

      expect(password.length).toBe(16);
    });

    it('should include at least one uppercase, lowercase, number, and special character', () => {
      // Run multiple times to reduce flakiness from shuffling
      for (let i = 0; i < 10; i++) {
        const password = PasswordSecurity.generateSecurePassword();

        expect(password).toMatch(/[A-Z]/);
        expect(password).toMatch(/[a-z]/);
        expect(password).toMatch(/[0-9]/);
        expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
      }
    });
  });

  // -------------------------------------------------------
  // shouldChangePassword
  // -------------------------------------------------------
  describe('shouldChangePassword', () => {
    it('should return true when user has no passwordChangedAt date', async () => {
      (mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce({
        passwordChangedAt: null,
      });

      const result = await PasswordSecurity.shouldChangePassword('user-1');

      expect(result).toBe(true);
    });

    it('should return true when password is older than the max age', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      (mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce({
        passwordChangedAt: oldDate,
      });

      const result = await PasswordSecurity.shouldChangePassword('user-1', 90);

      expect(result).toBe(true);
    });

    it('should return false when password was recently changed', async () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      (mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce({
        passwordChangedAt: recentDate,
      });

      const result = await PasswordSecurity.shouldChangePassword('user-1', 90);

      expect(result).toBe(false);
    });

    it('should return true when user is not found', async () => {
      (mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await PasswordSecurity.shouldChangePassword('nonexistent');

      expect(result).toBe(true);
    });

    it('should return false on database error', async () => {
      (mockDb.user.findUnique as jest.Mock).mockRejectedValueOnce(
        new Error('DB error')
      );

      const result = await PasswordSecurity.shouldChangePassword('user-1');

      expect(result).toBe(false);
    });
  });

  // -------------------------------------------------------
  // updatePassword
  // -------------------------------------------------------
  describe('updatePassword', () => {
    it('should return failure when user is not found', async () => {
      (mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await PasswordSecurity.updatePassword(
        'user-1',
        'oldPass',
        'NewStrongPass1!'
      );

      expect(result).toEqual({
        success: false,
        message: 'User not found',
      });
    });

    it('should return failure when current password is incorrect', async () => {
      (mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce({
        password: 'hashed_correctOldPassword',
        email: 'user@test.com',
        name: 'Test',
      });
      mockDb.enhancedAuditLog.create.mockResolvedValueOnce({});

      const result = await PasswordSecurity.updatePassword(
        'user-1',
        'wrongPassword',
        'NewStrongPass1!'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Current password is incorrect');
      expect(mockDb.enhancedAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PASSWORD_CHANGE_FAILED',
          }),
        })
      );
    });

    it('should return failure when new password does not meet strength requirements', async () => {
      (mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce({
        password: 'hashed_OldPass9!xxzz',
        email: 'user@test.com',
        name: 'Test',
      });

      const result = await PasswordSecurity.updatePassword(
        'user-1',
        'OldPass9!xxzz',
        'weak'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Password does not meet requirements');
    });

    it('should return failure when password has been used before', async () => {
      (mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce({
        password: 'hashed_OldPass9!xxzz',
        email: 'user@test.com',
        name: 'Test',
      });
      // hasBeenUsedBefore call
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([
        {
          id: 'ph-1',
          hashedPassword: 'hashed_Xk9!mRtQ7@wLpN2#',
          createdAt: new Date(),
        },
      ]);

      const result = await PasswordSecurity.updatePassword(
        'user-1',
        'OldPass9!xxzz',
        'Xk9!mRtQ7@wLpN2#'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('has been used recently');
    });

    it('should succeed when all checks pass', async () => {
      (mockDb.user.findUnique as jest.Mock).mockResolvedValueOnce({
        password: 'hashed_OldPass9!xxzz',
        email: 'user@test.com',
        name: 'Test',
      });
      // hasBeenUsedBefore - no matches
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([]);
      // updatePassword db calls
      (mockDb.user.update as jest.Mock).mockResolvedValueOnce({});
      // saveToHistory: create + findMany for cleanup
      mockDb.passwordHistory.create.mockResolvedValueOnce({});
      mockDb.passwordHistory.findMany.mockResolvedValueOnce([]);
      mockDb.enhancedAuditLog.create.mockResolvedValueOnce({});

      const result = await PasswordSecurity.updatePassword(
        'user-1',
        'OldPass9!xxzz',
        'Xk9!mRtQ7@wLpN2#'
      );

      expect(result).toEqual({
        success: true,
        message: 'Password updated successfully',
      });
      expect(mockDb.user.update).toHaveBeenCalled();
      expect(mockDb.enhancedAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PASSWORD_CHANGED',
          }),
        })
      );
    });
  });

  // -------------------------------------------------------
  // Helper functions
  // -------------------------------------------------------
  describe('getPasswordStrengthColor', () => {
    it('should return the correct color for each strength level', () => {
      expect(getPasswordStrengthColor('weak')).toBe('red');
      expect(getPasswordStrengthColor('fair')).toBe('orange');
      expect(getPasswordStrengthColor('good')).toBe('yellow');
      expect(getPasswordStrengthColor('strong')).toBe('green');
      expect(getPasswordStrengthColor('excellent')).toBe('emerald');
    });

    it('should return gray for an unknown strength', () => {
      // Force an invalid value for the default branch
      const result = getPasswordStrengthColor(
        'unknown' as 'weak' | 'fair' | 'good' | 'strong' | 'excellent'
      );

      expect(result).toBe('gray');
    });
  });

  describe('getPasswordStrengthWidth', () => {
    it('should return the correct percentage string', () => {
      expect(getPasswordStrengthWidth(0)).toBe('0%');
      expect(getPasswordStrengthWidth(2.5)).toBe('50%');
      expect(getPasswordStrengthWidth(5)).toBe('100%');
    });
  });
});
