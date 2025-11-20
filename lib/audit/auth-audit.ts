/**
 * Authentication Audit Logging System
 * Comprehensive audit logging for all authentication events in Taxomind LMS
 * Integrates with existing SOC2 compliant audit infrastructure
 */

// import { headers } from 'next/headers'; // Removed - causes build error
import { AdminRole } from '@prisma/client';
import { auditLogger, AuditEventType, AuditSeverity, AuditContext, AuditMetadata } from '@/lib/compliance/audit-logger';
import { db } from '@/lib/db';

// Enhanced authentication event types
export enum AuthEventType {
  // Sign-in events
  SIGN_IN_SUCCESS = 'SIGN_IN_SUCCESS',
  SIGN_IN_FAILED = 'SIGN_IN_FAILED',
  SIGN_IN_BLOCKED = 'SIGN_IN_BLOCKED',
  SIGN_IN_RATE_LIMITED = 'SIGN_IN_RATE_LIMITED',
  
  // Sign-out events
  SIGN_OUT_SUCCESS = 'SIGN_OUT_SUCCESS',
  SIGN_OUT_FORCED = 'SIGN_OUT_FORCED',
  
  // Registration events
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_CREATION_FAILED = 'ACCOUNT_CREATION_FAILED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  
  // Password events
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  PASSWORD_RESET_FAILED = 'PASSWORD_RESET_FAILED',
  
  // Email verification
  EMAIL_VERIFICATION_SENT = 'EMAIL_VERIFICATION_SENT',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  EMAIL_VERIFICATION_FAILED = 'EMAIL_VERIFICATION_FAILED',
  
  // Two-Factor Authentication
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  TWO_FACTOR_CODE_SENT = 'TWO_FACTOR_CODE_SENT',
  TWO_FACTOR_VERIFIED = 'TWO_FACTOR_VERIFIED',
  TWO_FACTOR_FAILED = 'TWO_FACTOR_FAILED',
  
  // Role and permission changes
  ROLE_CHANGED = 'ROLE_CHANGED',
  ROLE_ESCALATION = 'ROLE_ESCALATION',
  INSTRUCTOR_REQUEST = 'INSTRUCTOR_REQUEST',
  INSTRUCTOR_APPROVED = 'INSTRUCTOR_APPROVED',
  INSTRUCTOR_REJECTED = 'INSTRUCTOR_REJECTED',
  
  // Security events
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  MULTIPLE_FAILED_LOGINS = 'MULTIPLE_FAILED_LOGINS',
  UNUSUAL_LOCATION = 'UNUSUAL_LOCATION',
  SESSION_HIJACK_DETECTED = 'SESSION_HIJACK_DETECTED',
  BRUTE_FORCE_DETECTED = 'BRUTE_FORCE_DETECTED',
  
  // OAuth events
  OAUTH_LOGIN_SUCCESS = 'OAUTH_LOGIN_SUCCESS',
  OAUTH_LOGIN_FAILED = 'OAUTH_LOGIN_FAILED',
  OAUTH_ACCOUNT_LINKED = 'OAUTH_ACCOUNT_LINKED',
  OAUTH_ACCOUNT_UNLINKED = 'OAUTH_ACCOUNT_UNLINKED',
}

// Authentication context interface
interface AuthAuditContext extends AuditContext {
  provider?: string;
  loginMethod?: string;
  deviceInfo?: string;
  locationInfo?: string;
  previousRole?: AdminRole;
  newRole?: AdminRole;
  failureReason?: string;
  attemptCount?: number;
  timeWindow?: string;
}

class AuthenticationAuditLogger {
  private static instance: AuthenticationAuditLogger;
  
  private constructor() {}
  
  static getInstance(): AuthenticationAuditLogger {
    if (!AuthenticationAuditLogger.instance) {
      AuthenticationAuditLogger.instance = new AuthenticationAuditLogger();
    }
    return AuthenticationAuditLogger.instance;
  }

