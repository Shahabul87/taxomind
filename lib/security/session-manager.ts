import { db } from '@/lib/db';
import { 
  DeviceFingerprint, 
  FingerprintAnalysis, 
  calculateFingerprintSimilarity,
  generateFingerprintHash,
  generateDeviceId,
  generateDeviceName,
  extractServerFingerprint,
  defaultFingerprintConfig
} from './session-fingerprint';

export interface SessionValidationResult {
  isValid: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  changes: string[];
  shouldAlert: boolean;
  shouldForceReauth: boolean;
  fingerprintAnalysis?: FingerprintAnalysis;
}

export interface CreateSessionOptions {
  userId: string;
  sessionToken: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: any;
  clientFingerprint?: any;
}

/**
 * Session Manager for handling fingerprint-based security
 */
export class SessionManager {
  /**
   * Create a new session with fingerprinting
   */
  static async createSession(options: CreateSessionOptions): Promise<string | null> {
    try {
      // Extract server-side fingerprint
      const serverFingerprint = await extractServerFingerprint();
      
      // Merge with client fingerprint if provided
      const fullFingerprint: DeviceFingerprint = {
        userAgent: options.userAgent || serverFingerprint.userAgent || '',
        acceptHeader: serverFingerprint.acceptHeader || '',
        acceptLanguage: serverFingerprint.acceptLanguage || '',
        acceptEncoding: serverFingerprint.acceptEncoding || '',
        platform: options.clientFingerprint?.platform || '',
        timezone: options.clientFingerprint?.timezone || '',
        screenResolution: options.clientFingerprint?.screenResolution || '',
      };

      // Generate fingerprint hash and device ID
      const fingerprintHash = generateFingerprintHash(fullFingerprint);
      const deviceId = generateDeviceId(fullFingerprint, options.userId);
      const deviceName = generateDeviceName(fullFingerprint);

      // Check if this device was previously trusted
      const existingTrustedSession = await db.authSession.findFirst({
        where: {
          userId: options.userId,
          deviceId,
          isTrustedDevice: true,
          isActive: true,
        },
        orderBy: { lastActivity: 'desc' }
      });

      const isTrustedDevice = !!existingTrustedSession;

      // Create the session
      const session = await db.authSession.create({
        data: {
          userId: options.userId,
          token: options.sessionToken,
          userAgent: options.userAgent,
          ipAddress: options.ipAddress,
          deviceInfo: options.deviceInfo,
          fingerprintHash,
          fingerprintData: fullFingerprint,
          deviceId,
          deviceName,
          isTrustedDevice,
          trustEstablishedAt: isTrustedDevice ? new Date() : null,
          lastFingerprintCheck: new Date(),
          fingerprintMismatches: 0,
          riskLevel: 'LOW',
          expiresAt: options.expiresAt,
          lastActivity: new Date(),
        },
      });

      // Log session creation event
      await this.logSecurityEvent(
        options.userId,
        'SESSION_CREATED',
        'LOW',
        `New session created for device: ${deviceName}`,
        {
          sessionId: session.id,
          deviceId,
          isTrustedDevice,
          fingerprintHash,
        }
      );

      return session.id;
    } catch (error) {
      console.error('Failed to create session with fingerprint:', error);
      return null;
    }
  }

