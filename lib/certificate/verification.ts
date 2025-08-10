import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { logger } from '@/lib/logger';

export interface VerificationResult {
  isValid: boolean;
  credentialType: 'certificate' | 'badge';
  data?: any;
  error?: string;
  verificationDetails?: {
    verifiedAt: Date;
    verificationId: string;
    verifierInfo?: any;
  };
}

export interface VerificationMetadata {
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  timestamp: Date;
  verificationMethod: 'qr_code' | 'manual_code' | 'url_link';
}

export class VerificationService {
  async verifyCredential(
    verificationCode: string,
    metadata?: VerificationMetadata
  ): Promise<VerificationResult> {
    try {
      // First try to verify as certificate
      const certificateResult = await this.verifyCertificate(verificationCode, metadata);
      if (certificateResult.isValid) {
        return certificateResult;
      }

      // Then try to verify as badge
      const badgeResult = await this.verifyBadge(verificationCode, metadata);
      if (badgeResult.isValid) {
        return badgeResult;
      }

      return {
        isValid: false,
        credentialType: 'certificate',
        error: 'Invalid verification code'
      };

    } catch (error) {
      logger.error('Verification error:', error);
      return {
        isValid: false,
        credentialType: 'certificate',
        error: 'Verification service error'
      };
    }
  }

  private async verifyCertificate(
    verificationCode: string,
    metadata?: VerificationMetadata
  ): Promise<VerificationResult> {
    const certificate = await db.certification.findUnique({
      where: { verificationCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        template: {
          select: {
            name: true,
            templateType: true
          }
        }
      }
    });

    if (!certificate) {
      return {
        isValid: false,
        credentialType: 'certificate',
        error: 'Certificate not found'
      };
    }

    // Check if certificate is revoked
    if (certificate.isRevoked) {
      return {
        isValid: false,
        credentialType: 'certificate',
        error: 'Certificate has been revoked',
        data: {
          revokedAt: certificate.revokedAt,
          revokedReason: certificate.revokedReason
        }
      };
    }

    // Check if certificate is expired
    if (certificate.expiresAt && certificate.expiresAt < new Date()) {
      return {
        isValid: false,
        credentialType: 'certificate',
        error: 'Certificate has expired',
        data: {
          expiresAt: certificate.expiresAt
        }
      };
    }

    // Log verification event
    const verificationId = nanoid();
    await db.certificateVerification.create({
      data: {
        id: verificationId,
        certificateId: certificate.id,
        verificationCode,
        verifierIp: metadata?.ipAddress || 'unknown',
        verifierInfo: {
          userAgent: metadata?.userAgent,
          location: metadata?.location,
          verificationMethod: metadata?.verificationMethod || 'manual_code',
          timestamp: metadata?.timestamp || new Date()
        },
        isValid: true,
        verifiedAt: new Date()
      }
    });

    return {
      isValid: true,
      credentialType: 'certificate',
      data: {
        certificate,
        recipient: certificate.user,
        course: certificate.course,
        template: certificate.template
      },
      verificationDetails: {
        verifiedAt: new Date(),
        verificationId,
        verifierInfo: metadata
      }
    };
  }

  private async verifyBadge(
    verificationCode: string,
    metadata?: VerificationMetadata
  ): Promise<VerificationResult> {
    const userBadge = await db.userBadge.findUnique({
      where: { verificationCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        badge: {
          select: {
            id: true,
            name: true,
            description: true,
            badgeType: true,
            category: true,
            level: true,
            points: true,
            iconUrl: true,
            iconData: true,
            colorScheme: true
          }
        }
      }
    });

    if (!userBadge) {
      return {
        isValid: false,
        credentialType: 'badge',
        error: 'Badge not found'
      };
    }

    // Log verification event
    const verificationId = nanoid();
    await db.certificateVerification.create({
      data: {
        id: verificationId,
        badgeId: userBadge.id,
        verificationCode,
        verifierIp: metadata?.ipAddress || 'unknown',
        verifierInfo: {
          userAgent: metadata?.userAgent,
          location: metadata?.location,
          verificationMethod: metadata?.verificationMethod || 'manual_code',
          timestamp: metadata?.timestamp || new Date()
        },
        isValid: true,
        verifiedAt: new Date()
      }
    });

    return {
      isValid: true,
      credentialType: 'badge',
      data: {
        badge: userBadge.badge,
        recipient: userBadge.user,
        earnedAt: userBadge.earnedAt,
        progress: userBadge.progress
      },
      verificationDetails: {
        verifiedAt: new Date(),
        verificationId,
        verifierInfo: metadata
      }
    };
  }

