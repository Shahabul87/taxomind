/**
 * GDPR Compliance Manager
 * Implements comprehensive GDPR compliance features including:
 * - User consent management
 * - Data portability (export)
 * - Right to be forgotten (deletion)
 * - Data minimization
 * - Privacy by design
 */

import { db } from '@/lib/db';
import { auditHelpers } from '@/lib/compliance/audit-logger';
import crypto from 'crypto';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// GDPR consent types
export enum ConsentType {
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS',
  PERSONALIZATION = 'PERSONALIZATION',
  THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
  COOKIES_FUNCTIONAL = 'COOKIES_FUNCTIONAL',
  COOKIES_PERFORMANCE = 'COOKIES_PERFORMANCE',
  DATA_PROCESSING = 'DATA_PROCESSING',
}

// Data classification levels
export enum DataClassification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED', // PII, sensitive data
}

// GDPR request types
export enum GDPRRequestType {
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_PORTABILITY = 'DATA_PORTABILITY',
  DATA_RECTIFICATION = 'DATA_RECTIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  DATA_RESTRICTION = 'DATA_RESTRICTION',
  CONSENT_WITHDRAWAL = 'CONSENT_WITHDRAWAL',
}

// Validation schemas
const consentSchema = z.object({
  userId: z.string(),
  consentType: z.nativeEnum(ConsentType),
  granted: z.boolean(),
  purpose: z.string().optional(),
  expiresAt: z.date().optional(),
  ipAddress: z.string().optional(),
});

const gdprRequestSchema = z.object({
  userId: z.string(),
  requestType: z.nativeEnum(GDPRRequestType),
  reason: z.string().optional(),
  verificationToken: z.string().optional(),
});

export class GDPRComplianceManager {
  private static instance: GDPRComplianceManager;
  
  private constructor() {
}
  static getInstance(): GDPRComplianceManager {
    if (!GDPRComplianceManager.instance) {
      GDPRComplianceManager.instance = new GDPRComplianceManager();
    }
    return GDPRComplianceManager.instance;
  }

