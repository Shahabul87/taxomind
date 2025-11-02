"use client";

import { useEffect, useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

export const SessionTimer = () => {
  const { data: session, update } = useSession();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    const checkSessionExpiry = () => {
      // Get session expiry from JWT
      const expiresAt = session.expires ? new Date(session.expires).getTime() : null;

      if (!expiresAt) return;

      const now = Date.now();
      const remaining = Math.floor((expiresAt - now) / 1000); // seconds

      setTimeRemaining(remaining);

      // Show warning if less than 5 minutes remaining
      if (remaining <= 300 && remaining > 0) {
        setShowWarning(true);
      }

      // Auto-redirect if expired
      if (remaining <= 0) {
        window.location.href = '/auth/login?session_expired=true';
      }
    };

    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const extendSession = async () => {
    // Trigger session refresh
    await update();
    setShowWarning(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning || !timeRemaining) return null;

  const isUrgent = timeRemaining <= 60;

  return (
    <div className={`fixed bottom-4 right-4 ${isUrgent ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'} border rounded-lg shadow-lg p-4 max-w-sm z-50`}>
      <div className="flex items-start gap-3">
        <Clock className={`h-5 w-5 mt-0.5 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
        <div className="flex-1">
          <h4 className={`font-semibold ${isUrgent ? 'text-red-900 dark:text-red-100' : 'text-amber-900 dark:text-amber-100'} mb-1`}>
            {isUrgent ? 'Session Expiring Soon!' : 'Session Timeout Warning'}
          </h4>
          <p className={`text-sm ${isUrgent ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'} mb-3`}>
            Your session will expire in <strong>{formatTime(timeRemaining)}</strong>.
            {isUrgent && ' Save your work now!'}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={extendSession}
              variant={isUrgent ? 'destructive' : 'default'}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Extend Session
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWarning(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