  async generateVerificationQR(
    verificationCode: string,
    baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ): Promise<string> {
    const verificationUrl = `${baseUrl}/verify/${verificationCode}`;
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      });

      return qrCodeDataUrl;
    } catch (error) {
      logger.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async getVerificationHistory(
    credentialId: string,
    credentialType: 'certificate' | 'badge'
  ): Promise<any[]> {
    const whereClause = credentialType === 'certificate' 
      ? { certificateId: credentialId }
      : { badgeId: credentialId };

    return await db.certificateVerification.findMany({
      where: whereClause,
      orderBy: { verifiedAt: 'desc' },
      take: 100 // Limit to recent 100 verifications
    });
  }

  async getVerificationAnalytics(
    credentialId: string,
    credentialType: 'certificate' | 'badge'
  ): Promise<any> {
    const whereClause = credentialType === 'certificate' 
      ? { certificateId: credentialId }
      : { badgeId: credentialId };

    const verifications = await db.certificateVerification.findMany({
      where: whereClause,
      orderBy: { verifiedAt: 'desc' }
    });

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const analytics = {
      totalVerifications: verifications.length,
      verifiedThisWeek: verifications.filter(v => v.verifiedAt >= lastWeek).length,
      verifiedThisMonth: verifications.filter(v => v.verifiedAt >= lastMonth).length,
      lastVerified: verifications[0]?.verifiedAt || null,
      verificationsByMethod: this.groupVerificationsByMethod(verifications),
      verificationsByDay: this.groupVerificationsByDay(verifications),
      uniqueVerifiers: this.countUniqueVerifiers(verifications)
    };

    return analytics;
  }

  private groupVerificationsByMethod(verifications: any[]): any {
    const methodCounts = verifications.reduce((acc, verification) => {
      const method = verification.verifierInfo?.verificationMethod || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    return methodCounts;
  }

  private groupVerificationsByDay(verifications: any[]): any[] {
    const dayGroups = verifications.reduce((acc, verification) => {
      const date = verification.verifiedAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(dayGroups)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private countUniqueVerifiers(verifications: any[]): number {
    const uniqueIPs = new Set(verifications.map(v => v.verifierIp));
    return uniqueIPs.size;
  }

  async bulkVerify(verificationCodes: string[]): Promise<VerificationResult[]> {
    const results = await Promise.all(
      verificationCodes.map(code => this.verifyCredential(code))
    );

    return results;
  }

  async createVerificationReport(
    credentialId: string,
    credentialType: 'certificate' | 'badge'
  ): Promise<any> {
    const analytics = await this.getVerificationAnalytics(credentialId, credentialType);
    const history = await this.getVerificationHistory(credentialId, credentialType);

    let credentialData;
    if (credentialType === 'certificate') {
      credentialData = await db.certification.findUnique({
        where: { id: credentialId },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true } }
        }
      });
    } else {
      credentialData = await db.userBadge.findUnique({
        where: { id: credentialId },
        include: {
          user: { select: { name: true, email: true } },
          badge: { select: { name: true, description: true } }
        }
      });
    }

    return {
      credential: credentialData,
      analytics,
      recentVerifications: history.slice(0, 20),
      reportGeneratedAt: new Date(),
      reportId: nanoid()
    };
  }
}

export const verificationService = new VerificationService();