  /**
   * Validate session fingerprint on each request
   */
  static async validateSessionFingerprint(
    sessionToken: string,
    userId: string
  ): Promise<SessionValidationResult> {
    try {
      // Get current session
      const session = await db.authSession.findFirst({
        where: {
          token: sessionToken,
          userId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session || !session.fingerprintData || !session.fingerprintHash) {
        return {
          isValid: false,
          riskLevel: 'HIGH',
          changes: ['Session not found or missing fingerprint data'],
          shouldAlert: true,
          shouldForceReauth: true,
        };
      }

      // Extract current fingerprint
      const currentFingerprint = await extractServerFingerprint();
      const storedFingerprint = session.fingerprintData as DeviceFingerprint;

      // Calculate similarity
      const analysis = calculateFingerprintSimilarity(
        currentFingerprint as DeviceFingerprint,
        storedFingerprint,
        defaultFingerprintConfig
      );

      // Update session with fingerprint check
      const shouldAlert = analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'CRITICAL';
      const shouldForceReauth = analysis.riskLevel === 'CRITICAL' || !analysis.isMatch;
      
      const updatedMismatches = analysis.isMatch 
        ? 0 
        : session.fingerprintMismatches + 1;

      // Update session record
      await db.authSession.update({
        where: { id: session.id },
        data: {
          lastFingerprintCheck: new Date(),
          lastActivity: new Date(),
          fingerprintMismatches: updatedMismatches,
          riskLevel: analysis.riskLevel,
          isActive: shouldForceReauth ? false : session.isActive,
        },
      });

      // Log security events based on risk level
      if (shouldAlert) {
        await this.logSecurityEvent(
          userId,
          'FINGERPRINT_MISMATCH',
          analysis.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          `Fingerprint mismatch detected. Changes: ${analysis.changes.join(', ')}`,
          {
            sessionId: session.id,
            deviceId: session.deviceId,
            similarity: analysis.similarity,
            changes: analysis.changes,
            riskLevel: analysis.riskLevel,
            consecutiveMismatches: updatedMismatches,
          }
        );
      }

      // Force session termination on critical risk or too many mismatches
      if (shouldForceReauth || updatedMismatches >= 3) {
        await this.terminateSession(session.id, userId, 'SECURITY_POLICY');
        
        await this.logSecurityEvent(
          userId,
          'SESSION_TERMINATED',
          'HIGH',
          `Session terminated due to security policy violation`,
          {
            sessionId: session.id,
            reason: shouldForceReauth ? 'CRITICAL_RISK' : 'EXCESSIVE_MISMATCHES',
            mismatches: updatedMismatches,
          }
        );
      }

      return {
        isValid: analysis.isMatch && !shouldForceReauth,
        riskLevel: analysis.riskLevel,
        changes: analysis.changes,
        shouldAlert,
        shouldForceReauth,
        fingerprintAnalysis: analysis,
      };
    } catch (error) {
      console.error('Failed to validate session fingerprint:', error);
      return {
        isValid: false,
        riskLevel: 'CRITICAL',
        changes: ['Failed to validate session'],
        shouldAlert: true,
        shouldForceReauth: true,
      };
    }
  }

  /**
   * Trust a device explicitly
   */
  static async trustDevice(sessionToken: string, userId: string, deviceName?: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const session = await db.authSession.findFirst({
        where: {
          token: sessionToken,
          userId,
          isActive: true,
        },
      });

      if (!session) {
        return { success: false, message: 'Session not found' };
      }

      // Check if user has too many trusted devices
      const trustedDevicesCount = await db.authSession.count({
        where: {
          userId,
          isTrustedDevice: true,
          isActive: true,
        },
      });

      if (trustedDevicesCount >= defaultFingerprintConfig.maxTrustedDevices) {
        return { 
          success: false, 
          message: `Maximum trusted devices limit reached (${defaultFingerprintConfig.maxTrustedDevices})` 
        };
      }

      // Trust the device
      await db.authSession.update({
        where: { id: session.id },
        data: {
          isTrustedDevice: true,
          trustEstablishedAt: new Date(),
          deviceName: deviceName || session.deviceName,
          riskLevel: 'LOW',
          fingerprintMismatches: 0,
        },
      });

      await this.logSecurityEvent(
        userId,
        'DEVICE_TRUSTED',
        'LOW',
        `Device explicitly trusted: ${deviceName || session.deviceName}`,
        {
          sessionId: session.id,
          deviceId: session.deviceId,
          deviceName: deviceName || session.deviceName,
        }
      );

      return { success: true, message: 'Device trusted successfully' };
    } catch (error) {
      console.error('Failed to trust device:', error);
      return { success: false, message: 'Failed to trust device' };
    }
  }

  /**
   * Revoke trust for a device
   */
  static async revokeTrustedDevice(userId: string, deviceId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const sessions = await db.authSession.updateMany({
        where: {
          userId,
          deviceId,
          isTrustedDevice: true,
        },
        data: {
          isTrustedDevice: false,
          trustEstablishedAt: null,
          riskLevel: 'MEDIUM',
        },
      });

      if (sessions.count === 0) {
        return { success: false, message: 'No trusted device found with that ID' };
      }

      await this.logSecurityEvent(
        userId,
        'DEVICE_TRUST_REVOKED',
        'MEDIUM',
        `Trust revoked for device: ${deviceId}`,
        {
          deviceId,
          affectedSessions: sessions.count,
        }
      );

      return { success: true, message: 'Device trust revoked successfully' };
    } catch (error) {
      console.error('Failed to revoke device trust:', error);
      return { success: false, message: 'Failed to revoke device trust' };
    }
  }

  /**
   * Get trusted devices for a user
   */
  static async getTrustedDevices(userId: string): Promise<Array<{
    id: string;
    deviceId: string;
    deviceName: string;
    lastActivity: Date;
    trustEstablishedAt: Date;
    riskLevel: string;
  }>> {
    try {
      const sessions = await db.authSession.findMany({
        where: {
          userId,
          isTrustedDevice: true,
          isActive: true,
        },
        orderBy: { lastActivity: 'desc' },
        distinct: ['deviceId'],
      });

      return sessions.map(session => ({
        id: session.id,
        deviceId: session.deviceId!,
        deviceName: session.deviceName!,
        lastActivity: session.lastActivity,
        trustEstablishedAt: session.trustEstablishedAt!,
        riskLevel: session.riskLevel,
      }));
    } catch (error) {
      console.error('Failed to get trusted devices:', error);
      return [];
    }
  }

  /**
   * Terminate a session
   */
  static async terminateSession(
    sessionId: string, 
    userId: string, 
    reason: string
  ): Promise<boolean> {
    try {
      await db.authSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          lastActivity: new Date(),
        },
      });

      await this.logSecurityEvent(
        userId,
        'SESSION_TERMINATED',
        'MEDIUM',
        `Session terminated: ${reason}`,
        { sessionId, reason }
      );

      return true;
    } catch (error) {
      console.error('Failed to terminate session:', error);
      return false;
    }
  }

  /**
   * Clean up expired and old sessions
   */
  static async cleanupSessions(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Remove expired sessions
      await db.authSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { lastActivity: { lt: thirtyDaysAgo }, isActive: false },
          ],
        },
      });
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
    }
  }

  /**
   * Log security events
   */
  private static async logSecurityEvent(
    userId: string,
    eventType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: string,
    details: any
  ): Promise<void> {
    try {
      await db.securityEvent.create({
        data: {
          eventType: eventType as any, // Type assertion for enum
          severity: severity as any,   // Type assertion for enum
          source: 'SESSION_FINGERPRINTING',
          description,
          details,
          affectedUsers: [userId],
          status: 'OPEN' as any,      // Type assertion for enum
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}