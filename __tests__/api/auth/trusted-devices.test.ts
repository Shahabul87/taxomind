/**
 * Tests for Trusted Devices Route - app/api/auth/trusted-devices/route.ts
 *
 * Covers: auth, device listing, current device detection, error handling
 */

jest.mock('@/lib/security/session-manager', () => ({
  SessionManager: {
    getTrustedDevices: jest.fn(),
  },
}));

jest.mock('@/lib/security/session-fingerprint', () => ({
  extractServerFingerprint: jest.fn(),
  generateDeviceId: jest.fn(),
}));

// @/auth, @/lib/db, @/lib/logger are globally mocked

import { GET } from '@/app/api/auth/trusted-devices/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { SessionManager } from '@/lib/security/session-manager';
import { extractServerFingerprint, generateDeviceId } from '@/lib/security/session-fingerprint';

const mockAuth = auth as jest.Mock;
const mockGetTrustedDevices = SessionManager.getTrustedDevices as jest.Mock;
const mockExtractFingerprint = extractServerFingerprint as jest.Mock;
const mockGenerateDeviceId = generateDeviceId as jest.Mock;

function createRequest() {
  return new NextRequest('http://localhost:3000/api/auth/trusted-devices', {
    method: 'GET',
  });
}

const NOW = new Date('2026-02-25T12:00:00Z');

describe('GET /api/auth/trusted-devices', () => {
  beforeEach(() => {
    // Default: authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });

    // Default: fingerprint and device id
    mockExtractFingerprint.mockResolvedValue({
      userAgent: 'Mozilla/5.0',
      acceptHeader: 'text/html',
      acceptLanguage: 'en-US',
      acceptEncoding: 'gzip',
    });
    mockGenerateDeviceId.mockReturnValue('current-device-id');

    // Default: no trusted devices
    mockGetTrustedDevices.mockResolvedValue([]);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toContain('Not authenticated');
  });

  it('returns 200 with empty devices list', async () => {
    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.devices).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('returns 200 with devices list', async () => {
    mockGetTrustedDevices.mockResolvedValue([
      {
        id: 'td-1',
        deviceId: 'device-abc',
        deviceName: 'Work Laptop',
        lastActivity: NOW,
        trustEstablishedAt: NOW,
        riskLevel: 'LOW',
      },
      {
        id: 'td-2',
        deviceId: 'device-def',
        deviceName: 'Home PC',
        lastActivity: NOW,
        trustEstablishedAt: NOW,
        riskLevel: 'MEDIUM',
      },
    ]);

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.devices).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.devices[0].name).toBe('Work Laptop');
    expect(body.devices[0].riskLevel).toBe('LOW');
    expect(body.devices[1].name).toBe('Home PC');
  });

  it('marks the current device correctly', async () => {
    mockGenerateDeviceId.mockReturnValue('device-abc');

    mockGetTrustedDevices.mockResolvedValue([
      {
        id: 'td-1',
        deviceId: 'device-abc',
        deviceName: 'Current Device',
        lastActivity: NOW,
        trustEstablishedAt: NOW,
        riskLevel: 'LOW',
      },
      {
        id: 'td-2',
        deviceId: 'device-other',
        deviceName: 'Other Device',
        lastActivity: NOW,
        trustEstablishedAt: NOW,
        riskLevel: 'LOW',
      },
    ]);

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.devices[0].current).toBe(true);
    expect(body.devices[1].current).toBe(false);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetTrustedDevices.mockRejectedValue(new Error('Database error'));

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to get trusted devices');
  });
});