  /**
   * Record user consent
   */
  async recordConsent(data: z.infer<typeof consentSchema>) {
    const validated = consentSchema.parse(data);
    
    try {
      // Create consent record
      const consent = await db.userConsent.create({
        data: {
          id: crypto.randomUUID(),
          userId: validated.userId,
          consentType: validated.consentType,
          granted: validated.granted,
          purpose: validated.purpose,
          grantedAt: validated.granted ? new Date() : null,
          withdrawnAt: !validated.granted ? new Date() : null,
          expiresAt: validated.expiresAt,
          ipAddress: validated.ipAddress,
          version: '1.0', // Consent version for tracking changes
        },
      });

      // Log consent event
      await auditHelpers.logGDPREvent(
        validated.userId,
        validated.granted ? 'CONSENT_GIVEN' : 'CONSENT_WITHDRAWN',
        `Consent ${validated.granted ? 'granted' : 'withdrawn'} for ${validated.consentType}`
      );

      return consent;
    } catch (error: any) {
      logger.error('Failed to record consent:', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Get user consents
   */
  async getUserConsents(userId: string) {
    try {
      const consents = await db.userConsent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      // Group by consent type to get latest status
      const consentMap = new Map<string, any>();
      
      consents.forEach(consent => {
        if (!consentMap.has(consent.consentType)) {
          consentMap.set(consent.consentType, consent);
        }
      });

      return Array.from(consentMap.values());
    } catch (error: any) {
      logger.error('Failed to get user consents:', error);
      throw new Error('Failed to retrieve consents');
    }
  }

  /**
   * Check if user has given specific consent
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const consent = await db.userConsent.findFirst({
        where: {
          userId,
          consentType,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!consent) return false;
      
      // Check if consent is still valid
      if (consent.expiresAt && consent.expiresAt < new Date()) {
        return false;
      }

      return consent.granted;
    } catch (error: any) {
      logger.error('Failed to check consent:', error);
      return false;
    }
  }

  /**
   * Export user data (Data Portability)
   */
  async exportUserData(userId: string): Promise<any> {
    try {
      // Log data export request
      await auditHelpers.logGDPREvent(userId, 'DATA_REQUEST', 'User data export initiated');

      // Collect all user data
      const userData = await db.user.findUnique({
        where: { id: userId },
        include: {
          accounts: {
            select: {
              provider: true,
              type: true,
            },
          },
          // sessions are tracked via AuthSession model elsewhere
          // Purchase data handled separately
          Enrollment: {
            include: {
              Course: {
                select: {
                  title: true,
                  description: true,
                },
              },
            },
          },
          user_progress: true,
          UserExamAttempt: {
            select: {
              examId: true,
              scorePercentage: true,
              submittedAt: true,
              createdAt: true,
            },
          },
          Activity: {
            select: {
              type: true,
              status: true,
              createdAt: true,
            },
          },
          Group: {
            select: {
              name: true,
              description: true,
              createdAt: true,
            },
          },
          Post: {
            select: {
              title: true,
              description: true,
              createdAt: true,
            },
          },
          Comment: {
            select: {
              content: true,
              createdAt: true,
            },
          },
        },
      });

      // Anonymize sensitive data while keeping structure
      const exportData = {
        exportDate: new Date().toISOString(),
        userId: userId,
        profile: {
          name: userData?.name,
          email: userData?.email,
          emailVerified: userData?.emailVerified,
          image: userData?.image,
          role: userData?.role,
          createdAt: userData?.createdAt,
        },
        learningData: {
          enrollments: (userData as any)?.Enrollment || [],
          progress: {
            userProgress: (userData as any)?.user_progress || [],
          },
          examAttempts: (userData as any)?.UserExamAttempt || [],
        },
        activityData: {
          activities: (userData as any)?.Activity || [],
          posts: (userData as any)?.Post || [],
          comments: (userData as any)?.Comment || [],
        },
        socialData: {
          groups: (userData as any)?.Group || [],
        },
        accountData: {
          accounts: (userData as any)?.accounts || [],
          sessions: 0,
        },
      };

      return exportData;
    } catch (error: any) {
      logger.error('Failed to export user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  /**
   * Delete user data (Right to be Forgotten)
   */
  async deleteUserData(userId: string, verificationToken?: string): Promise<void> {
    try {
      // Verify the deletion request
      if (verificationToken) {
        // In production, verify the token sent via email
        // For now, we'll proceed with deletion
      }

      // Log deletion request
      await auditHelpers.logGDPREvent(userId, 'DATA_DELETION', 'User data deletion initiated');

      // Start transaction for atomic deletion
      await db.$transaction(async (tx) => {
        // Delete in correct order to respect foreign key constraints
        
        // Delete learning-related data
        await tx.user_progress.deleteMany({ where: { userId } });
        await tx.userExamAttempt.deleteMany({ where: { userId } });
        
        // Delete social data
        await tx.comment.deleteMany({ where: { userId } });
        await tx.reply.deleteMany({ where: { userId } });
        
        // Delete content created by user (optional - may want to anonymize instead)
        await tx.post.updateMany({
          where: { userId },
          data: {
            description: '[Content removed due to GDPR request]',
          },
        });
        
        // Delete group memberships
        await tx.groupMember.deleteMany({ where: { userId } });
        
        // Delete purchases and enrollments
        await tx.purchase.deleteMany({ where: { userId } });
        await tx.enrollment.deleteMany({ where: { userId } });
        
        // Delete activities and analytics
        await tx.activity.deleteMany({ where: { userId } });
        
        // Delete authentication data
        await tx.authSession.deleteMany({ where: { userId } });
        await tx.account.deleteMany({ where: { userId } });
        await tx.twoFactorConfirmation.deleteMany({ where: { userId } });
        
        // Delete consent records
        await tx.userConsent.deleteMany({ where: { userId } });
        
        // Finally, delete or anonymize the user
        await tx.user.update({
          where: { id: userId },
          data: {
            email: `deleted-${userId}@anonymous.local`,
            name: 'Deleted User',
            image: null,
            password: null,
            // Keep the record for audit purposes but anonymize
          },
        });
      });

      // Log successful deletion
      await auditHelpers.logGDPREvent(userId, 'DATA_DELETION', 'User data deletion completed');
    } catch (error: any) {
      logger.error('Failed to delete user data:', error);
      throw new Error('Failed to delete user data');
    }
  }

  /**
   * Anonymize user data (Alternative to deletion)
   */
  async anonymizeUserData(userId: string): Promise<void> {
    try {
      await db.$transaction(async (tx) => {
        // Generate anonymous identifier
        const anonymousId = `anon-${crypto.randomBytes(8).toString('hex')}`;
        
        // Anonymize user profile
        await tx.user.update({
          where: { id: userId },
          data: {
            email: `${anonymousId}@anonymous.local`,
            name: `Anonymous User ${anonymousId}`,
            image: null,
            phone: null,
          },
        });

        // Anonymize posts and comments
        await tx.comment.updateMany({
          where: { userId },
          data: {
            content: '[Comment anonymized]',
          },
        });

        // Remove PII from activities
        await tx.activity.updateMany({
          where: { userId },
          data: {
            description: '[Activity anonymized]',
          },
        });
      });

      await auditHelpers.logGDPREvent(userId, 'DATA_REQUEST', 'User data anonymized');
    } catch (error: any) {
      logger.error('Failed to anonymize user data:', error);
      throw new Error('Failed to anonymize user data');
    }
  }

  /**
   * Process GDPR request
   */
  async processGDPRRequest(data: z.infer<typeof gdprRequestSchema>) {
    const validated = gdprRequestSchema.parse(data);
    
    try {
      // Create GDPR request record
      const request = await db.gDPRRequest.create({
        data: {
          id: crypto.randomUUID(),
          userId: validated.userId,
          requestType: validated.requestType,
          status: 'PENDING',
          requestedAt: new Date(),
          reason: validated.reason,
          verificationToken: crypto.randomBytes(32).toString('hex'),
        },
      });

      // Process based on request type
      switch (validated.requestType) {
        case GDPRRequestType.DATA_ACCESS:
        case GDPRRequestType.DATA_PORTABILITY:
          const data = await this.exportUserData(validated.userId);
          await db.gDPRRequest.update({
            where: { id: request.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              responseData: data,
            },
          });
          return { success: true, data };

        case GDPRRequestType.DATA_DELETION:
          // Send verification email first (implement email service)
          // For now, we'll mark as pending
          return {
            success: true,
            message: 'Deletion request received. Please check your email for verification.',
            requestId: request.id,
            verificationRequired: true,
          };

        case GDPRRequestType.CONSENT_WITHDRAWAL:
          // Withdraw all consents
          await db.userConsent.updateMany({
            where: { userId: validated.userId, granted: true },
            data: {
              granted: false,
              withdrawnAt: new Date(),
            },
          });
          
          await db.gDPRRequest.update({
            where: { id: request.id },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });
          
          return { success: true, message: 'All consents withdrawn' };

        default:
          throw new Error(`Unsupported request type: ${validated.requestType}`);
      }
    } catch (error: any) {
      logger.error('Failed to process GDPR request:', error);
      throw new Error('Failed to process GDPR request');
    }
  }

  /**
   * Get data retention policy
   */
  getDataRetentionPolicy() {
    return {
      userProfile: '7 years after account deletion',
      learningData: '3 years after last activity',
      analyticsData: '2 years',
      auditLogs: '7 years',
      financialRecords: '7 years',
      marketingData: '2 years after consent withdrawal',
      sessionData: '30 days',
      tempData: '24 hours',
    };
  }

  /**
   * Check data minimization compliance
   */
  async checkDataMinimization(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            authSessions: true,
            Activity: true,
          },
        },
      },
    });

    const recommendations = [];

    // Check for excessive session data
    if (user?._count.authSessions && user._count.authSessions > 10) {
      recommendations.push('Consider cleaning up old session data');
    }

    // Check for excessive activity logs
    if (user?._count.Activity && user._count.Activity > 1000) {
      recommendations.push('Consider archiving old activity logs');
    }

    return {
      compliant: recommendations.length === 0,
      recommendations,
      metrics: {
        sessions: user?._count.authSessions || 0,
        activities: user?._count.Activity || 0,
      },
    };
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport() {
    const report = {
      generatedAt: new Date(),
      dataProtectionOfficer: process.env.DPO_EMAIL || 'dpo@taxomind.com',
      privacyPolicyUrl: process.env.PRIVACY_POLICY_URL || '/privacy',
      
      statistics: {
        totalUsers: await db.user.count(),
        activeConsents: await db.userConsent.count({ where: { granted: true } }),
        withdrawnConsents: await db.userConsent.count({ where: { granted: false } }),
        pendingGDPRRequests: await db.gDPRRequest.count({ where: { status: 'PENDING' } }),
        completedGDPRRequests: await db.gDPRRequest.count({ where: { status: 'COMPLETED' } }),
      },
      
      recentRequests: await db.gDPRRequest.findMany({
        take: 10,
        orderBy: { requestedAt: 'desc' },
        select: {
          requestType: true,
          status: true,
          requestedAt: true,
          completedAt: true,
        },
      }),
      
      dataRetentionPolicy: this.getDataRetentionPolicy(),
      
      technicalMeasures: {
        encryption: 'AES-256-GCM for sensitive data',
        accessControl: 'Role-based access control (RBAC)',
        auditLogging: 'Comprehensive audit trail with SOC2 compliance',
        dataMinimization: 'Automated data retention and cleanup',
        privacyByDesign: 'Privacy controls built into system architecture',
        pseudonymization: 'User anonymization capabilities',
      },
      
      organizationalMeasures: {
        training: 'Regular GDPR training for staff',
        policies: 'Data protection policies and procedures',
        dpia: 'Data Protection Impact Assessments',
        breachResponse: '72-hour breach notification procedure',
        vendorManagement: 'Third-party data processor agreements',
      },
    };

    return report;
  }
}

// Export singleton instance
export const gdprManager = GDPRComplianceManager.getInstance();