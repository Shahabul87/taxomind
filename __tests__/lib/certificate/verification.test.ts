/**
 * Tests for Certificate Verification Service - lib/certificate/verification.ts
 *
 * Covers: verifyCredential, verifyCertificate, verifyBadge, getVerificationHistory,
 *         getVerificationAnalytics, bulkVerify, generateVerificationQR
 */

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-nano-id'),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,fake-qr-code')),
}));

// @/lib/db and @/lib/logger are globally mocked

import { VerificationService, verificationService } from '@/lib/certificate/verification';
import { db } from '@/lib/db';
import QRCode from 'qrcode';

// Add models not in global mock
for (const model of ['certification', 'certificateVerification', 'userBadge']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findUnique: jest.fn(),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(),
    };
  }
}

const mockCertification = (db as any).certification;
const mockCertVerification = (db as any).certificateVerification;
const mockUserBadge = (db as any).userBadge;

const MOCK_CERTIFICATE = {
  id: 'cert-1',
  verificationCode: 'VERIFY-123',
  isRevoked: false,
  revokedAt: null,
  revokedReason: null,
  expiresAt: null,
  user: { id: 'user-1', name: 'Student', email: 'student@test.com', image: null },
  course: { id: 'course-1', title: 'Test Course', description: 'Desc', imageUrl: null, user: { name: 'Teacher' } },
  template: { name: 'Default', templateType: 'COURSE_COMPLETION' },
};

const MOCK_BADGE = {
  id: 'badge-award-1',
  verificationCode: 'BADGE-456',
  earnedAt: new Date('2026-01-01'),
  progress: 100,
  user: { id: 'user-1', name: 'Student', email: 'student@test.com', image: null },
  badge: {
    id: 'badge-1', name: 'Quick Learner', description: 'Completed fast',
    badgeType: 'ACHIEVEMENT', category: 'LEARNING', level: 'GOLD',
    points: 100, iconUrl: null, iconData: null, colorScheme: null,
  },
};

