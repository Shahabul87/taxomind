'use client';

/**
 * Offline Indicator Component
 *
 * Shows offline/online status and pending message count.
 * Displays a syncing animation when reconnecting.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { getOfflineManager } from '@/lib/sam/offline';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const managerRef = useRef(getOfflineManager());

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await managerRef.current.getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB may not be available
    }
  }, []);

  useEffect(() => {
    const manager = managerRef.current;
    setIsOnline(manager.isOnline());

    const unsubscribe = manager.onStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        setIsSyncing(true);
        manager.syncPendingMessages().finally(() => {
          setIsSyncing(false);
          refreshPendingCount();
        });
      }
    });

    refreshPendingCount();

    // Poll pending count periodically
    const interval = setInterval(refreshPendingCount, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshPendingCount]);

  // Don't render when online and nothing pending
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={className}>
      {!isOnline && (
        <Badge variant="destructive" className="text-xs gap-1">
          <WifiOff className="w-3 h-3" />
          Offline
          {pendingCount > 0 && (
            <span className="ml-1 font-mono">({pendingCount})</span>
          )}
        </Badge>
      )}

      {isOnline && isSyncing && (
        <Badge variant="secondary" className="text-xs gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Syncing...
        </Badge>
      )}

      {isOnline && !isSyncing && pendingCount > 0 && (
        <Badge variant="outline" className="text-xs gap-1">
          <Wifi className="w-3 h-3" />
          {pendingCount} pending
        </Badge>
      )}
    </div>
  );
}
