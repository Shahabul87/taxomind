'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  collectClientFingerprint, 
  submitFingerprint,
  ClientFingerprint 
} from '@/lib/security/client-fingerprint';
import { toast } from 'sonner';

interface SessionSecurityState {
  fingerprint: ClientFingerprint | null;
  isLoading: boolean;
  isSubmitted: boolean;
  deviceTrusted: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  error: string | null;
}

interface UseSessionFingerprintOptions {
  /** Whether to automatically collect fingerprint on mount */
  autoCollect?: boolean;
  /** Whether to automatically submit fingerprint to server */
  autoSubmit?: boolean;
  /** Whether to show toast notifications for security events */
  showNotifications?: boolean;
  /** Interval in milliseconds to recheck fingerprint (default: 5 minutes) */
  recheckInterval?: number;
  /** Whether to monitor for security changes */
  monitorSecurity?: boolean;
}

/**
 * Hook for managing session fingerprinting and security monitoring
 */
export function useSessionFingerprint(options: UseSessionFingerprintOptions = {}) {
  const {
    autoCollect = true,
    autoSubmit = true,
    showNotifications = true,
    recheckInterval = 5 * 60 * 1000, // 5 minutes
    monitorSecurity = true,
  } = options;

  const { data: session, status } = useSession();
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastFingerprintRef = useRef<string>();

  const [state, setState] = useState<SessionSecurityState>({
    fingerprint: null,
    isLoading: false,
    isSubmitted: false,
    deviceTrusted: false,
    riskLevel: null,
    error: null,
  });

  /**
   * Collect device fingerprint
   */
  const collectFingerprint = useCallback(async (): Promise<ClientFingerprint | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const fingerprint = await collectClientFingerprint();

      setState(prev => ({
        ...prev,
        fingerprint,
        isLoading: false
      }));

      return fingerprint;
    } catch (error) {
      console.error('Failed to collect fingerprint:', error);
      const errorMessage = 'Failed to collect device fingerprint';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      if (showNotifications) {
        toast.error(errorMessage);
      }

      return null;
    }
  }, [showNotifications]);

  /**
   * Submit fingerprint to server for validation
   */
  const submitFingerprintData = useCallback(async (fingerprint?: ClientFingerprint): Promise<void> => {
    if (!session?.user?.id) return;

    const fingerprintToSubmit = fingerprint || state.fingerprint;
    if (!fingerprintToSubmit) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await submitFingerprint(fingerprintToSubmit);

      if (result.success) {
        const fingerprintHash = JSON.stringify(fingerprintToSubmit);
        const hasChanged = lastFingerprintRef.current &&
                          lastFingerprintRef.current !== fingerprintHash;

        lastFingerprintRef.current = fingerprintHash;

        setState(prev => ({
          ...prev,
          isSubmitted: true,
          deviceTrusted: result.trusted || false,
          riskLevel: result.riskLevel as SessionSecurityState['riskLevel'] || null,
          isLoading: false,
        }));

        // Show notifications for security changes
        if (showNotifications && monitorSecurity) {
          if (!result.trusted && result.riskLevel === 'HIGH') {
            toast.warning('New device detected. Consider adding to trusted devices.', {
              duration: 10000,
              action: {
                label: 'Manage Devices',
                onClick: () => {
                  // Could navigate to security settings
                  window.location.href = '/settings/security';
                },
              },
            });
          } else if (hasChanged && result.riskLevel && ['MEDIUM', 'HIGH'].includes(result.riskLevel)) {
            toast.info('Device configuration changes detected.', {
              description: 'Your session security is being monitored.',
              duration: 5000,
            });
          }
        }
      } else {
        throw new Error('Failed to submit fingerprint to server');
      }
    } catch (error) {
      console.error('Failed to submit fingerprint:', error);
      const errorMessage = 'Failed to validate device security';

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      if (showNotifications) {
        toast.error(errorMessage);
      }
    }
  }, [session?.user?.id, state.fingerprint, showNotifications, monitorSecurity]);

  /**
   * Perform security check
   */
  const performSecurityCheck = useCallback(async (): Promise<void> => {
    if (!session?.user?.id || status !== 'authenticated') return;

    const fingerprint = await collectFingerprint();
    if (fingerprint && autoSubmit) {
      await submitFingerprintData(fingerprint);
    }
  }, [session?.user?.id, status, autoSubmit, collectFingerprint, submitFingerprintData]);

  /**
   * Start monitoring for security changes
   */
  const startMonitoring = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (monitorSecurity && session?.user?.id) {
        void performSecurityCheck();
      }
    }, recheckInterval);
  }, [monitorSecurity, session?.user?.id, recheckInterval, performSecurityCheck]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  /**
   * Manual refresh of fingerprint and security status
   */
  const refresh = async (): Promise<void> => {
    await performSecurityCheck();
  };

  // Initial collection and submission
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && autoCollect) {
      performSecurityCheck();
    }
  }, [status, session?.user?.id, autoCollect, performSecurityCheck]);

  // Start/stop monitoring based on session and options
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && monitorSecurity) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [status, session?.user?.id, monitorSecurity, recheckInterval, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Monitor session security metadata if available
  useEffect(() => {
    const sessionSecurity = (session as any)?.security;
    if (sessionSecurity) {
      setState(prev => ({
        ...prev,
        riskLevel: sessionSecurity.riskLevel || prev.riskLevel,
        deviceTrusted: sessionSecurity.fingerprintValid !== false,
      }));

      // Show notifications for session security issues
      if (showNotifications && sessionSecurity.riskLevel === 'HIGH') {
        toast.warning('Session security warning detected.', {
          description: 'Your device configuration may have changed.',
          duration: 8000,
        });
      }
    }
  }, [session, showNotifications]);

  return {
    // State
    ...state,
    
    // Actions
    collectFingerprint,
    submitFingerprint: submitFingerprintData,
    performSecurityCheck,
    refresh,
    startMonitoring,
    stopMonitoring,
    
    // Status
    isAuthenticated: status === 'authenticated',
    hasActiveSession: !!session?.user?.id,
    
    // Computed values
    needsAttention: state.riskLevel === 'HIGH' || state.riskLevel === 'CRITICAL',
    isSecure: state.deviceTrusted && state.riskLevel === 'LOW',
    securityScore: (() => {
      if (state.riskLevel === 'LOW' && state.deviceTrusted) return 100;
      if (state.riskLevel === 'LOW') return 80;
      if (state.riskLevel === 'MEDIUM') return 60;
      if (state.riskLevel === 'HIGH') return 40;
      if (state.riskLevel === 'CRITICAL') return 20;
      return 50; // Unknown
    })(),
  };
}

/**
 * Hook for getting session security status without automatic actions
 */
export function useSessionSecurity() {
  return useSessionFingerprint({
    autoCollect: false,
    autoSubmit: false,
    showNotifications: false,
    monitorSecurity: false,
  });
}