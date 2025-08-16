import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SessionManager } from '@/lib/security/session-manager';
import { extractServerFingerprint, generateFingerprintHash, generateDeviceId, generateDeviceName } from '@/lib/security/session-fingerprint';

/**
 * Submit client-side fingerprint for session validation
 */
export async function POST(req: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { clientFingerprint } = body;

    if (!clientFingerprint) {
      return NextResponse.json(
        { success: false, error: 'Client fingerprint required' }, 
        { status: 400 }
      );
    }

    // Extract server-side fingerprint
    const serverFingerprint = await extractServerFingerprint();

    // Merge fingerprints
    const fullFingerprint = {
      userAgent: serverFingerprint.userAgent || '',
      acceptHeader: serverFingerprint.acceptHeader || '',
      acceptLanguage: serverFingerprint.acceptLanguage || clientFingerprint.language || '',
      acceptEncoding: serverFingerprint.acceptEncoding || '',
      platform: clientFingerprint.platform || '',
      timezone: clientFingerprint.timezone || '',
      screenResolution: clientFingerprint.screenResolution || '',
    };

    // Generate device identifiers
    const fingerprintHash = generateFingerprintHash(fullFingerprint);
    const deviceId = generateDeviceId(fullFingerprint, session.user.id);
    const deviceName = generateDeviceName(fullFingerprint);

    // Check if device is already trusted
    const trustedDevices = await SessionManager.getTrustedDevices(session.user.id);
    const isTrusted = trustedDevices.some(device => device.deviceId === deviceId);

    // Determine risk level based on device trust status
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = isTrusted ? 'LOW' : 'MEDIUM';

    // If this is a completely new device, increase risk
    if (!isTrusted && trustedDevices.length > 0) {
      riskLevel = 'HIGH';
    }

    return NextResponse.json({
      success: true,
      deviceId,
      deviceName,
      fingerprintHash,
      trusted: isTrusted,
      riskLevel,
      message: isTrusted 
        ? 'Device recognized as trusted' 
        : 'New device detected. Consider adding to trusted devices.',
    });

  } catch (error) {
    console.error('Error processing fingerprint submission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process fingerprint' }, 
      { status: 500 }
    );
  }
}