describe('VerificationService', () => {
  let service: VerificationService;

  beforeEach(() => {
    service = new VerificationService();
    mockCertVerification.create.mockResolvedValue({ id: 'ver-1' });
  });

  describe('verifyCredential', () => {
    it('returns valid certificate when verification code matches', async () => {
      mockCertification.findUnique.mockResolvedValue(MOCK_CERTIFICATE);

      const result = await service.verifyCredential('VERIFY-123');

      expect(result.isValid).toBe(true);
      expect(result.credentialType).toBe('certificate');
      expect(result.data.recipient.name).toBe('Student');
      expect(result.data.course.title).toBe('Test Course');
      expect(result.verificationDetails).toBeDefined();
    });

    it('returns invalid for revoked certificate (revoked result not propagated through verifyCredential)', async () => {
      mockCertification.findUnique.mockResolvedValue({
        ...MOCK_CERTIFICATE,
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Fraud detected',
      });
      mockUserBadge.findUnique.mockResolvedValue(null);

      const result = await service.verifyCredential('VERIFY-123');

      // verifyCertificate returns isValid:false for revoked certs,
      // but verifyCredential only returns valid results, falling through to generic error
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid verification code');
    });

    it('returns invalid for expired certificate (expired result not propagated through verifyCredential)', async () => {
      mockCertification.findUnique.mockResolvedValue({
        ...MOCK_CERTIFICATE,
        expiresAt: new Date('2020-01-01'),
      });
      mockUserBadge.findUnique.mockResolvedValue(null);

      const result = await service.verifyCredential('VERIFY-123');

      // Same as revoked — verifyCertificate returns isValid:false,
      // verifyCredential falls through to generic error
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid verification code');
    });

    it('falls back to badge verification when certificate not found', async () => {
      mockCertification.findUnique.mockResolvedValue(null);
      mockUserBadge.findUnique.mockResolvedValue(MOCK_BADGE);

      const result = await service.verifyCredential('BADGE-456');

      expect(result.isValid).toBe(true);
      expect(result.credentialType).toBe('badge');
      expect(result.data.badge.name).toBe('Quick Learner');
    });

    it('returns invalid when neither certificate nor badge found', async () => {
      mockCertification.findUnique.mockResolvedValue(null);
      mockUserBadge.findUnique.mockResolvedValue(null);

      const result = await service.verifyCredential('INVALID-CODE');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid verification code');
    });

    it('handles errors gracefully', async () => {
      mockCertification.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await service.verifyCredential('VERIFY-123');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('service error');
    });

    it('logs verification event for valid certificate', async () => {
      mockCertification.findUnique.mockResolvedValue(MOCK_CERTIFICATE);

      await service.verifyCredential('VERIFY-123', {
        timestamp: new Date(),
        verificationMethod: 'qr_code',
        ipAddress: '127.0.0.1',
      });

      expect(mockCertVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            certificateId: 'cert-1',
            verificationCode: 'VERIFY-123',
            isValid: true,
          }),
        })
      );
    });
  });

  describe('generateVerificationQR', () => {
    it('generates QR code with verification URL', async () => {
      const qr = await service.generateVerificationQR('VERIFY-123');

      expect(qr).toContain('data:image/png');
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.stringContaining('/verify/VERIFY-123'),
        expect.any(Object)
      );
    });

    it('uses custom base URL', async () => {
      await service.generateVerificationQR('VERIFY-123', 'https://taxomind.com');

      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        'https://taxomind.com/verify/VERIFY-123',
        expect.any(Object)
      );
    });

    it('throws on QR generation failure', async () => {
      (QRCode.toDataURL as jest.Mock).mockRejectedValueOnce(new Error('QR error'));

      await expect(service.generateVerificationQR('VERIFY-123')).rejects.toThrow(
        'Failed to generate QR code'
      );
    });
  });

  describe('getVerificationHistory', () => {
    it('returns verification history for certificate', async () => {
      const mockHistory = [
        { id: 'v1', verifiedAt: new Date(), verifierIp: '1.2.3.4' },
        { id: 'v2', verifiedAt: new Date(), verifierIp: '5.6.7.8' },
      ];
      mockCertVerification.findMany.mockResolvedValue(mockHistory);

      const history = await service.getVerificationHistory('cert-1', 'certificate');

      expect(history).toHaveLength(2);
      expect(mockCertVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { certificateId: 'cert-1' },
          take: 100,
        })
      );
    });

    it('queries by badgeId for badge type', async () => {
      mockCertVerification.findMany.mockResolvedValue([]);

      await service.getVerificationHistory('badge-1', 'badge');

      expect(mockCertVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { badgeId: 'badge-1' },
        })
      );
    });
  });

  describe('getVerificationAnalytics', () => {
    it('returns analytics with counts', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const oldDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

      mockCertVerification.findMany.mockResolvedValue([
        { verifiedAt: recentDate, verifierIp: '1.2.3.4', verifierInfo: { verificationMethod: 'qr_code' } },
        { verifiedAt: recentDate, verifierIp: '5.6.7.8', verifierInfo: { verificationMethod: 'url_link' } },
        { verifiedAt: oldDate, verifierIp: '1.2.3.4', verifierInfo: { verificationMethod: 'qr_code' } },
      ]);

      const analytics = await service.getVerificationAnalytics('cert-1', 'certificate');

      expect(analytics.totalVerifications).toBe(3);
      expect(analytics.verifiedThisWeek).toBe(2);
      expect(analytics.uniqueVerifiers).toBe(2);
      expect(analytics.verificationsByMethod.qr_code).toBe(2);
    });
  });

  describe('bulkVerify', () => {
    it('verifies multiple codes in parallel', async () => {
      mockCertification.findUnique
        .mockResolvedValueOnce(MOCK_CERTIFICATE)
        .mockResolvedValueOnce(null);
      mockUserBadge.findUnique.mockResolvedValue(null);

      const results = await service.bulkVerify(['VERIFY-123', 'INVALID']);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });
  });
});

describe('verificationService singleton', () => {
  it('exports a singleton instance', () => {
    expect(verificationService).toBeInstanceOf(VerificationService);
  });
});