  /**
   * Extract enhanced context for authentication events
   */
  private async getAuthContext(additionalContext?: Partial<AuthAuditContext>): Promise<AuthAuditContext> {
    try {
      // Headers not available in server actions called from client components
      // Using fallback values for now
      
      const context: AuthAuditContext = {
        ipAddress: 'unknown', // Headers not available in server actions
        userAgent: 'unknown', // Headers not available in server actions
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: undefined,
        deviceInfo: this.parseDeviceInfo(null),
        ...additionalContext,
      };
      
      return context;
    } catch (error) {
      console.error('Error extracting auth context:', error);
      return {
        ipAddress: 'unknown',
        userAgent: 'unknown',
        requestId: `error_${Date.now()}`,
        ...additionalContext,
      };
    }
  }

  /**
   * Parse device information from user agent
   */
  private parseDeviceInfo(userAgent?: string | null): string {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    let device = 'unknown';
    
    if (ua.includes('mobile')) device = 'mobile';
    else if (ua.includes('tablet')) device = 'tablet';
    else if (ua.includes('desktop') || ua.includes('windows') || ua.includes('mac')) device = 'desktop';
    
    let browser = 'unknown';
    if (ua.includes('chrome')) browser = 'chrome';
    else if (ua.includes('firefox')) browser = 'firefox';
    else if (ua.includes('safari')) browser = 'safari';
    else if (ua.includes('edge')) browser = 'edge';
    
    return `${device}/${browser}`;
  }

  /**
   * Detect if login attempt is suspicious
   */
  private async detectSuspiciousActivity(
    userId?: string, 
    email?: string, 
    ipAddress?: string
  ): Promise<{ isSuspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    const timeWindow = new Date(Date.now() - 15 * 60 * 1000); // Last 15 minutes

    try {
      // Check for multiple failed logins
      const recentFailures = await db.auditLog.count({
        where: {
          eventType: AuditEventType.USER_LOGIN_FAILED,
          timestamp: { gte: timeWindow },
          OR: [
            { userId: userId || undefined },
            { userEmail: email || undefined },
            { ipAddress: ipAddress || undefined },
          ],
        },
      });

      if (recentFailures >= 3) {
        reasons.push(`${recentFailures} failed login attempts in 15 minutes`);
      }

      // Check for logins from multiple IPs for same user
      if (userId) {
        const recentIPs = await db.auditLog.findMany({
          where: {
            userId,
            eventType: AuditEventType.USER_LOGIN,
            timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
          },
          select: { ipAddress: true },
          distinct: ['ipAddress'],
        });

        if (recentIPs.length > 2) {
          reasons.push(`Login from ${recentIPs.length} different IPs in 1 hour`);
        }
      }

      // Check for rapid successive login attempts
      const rapidAttempts = await db.auditLog.count({
        where: {
          eventType: {
            in: [AuditEventType.USER_LOGIN, AuditEventType.USER_LOGIN_FAILED],
          },
          timestamp: { gte: new Date(Date.now() - 2 * 60 * 1000) }, // Last 2 minutes
          OR: [
            { userEmail: email || undefined },
            { ipAddress: ipAddress || undefined },
          ],
        },
      });

      if (rapidAttempts >= 5) {
        reasons.push(`${rapidAttempts} login attempts in 2 minutes`);
      }

      return {
        isSuspicious: reasons.length > 0,
        reasons,
      };
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return { isSuspicious: false, reasons: [] };
    }
  }

