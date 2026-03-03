'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

export interface ClientFingerprint {
  platform: string;
  timezone: string;
  screenResolution: string;
  colorDepth?: number;
  pixelRatio?: number;
  language?: string;
  languages?: string[];
  cookieEnabled?: boolean;
  doNotTrack?: boolean;
  touchSupport?: boolean;
  webgl?: string;
  canvas?: string;
}

/**
 * Collect client-side device fingerprint information
 * This runs in the browser and collects information not available on the server
 */
export async function collectClientFingerprint(): Promise<ClientFingerprint> {
  const fingerprint: ClientFingerprint = {
    platform: '',
    timezone: '',
    screenResolution: '',
  };

  try {
    // Platform information
    if (typeof navigator !== 'undefined') {
      fingerprint.platform = navigator.platform || '';
      fingerprint.language = navigator.language || '';
      fingerprint.languages = navigator.languages ? Array.from(navigator.languages) : [];
      fingerprint.cookieEnabled = navigator.cookieEnabled;
      fingerprint.doNotTrack = navigator.doNotTrack === '1';
      
      // Touch support detection
      fingerprint.touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Timezone
    try {
      fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      fingerprint.timezone = 'UTC';
    }

    // Screen information
    if (typeof screen !== 'undefined') {
      fingerprint.screenResolution = `${screen.width}x${screen.height}`;
      fingerprint.colorDepth = screen.colorDepth;
      fingerprint.pixelRatio = window.devicePixelRatio || 1;
    }

    // WebGL fingerprinting (for enhanced uniqueness)
    fingerprint.webgl = await getWebGLFingerprint();

    // Canvas fingerprinting (lightweight version)
    fingerprint.canvas = await getCanvasFingerprint();

  } catch (error) {
    logger.warn('Failed to collect some fingerprint data', error);
  }

  return fingerprint;
}

/**
 * Generate a WebGL fingerprint for enhanced device identification
 */
async function getWebGLFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext || 
                canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    
    if (!gl) return '';

    const renderer = gl.getParameter(gl.RENDERER) || '';
    const vendor = gl.getParameter(gl.VENDOR) || '';
    
    // Get supported extensions (limited to avoid too much detail)
    const extensions = gl.getSupportedExtensions()?.slice(0, 5).sort().join(',') || '';
    
    return `${renderer}|${vendor}|${extensions}`.substring(0, 100);
  } catch (error) {
    return '';
  }
}

/**
 * Generate a lightweight canvas fingerprint
 */
async function getCanvasFingerprint(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 50;
    
    // Draw a simple pattern
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device ID', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device ID', 4, 17);

    // Get a hash of the canvas data (first 20 chars)
    const dataURL = canvas.toDataURL();
    return btoa(dataURL).substring(0, 20);
  } catch (error) {
    return '';
  }
}

/**
 * Merge client and server fingerprints
 */
export function mergeFingerprints(
  serverFingerprint: Partial<{
    userAgent: string;
    acceptHeader: string;
    acceptLanguage: string;
    acceptEncoding: string;
  }>,
  clientFingerprint: ClientFingerprint
): {
  userAgent: string;
  acceptHeader: string;
  acceptLanguage: string;
  acceptEncoding: string;
  platform: string;
  timezone: string;
  screenResolution: string;
} {
  return {
    userAgent: serverFingerprint.userAgent || '',
    acceptHeader: serverFingerprint.acceptHeader || '',
    acceptLanguage: serverFingerprint.acceptLanguage || clientFingerprint.language || '',
    acceptEncoding: serverFingerprint.acceptEncoding || '',
    platform: clientFingerprint.platform,
    timezone: clientFingerprint.timezone,
    screenResolution: clientFingerprint.screenResolution,
  };
}

/**
 * Hook to collect fingerprint on component mount
 */
export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<ClientFingerprint | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    collectClientFingerprint()
      .then(setFingerprint)
      .catch(error => {
        logger.error('Failed to collect device fingerprint', error);
        setFingerprint(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { fingerprint, isLoading };
}

/**
 * Send fingerprint to server for session validation
 */
export async function submitFingerprint(clientFingerprint: ClientFingerprint): Promise<{
  success: boolean;
  deviceId?: string;
  trusted?: boolean;
  riskLevel?: string;
}> {
  try {
    const response = await fetch('/api/auth/fingerprint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ clientFingerprint }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to submit fingerprint', error);
    return { success: false };
  }
}

/**
 * Request device trust for current device
 */
export async function requestDeviceTrust(deviceName?: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await fetch('/api/auth/trust-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ deviceName }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to request device trust', error);
    return { 
      success: false, 
      message: 'Failed to establish device trust. Please try again.' 
    };
  }
}

/**
 * Get list of trusted devices for current user
 */
export async function getTrustedDevices(): Promise<{
  success: boolean;
  devices?: Array<{
    id: string;
    name: string;
    lastActivity: string;
    trustEstablishedAt: string;
    current: boolean;
  }>;
}> {
  try {
    const response = await fetch('/api/auth/trusted-devices', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to get trusted devices', error);
    return { success: false };
  }
}

/**
 * Revoke trust for a specific device
 */
export async function revokeTrustedDevice(deviceId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const response = await fetch(`/api/auth/trusted-devices/${deviceId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to revoke device trust', error);
    return { 
      success: false, 
      message: 'Failed to revoke device trust. Please try again.' 
    };
  }
}

