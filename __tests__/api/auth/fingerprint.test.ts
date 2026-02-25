/**
 * Tests for Auth Fingerprint Route - app/api/auth/fingerprint/route.ts
 *
 * Covers: auth, validation, trusted device detection, risk level assessment
 */

jest.mock('@/lib/security/session-manager', () => ({
  SessionManager: {
    getTrustedDevices: jest.fn(),
  },
}));

jest.mock('@/lib/security/session-fingerprint', () => ({
  extractServerFingerprint: jest.fn(),
  generateFingerprintHash: jest.fn(),
  generateDeviceId: jest.fn(),
  generateDeviceName: jest.fn(),
}));

// @/auth, @/lib/db, @/lib/logger are globally mocked

import { POST } from '@/app/api/auth/fingerprint/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { SessionManager } from '@/lib/security/session-manager';
import {
  extractServerFingerprint,
  generateFingerprintHash,
  generateDeviceId,
  generateDeviceName,
} from '@/lib/security/session-fingerprint';

const mockAuth = auth as jest.Mock;
const mockGetTrustedDevices = SessionManager.getTrustedDevices as jest.Mock;
const mockExtractServerFingerprint = extractServerFingerprint as jest.Mock;
const mockGenerateFingerprintHash = generateFingerprintHash as jest.Mock;
const mockGenerateDeviceId = generateDeviceId as jest.Mock;
const mockGenerateDeviceName = generateDeviceName as jest.Mock;

function createRequest(body: Record<string, unknown> = { clientFingerprint: { platform: 'Win32', timezone: 'UTC', screenResolution: '1920x1080', language: 'en-US' } }) {
  return new NextRequest('http://localhost:3000/api/auth/fingerprint', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/fingerprint', () => {
  beforeEach(() => {
    // Default: authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    // Default: server fingerprint extraction
    mockExtractServerFingerprint.mockResolvedValue({
      userAgent: 'Mozilla/5.0 Test',
      acceptHeader: 'text/html',
      acceptLanguage: 'en-US',
      acceptEncoding: 'gzip',
    });

    // Default: generate identifiers
    mockGenerateFingerprintHash.mockReturnValue('fp-hash-abc123');
    mockGenerateDeviceId.mockReturnValue('device-id-xyz');
    mockGenerateDeviceName.mockReturnValue('Chrome on Windows');

    // Default: no trusted devices (new user)
    mockGetTrustedDevices.mockResolvedValue([]);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Not authenticated');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 when clientFingerprint is missing', async () => {
    const res = await POST(createRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Client fingerprint required');
  });

  it('returns 200 with LOW risk for a trusted device', async () => {
    mockGetTrustedDevices.mockResolvedValue([
      { deviceId: 'device-id-xyz', deviceName: 'Chrome on Windows' },
    ]);

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.trusted).toBe(true);
    expect(body.riskLevel).toBe('LOW');
    expect(body.deviceId).toBe('device-id-xyz');
    expect(body.deviceName).toBe('Chrome on Windows');
    expect(body.fingerprintHash).toBe('fp-hash-abc123');
    expect(body.message).toContain('trusted');
  });

  it('returns 200 with HIGH risk for a new device when other trusted devices exist', async () => {
    mockGetTrustedDevices.mockResolvedValue([
      { deviceId: 'other-device-id', deviceName: 'Firefox on Mac' },
    ]);

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.trusted).toBe(false);
    expect(body.riskLevel).toBe('HIGH');
    expect(body.message).toContain('New device');
  });

  it('returns 200 with MEDIUM risk for a new device with no existing trusted devices', async () => {
    mockGetTrustedDevices.mockResolvedValue([]);

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.trusted).toBe(false);
    expect(body.riskLevel).toBe('MEDIUM');
  });

  it('calls fingerprint functions with correct arguments', async () => {
    await POST(createRequest());

    expect(mockExtractServerFingerprint).toHaveBeenCalled();
    expect(mockGenerateFingerprintHash).toHaveBeenCalledWith(
      expect.objectContaining({
        userAgent: 'Mozilla/5.0 Test',
        platform: 'Win32',
        timezone: 'UTC',
        screenResolution: '1920x1080',
      })
    );
    expect(mockGenerateDeviceId).toHaveBeenCalledWith(
      expect.any(Object),
      'user-1'
    );
    expect(mockGetTrustedDevices).toHaveBeenCalledWith('user-1');
  });

  it('returns 500 on unexpected error', async () => {
    mockExtractServerFingerprint.mockRejectedValue(new Error('Fingerprint extraction failed'));

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Failed to process fingerprint');
  });
});