  /**
   * Log successful sign-in event
   */
  async logSignInSuccess(
    userId: string,
    email: string,
    provider: string = 'credentials',
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userId,
      userEmail: email,
      provider,
      loginMethod: provider,
      ...additionalContext,
    });

    const suspiciousCheck = await this.detectSuspiciousActivity(userId, email, context.ipAddress);
    
    await auditLogger.log(
      AuditEventType.USER_LOGIN,
      suspiciousCheck.isSuspicious ? AuditSeverity.WARNING : AuditSeverity.INFO,
      `User ${email} signed in successfully via ${provider}${suspiciousCheck.isSuspicious ? ' (suspicious activity detected)' : ''}`,
      context,
      {
        resourceType: 'USER',
        resourceId: userId,
        complianceFlags: suspiciousCheck.isSuspicious ? ['SUSPICIOUS_ACTIVITY'] : [],
        ...(suspiciousCheck.isSuspicious && {
          reason: `Suspicious activity: ${suspiciousCheck.reasons.join(', ')}`,
        }),
      }
    );

    // Log additional suspicious activity event if detected
    if (suspiciousCheck.isSuspicious) {
      await this.logSuspiciousActivity(
        userId,
        email,
        'SUSPICIOUS_LOGIN',
        suspiciousCheck.reasons.join(', '),
        context
      );
    }
  }

  /**
   * Log failed sign-in attempt
   */
  async logSignInFailed(
    email: string,
    reason: string,
    provider: string = 'credentials',
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userEmail: email,
      provider,
      loginMethod: provider,
      failureReason: reason,
      ...additionalContext,
    });

    const suspiciousCheck = await this.detectSuspiciousActivity(undefined, email, context.ipAddress);
    
    await auditLogger.log(
      AuditEventType.USER_LOGIN_FAILED,
      suspiciousCheck.isSuspicious ? AuditSeverity.ERROR : AuditSeverity.WARNING,
      `Failed sign-in attempt for ${email} via ${provider}: ${reason}`,
      context,
      {
        resourceType: 'USER',
        resourceId: email,
        reason,
        complianceFlags: suspiciousCheck.isSuspicious ? ['BRUTE_FORCE_ATTEMPT'] : [],
      }
    );

    // Check for brute force attack
    if (suspiciousCheck.reasons.some(r => r.includes('failed login attempts'))) {
      await this.logSuspiciousActivity(
        undefined,
        email,
        'BRUTE_FORCE_DETECTED',
        `Multiple failed login attempts detected: ${suspiciousCheck.reasons.join(', ')}`,
        context
      );
    }
  }

  /**
   * Log sign-out event
   */
  async logSignOut(
    userId?: string,
    email?: string,
    forced: boolean = false,
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userId,
      userEmail: email,
      ...additionalContext,
    });

    await auditLogger.log(
      AuditEventType.USER_LOGOUT,
      forced ? AuditSeverity.WARNING : AuditSeverity.INFO,
      `User ${email || 'unknown'} signed out${forced ? ' (forced logout)' : ''}`,
      context,
      {
        resourceType: 'USER',
        resourceId: userId || email || 'unknown',
        ...(forced && { reason: 'Forced logout due to security policy' }),
      }
    );
  }

  /**
   * Log account creation
   */
  async logAccountCreated(
    userId: string,
    email: string,
    name?: string,
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userId,
      userEmail: email,
      ...additionalContext,
    });

    await auditLogger.log(
      AuditEventType.DATA_CREATE,
      AuditSeverity.INFO,
      `New user account created: ${name || email}`,
      context,
      {
        resourceType: 'USER',
        resourceId: userId,
        newValue: { email, name },
        complianceFlags: ['USER_REGISTRATION'],
      }
    );
  }

  /**
   * Log password change
   */
  async logPasswordChanged(
    userId: string,
    email: string,
    method: 'settings' | 'reset' = 'settings',
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userId,
      userEmail: email,
      ...additionalContext,
    });

    await auditLogger.log(
      AuditEventType.PASSWORD_RESET,
      AuditSeverity.INFO,
      `Password changed for user ${email} via ${method}`,
      context,
      {
        resourceType: 'USER',
        resourceId: userId,
        reason: `Password changed via ${method}`,
        complianceFlags: ['PASSWORD_CHANGE'],
      }
    );
  }

  /**
   * Log password reset request
   */
  async logPasswordResetRequested(
    email: string,
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userEmail: email,
      ...additionalContext,
    });

    await auditLogger.log(
      AuditEventType.PASSWORD_RESET,
      AuditSeverity.INFO,
      `Password reset requested for ${email}`,
      context,
      {
        resourceType: 'USER',
        resourceId: email,
        reason: 'Password reset token generated',
      }
    );
  }

  /**
   * Log email verification events
   */
  async logEmailVerification(
    email: string,
    verified: boolean,
    userId?: string,
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userId,
      userEmail: email,
      ...additionalContext,
    });

    await auditLogger.log(
      verified ? AuditEventType.DATA_UPDATE : AuditEventType.SECURITY_ALERT,
      verified ? AuditSeverity.INFO : AuditSeverity.WARNING,
      `Email ${verified ? 'verified' : 'verification failed'} for ${email}`,
      context,
      {
        resourceType: 'USER',
        resourceId: userId || email,
        newValue: verified ? { emailVerified: new Date() } : undefined,
        reason: verified ? 'Email verification successful' : 'Email verification failed',
      }
    );
  }

  /**
   * Log two-factor authentication events
   */
  async logTwoFactorEvent(
    userId: string,
    email: string,
    eventType: 'enabled' | 'disabled' | 'verified' | 'failed' | 'code_sent',
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userId,
      userEmail: email,
      ...additionalContext,
    });

    const eventTypeMap = {
      enabled: AuditEventType.TWO_FACTOR_ENABLED,
      disabled: AuditEventType.TWO_FACTOR_DISABLED,
      verified: AuditEventType.DATA_READ, // 2FA verification
      failed: AuditEventType.SECURITY_ALERT,
      code_sent: AuditEventType.DATA_CREATE, // 2FA code generation
    };

    const severityMap = {
      enabled: AuditSeverity.INFO,
      disabled: AuditSeverity.WARNING,
      verified: AuditSeverity.INFO,
      failed: AuditSeverity.WARNING,
      code_sent: AuditSeverity.INFO,
    };

    await auditLogger.log(
      eventTypeMap[eventType],
      severityMap[eventType],
      `Two-factor authentication ${eventType} for user ${email}`,
      context,
      {
        resourceType: 'USER',
        resourceId: userId,
        reason: `2FA ${eventType}`,
        complianceFlags: ['TWO_FACTOR_AUTH'],
      }
    );
  }

  /**
   * Log role change events
   */
  async logRoleChange(
    targetUserId: string,
    targetEmail: string,
    adminUserId: string,
    adminEmail: string,
    oldRole: AdminRole,
    newRole: AdminRole,
    reason?: string,
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userId: adminUserId,
      userEmail: adminEmail,
      previousRole: oldRole,
      newRole: newRole,
      ...additionalContext,
    });

    const isEscalation = this.isRoleEscalation(oldRole, newRole);

    await auditLogger.log(
      AuditEventType.USER_ROLE_CHANGED,
      isEscalation ? AuditSeverity.CRITICAL : AuditSeverity.WARNING,
      `Role changed for user ${targetEmail} from ${oldRole} to ${newRole} by admin ${adminEmail}${isEscalation ? ' (ROLE ESCALATION)' : ''}`,
      context,
      {
        resourceType: 'USER',
        resourceId: targetUserId,
        oldValue: { role: oldRole },
        newValue: { role: newRole },
        reason: reason || `Role change from ${oldRole} to ${newRole}`,
        affectedUsers: [targetUserId],
        complianceFlags: isEscalation ? ['ROLE_ESCALATION', 'CRITICAL_CHANGE'] : ['ROLE_CHANGE'],
      }
    );

    // Log additional role escalation event
    if (isEscalation) {
      await auditLogger.log(
        AuditEventType.PERMISSION_GRANTED,
        AuditSeverity.CRITICAL,
        `ROLE ESCALATION DETECTED: User ${targetEmail} escalated to ${newRole} by ${adminEmail}`,
        context,
        {
          resourceType: 'SECURITY',
          resourceId: 'role_escalation',
          reason: 'Critical role escalation requires review',
          complianceFlags: ['ROLE_ESCALATION', 'SECURITY_ALERT'],
        }
      );
    }
  }

  /**
   * Check if role change is an escalation
   */
  private isRoleEscalation(oldRole: AdminRole, newRole: AdminRole): boolean {
    const roleHierarchy = {
      [AdminRole.ADMIN]: 0,
      [AdminRole.SUPERADMIN]: 1,
    };

    return roleHierarchy[newRole] > roleHierarchy[oldRole];
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    userId?: string,
    email?: string,
    activityType: string = 'GENERAL_SUSPICIOUS',
    details?: string,
    context?: Partial<AuthAuditContext>
  ): Promise<void> {
    const fullContext = await this.getAuthContext({
      userId,
      userEmail: email,
      ...context,
    });

    await auditLogger.log(
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditSeverity.CRITICAL,
      `Suspicious activity detected for ${email || 'unknown user'}: ${activityType}${details ? ` - ${details}` : ''}`,
      fullContext,
      {
        resourceType: 'SECURITY',
        resourceId: 'suspicious_activity',
        reason: details || activityType,
        complianceFlags: ['SUSPICIOUS_ACTIVITY', 'SECURITY_ALERT'],
      }
    );
  }

  /**
   * Log OAuth events
   */
  async logOAuthEvent(
    userId: string,
    email: string,
    provider: string,
    eventType: 'success' | 'failed' | 'linked' | 'unlinked',
    additionalContext?: Partial<AuthAuditContext>
  ): Promise<void> {
    const context = await this.getAuthContext({
      userId,
      userEmail: email,
      provider,
      loginMethod: provider,
      ...additionalContext,
    });

    const severityMap = {
      success: AuditSeverity.INFO,
      failed: AuditSeverity.WARNING,
      linked: AuditSeverity.INFO,
      unlinked: AuditSeverity.WARNING,
    };

    await auditLogger.log(
      eventType === 'success' ? AuditEventType.USER_LOGIN : AuditEventType.DATA_UPDATE,
      severityMap[eventType],
      `OAuth ${eventType} for user ${email} with provider ${provider}`,
      context,
      {
        resourceType: 'USER',
        resourceId: userId,
        reason: `OAuth ${eventType} with ${provider}`,
        complianceFlags: ['OAUTH_AUTHENTICATION'],
      }
    );
  }

  /**
   * Generate security alert summary for admins
   */
  async generateSecurityAlerts(timeWindow: number = 24): Promise<any[]> {
    const startTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);

    try {
      const alerts = await db.auditLog.findMany({
        where: {
          timestamp: { gte: startTime },
          OR: [
            { eventType: AuditEventType.SUSPICIOUS_ACTIVITY },
            { eventType: AuditEventType.USER_LOGIN_FAILED },
            { eventType: AuditEventType.USER_ROLE_CHANGED },
            { riskScore: { gte: 70 } },
          ],
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      return alerts.map(alert => ({
        id: alert.id,
        timestamp: alert.timestamp,
        eventType: alert.eventType,
        severity: alert.severity,
        message: alert.message,
        userEmail: alert.userEmail,
        ipAddress: alert.ipAddress,
        riskScore: alert.riskScore,
      }));
    } catch (error) {
      console.error('Error generating security alerts:', error);
      return [];
    }
  }

  /**
   * Get authentication metrics for dashboard
   */
  async getAuthMetrics(timeWindow: number = 24): Promise<any> {
    const startTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);

    try {
      const [
        totalLogins,
        failedLogins,
        suspiciousActivities,
        roleChanges,
        newRegistrations,
      ] = await Promise.all([
        db.auditLog.count({
          where: {
            eventType: AuditEventType.USER_LOGIN,
            timestamp: { gte: startTime },
          },
        }),
        db.auditLog.count({
          where: {
            eventType: AuditEventType.USER_LOGIN_FAILED,
            timestamp: { gte: startTime },
          },
        }),
        db.auditLog.count({
          where: {
            eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
            timestamp: { gte: startTime },
          },
        }),
        db.auditLog.count({
          where: {
            eventType: AuditEventType.USER_ROLE_CHANGED,
            timestamp: { gte: startTime },
          },
        }),
        db.auditLog.count({
          where: {
            eventType: AuditEventType.DATA_CREATE,
            entityType: 'USER',
            timestamp: { gte: startTime },
          },
        }),
      ]);

      return {
        totalLogins,
        failedLogins,
        successRate: totalLogins > 0 ? ((totalLogins / (totalLogins + failedLogins)) * 100).toFixed(2) : 100,
        suspiciousActivities,
        roleChanges,
        newRegistrations,
        timeWindow: `${timeWindow}h`,
      };
    } catch (error) {
      console.error('Error getting auth metrics:', error);
      return {
        totalLogins: 0,
        failedLogins: 0,
        successRate: '0.00',
        suspiciousActivities: 0,
        roleChanges: 0,
        newRegistrations: 0,
        error: 'Failed to load metrics',
      };
    }
  }
}

