'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSessionFingerprint } from '@/hooks/use-session-fingerprint';
import { toast } from 'sonner';

interface SessionSecurityContextType {
  fingerprint: any;
  isLoading: boolean;
  isSubmitted: boolean;
  deviceTrusted: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  error: string | null;
  securityScore: number;
  needsAttention: boolean;
  isSecure: boolean;
  refresh: () => Promise<void>;
}

const SessionSecurityContext = createContext<SessionSecurityContextType | null>(null);

interface SessionSecurityProviderProps {
  children: React.ReactNode;
  /** Whether to show security notifications to users */
  showNotifications?: boolean;
  /** Whether to automatically monitor for security changes */
  autoMonitor?: boolean;
  /** Custom interval for security checks in milliseconds */
  checkInterval?: number;
}

/**
 * Provider component that automatically handles session fingerprinting and security monitoring
 * Add this to your app layout to enable automatic session security features
 */
export const SessionSecurityProvider: React.FC<SessionSecurityProviderProps> = ({
  children,
  showNotifications = true,
  autoMonitor = true,
  checkInterval = 5 * 60 * 1000, // 5 minutes
}) => {
  const { data: session, status } = useSession();
  
  const fingerprintData = useSessionFingerprint({
    autoCollect: true,
    autoSubmit: true,
    showNotifications,
    monitorSecurity: autoMonitor,
    recheckInterval: checkInterval,
  });

  // Handle critical security events
  useEffect(() => {
    if (fingerprintData.riskLevel === 'CRITICAL' && showNotifications) {
      toast.error('Critical security alert', {
        description: 'Your session may have been compromised. Please log in again.',
        duration: Infinity,
        action: {
          label: 'Sign Out',
          onClick: () => {
            window.location.href = '/auth/logout';
          },
        },
      });
    }
  }, [fingerprintData.riskLevel, showNotifications]);

  // Show device trust recommendations
  useEffect(() => {
    if (
      fingerprintData.isSubmitted && 
      !fingerprintData.deviceTrusted && 
      fingerprintData.riskLevel === 'HIGH' &&
      showNotifications
    ) {
      const toastId = toast.info('New device detected', {
        description: 'For better security, consider adding this device to your trusted devices.',
        duration: 15000,
        action: {
          label: 'Manage Security',
          onClick: () => {
            // Navigate to security settings
            window.location.href = '/settings/security';
            toast.dismiss(toastId);
          },
        },
        onDismiss: () => {
          // Optional: Track that user dismissed the notification
        },
      });
    }
  }, [
    fingerprintData.isSubmitted, 
    fingerprintData.deviceTrusted, 
    fingerprintData.riskLevel, 
    showNotifications
  ]);

  const contextValue: SessionSecurityContextType = {
    fingerprint: fingerprintData.fingerprint,
    isLoading: fingerprintData.isLoading,
    isSubmitted: fingerprintData.isSubmitted,
    deviceTrusted: fingerprintData.deviceTrusted,
    riskLevel: fingerprintData.riskLevel,
    error: fingerprintData.error,
    securityScore: fingerprintData.securityScore,
    needsAttention: fingerprintData.needsAttention,
    isSecure: fingerprintData.isSecure,
    refresh: fingerprintData.refresh,
  };

  return (
    <SessionSecurityContext.Provider value={contextValue}>
      {children}
    </SessionSecurityContext.Provider>
  );
};

/**
 * Hook to access session security context
 */
export const useSessionSecurityContext = (): SessionSecurityContextType => {
  const context = useContext(SessionSecurityContext);
  
  if (!context) {
    throw new Error('useSessionSecurityContext must be used within a SessionSecurityProvider');
  }
  
  return context;
};

/**
 * Component that displays session security status in the UI
 */
export const SessionSecurityIndicator: React.FC<{
  className?: string;
  showDetails?: boolean;
}> = ({ className = '', showDetails = false }) => {
  const security = useSessionSecurityContext();
  const { status } = useSession();

  if (status !== 'authenticated' || security.isLoading) {
    return null;
  }

  const getStatusColor = () => {
    if (security.isSecure) return 'text-green-500';
    if (security.needsAttention) return 'text-red-500';
    if (security.riskLevel === 'MEDIUM') return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (security.isSecure) return 'Secure';
    if (security.riskLevel === 'CRITICAL') return 'Critical Risk';
    if (security.riskLevel === 'HIGH') return 'High Risk';
    if (security.riskLevel === 'MEDIUM') return 'Medium Risk';
    if (security.riskLevel === 'LOW') return 'Low Risk';
    return 'Unknown';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`} />
      {showDetails && (
        <>
          <span className={`text-sm ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          <span className="text-xs text-muted-foreground">
            ({security.securityScore}/100)
          </span>
        </>
      )}
    </div>
  );
};

/**
 * Security banner component that shows critical alerts
 */
export const SecurityBanner: React.FC = () => {
  const security = useSessionSecurityContext();
  const { status } = useSession();

  if (status !== 'authenticated' || !security.needsAttention) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-red-800">Security Attention Required</h4>
          <p className="text-sm text-red-600 mt-1">
            {security.riskLevel === 'CRITICAL' 
              ? 'Critical security issue detected. Your session may be compromised.'
              : 'Your device or session settings have changed. Please review your security settings.'
            }
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => window.location.href = '/settings/security'}
              className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
            >
              Review Security
            </button>
            {security.riskLevel === 'CRITICAL' && (
              <button
                onClick={() => window.location.href = '/auth/logout'}
                className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSecurityProvider;