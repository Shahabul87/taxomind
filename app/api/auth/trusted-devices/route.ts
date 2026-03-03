import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { SessionManager } from '@/lib/security/session-manager';
import { extractServerFingerprint, generateDeviceId } from '@/lib/security/session-fingerprint';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

/**
 * Get list of trusted devices for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    // Get trusted devices
    const trustedDevices = await SessionManager.getTrustedDevices(session.user.id);

    // Determine which device is current
    const serverFingerprint = await extractServerFingerprint();
    const currentDeviceId = generateDeviceId({
      userAgent: serverFingerprint.userAgent || '',
      acceptHeader: serverFingerprint.acceptHeader || '',
      acceptLanguage: serverFingerprint.acceptLanguage || '',
      acceptEncoding: serverFingerprint.acceptEncoding || '',
      platform: '', // Will be filled by client
      timezone: '',  // Will be filled by client
      screenResolution: '', // Will be filled by client
    }, session.user.id);

    // Format devices for response
    const devices = trustedDevices.map(device => ({
      id: device.id,
      deviceId: device.deviceId,
      name: device.deviceName,
      lastActivity: device.lastActivity.toISOString(),
      trustEstablishedAt: device.trustEstablishedAt.toISOString(),
      riskLevel: device.riskLevel,
      current: device.deviceId === currentDeviceId,
    }));

    return NextResponse.json({
      success: true,
      devices,
      total: devices.length,
    });

  } catch (error) {
    logger.error('Error getting trusted devices', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get trusted devices' }, 
      { status: 500 }
    );
  }
}