// Export singleton instance and helper functions
export const authAudit = AuthenticationAuditLogger.getInstance();

// Convenience helper functions
export const authAuditHelpers = {
  // Sign-in/out helpers
  logSignInSuccess: (userId: string, email: string, provider?: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logSignInSuccess(userId, email, provider, context),
  
  logSignInFailed: (email: string, reason: string, provider?: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logSignInFailed(email, reason, provider, context),
  
  logSignOut: (userId?: string, email?: string, forced?: boolean, context?: Partial<AuthAuditContext>) =>
    authAudit.logSignOut(userId, email, forced, context),

  // Account management helpers
  logAccountCreated: (userId: string, email: string, name?: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logAccountCreated(userId, email, name, context),

  // Password helpers
  logPasswordChanged: (userId: string, email: string, method?: 'settings' | 'reset', context?: Partial<AuthAuditContext>) =>
    authAudit.logPasswordChanged(userId, email, method, context),
  
  logPasswordResetRequested: (email: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logPasswordResetRequested(email, context),

  // Email verification helpers
  logEmailVerified: (email: string, userId?: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logEmailVerification(email, true, userId, context),
  
  logEmailVerificationFailed: (email: string, userId?: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logEmailVerification(email, false, userId, context),

  // 2FA helpers
  logTwoFactorEnabled: (userId: string, email: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logTwoFactorEvent(userId, email, 'enabled', context),
  
  logTwoFactorDisabled: (userId: string, email: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logTwoFactorEvent(userId, email, 'disabled', context),
  
  logTwoFactorVerified: (userId: string, email: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logTwoFactorEvent(userId, email, 'verified', context),
  
  logTwoFactorFailed: (userId: string, email: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logTwoFactorEvent(userId, email, 'failed', context),

  // Role change helpers
  logRoleChange: (
    targetUserId: string, 
    targetEmail: string, 
    adminUserId: string, 
    adminEmail: string, 
    oldRole: AdminRole, 
    newRole: AdminRole, 
    reason?: string,
    context?: Partial<AuthAuditContext>
  ) => authAudit.logRoleChange(targetUserId, targetEmail, adminUserId, adminEmail, oldRole, newRole, reason, context),

  // Security helpers
  logSuspiciousActivity: (userId?: string, email?: string, activityType?: string, details?: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logSuspiciousActivity(userId, email, activityType, details, context),

  // OAuth helpers
  logOAuthSuccess: (userId: string, email: string, provider: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logOAuthEvent(userId, email, provider, 'success', context),
  
  logOAuthFailed: (userId: string, email: string, provider: string, context?: Partial<AuthAuditContext>) =>
    authAudit.logOAuthEvent(userId, email, provider, 'failed', context),

  // Metrics and alerts
  getSecurityAlerts: (timeWindow?: number) => authAudit.generateSecurityAlerts(timeWindow),
  getAuthMetrics: (timeWindow?: number) => authAudit.getAuthMetrics(timeWindow),
};