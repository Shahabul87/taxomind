'use client';

/**
 * PushNotificationOptIn
 *
 * Modal/banner component for requesting push notification permission.
 * Provides clear value proposition and easy opt-in flow.
 *
 * Features:
 * - Permission request modal
 * - Clear value proposition
 * - Remember dismissal
 * - Multiple display modes (modal, banner, inline)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Bell,
  BellRing,
  X,
  Check,
  AlertCircle,
  Clock,
  Target,
  Trophy,
  Sparkles,
  Loader2,
  Settings,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { usePushNotifications } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface PushNotificationOptInProps {
  className?: string;
  /** Display mode */
  mode?: 'modal' | 'banner' | 'inline';
  /** Whether to show on mount (only if permission is default) */
  showOnMount?: boolean;
  /** Delay before showing (ms) */
  showDelay?: number;
  /** Storage key for dismissal persistence */
  storageKey?: string;
  /** VAPID public key */
  vapidPublicKey?: string;
  /** Server endpoint to register subscription */
  serverEndpoint?: string;
  /** User ID for server registration */
  userId?: string;
  /** Callback when permission granted */
  onEnabled?: () => void;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Control visibility externally */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NOTIFICATION_BENEFITS = [
  {
    icon: Clock,
    title: 'Study Reminders',
    description: 'Get reminded when it\'s time to review',
  },
  {
    icon: Target,
    title: 'Goal Progress',
    description: 'Stay on track with goal updates',
  },
  {
    icon: MessageSquare,
    title: 'SAM Check-ins',
    description: 'Receive personalized check-ins',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    description: 'Celebrate your learning milestones',
  },
];

const DEFAULT_STORAGE_KEY = 'sam_push_notification_dismissed';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function BenefitItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/30">
        <Icon className="h-4 w-4 text-blue-500" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </div>
      </div>
    </div>
  );
}

function PermissionState({
  state,
}: {
  state: 'default' | 'granted' | 'denied' | 'unsupported';
}) {
  const config = {
    default: {
      icon: Bell,
      label: 'Not enabled',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    granted: {
      icon: Check,
      label: 'Enabled',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    denied: {
      icon: AlertCircle,
      label: 'Blocked',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
    unsupported: {
      icon: AlertCircle,
      label: 'Not supported',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    },
  };

  const { icon: Icon, label, color, bgColor } = config[state];

  return (
    <Badge variant="outline" className={cn('gap-1', color, bgColor)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PushNotificationOptIn({
  className,
  mode = 'modal',
  showOnMount = false,
  showDelay = 3000,
  storageKey = DEFAULT_STORAGE_KEY,
  vapidPublicKey,
  serverEndpoint,
  userId,
  onEnabled,
  onDismiss,
  open: controlledOpen,
  onOpenChange,
}: PushNotificationOptInProps) {
  // State
  const [internalOpen, setInternalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Controlled vs uncontrolled - use useMemo to stabilize setIsOpen
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = useMemo(() => {
    return isControlled
      ? (open: boolean) => onOpenChange?.(open)
      : setInternalOpen;
  }, [isControlled, onOpenChange]);

  // Hook
  const {
    permission,
    isSupported,
    isEnabled,
    isLoading,
    subscribe,
    registerWithServer,
  } = usePushNotifications({
    vapidPublicKey,
    onPermissionChange: (state) => {
      if (state === 'granted') {
        onEnabled?.();
      }
    },
  });

  // Check if should show on mount
  useEffect(() => {
    if (!showOnMount || !isSupported || permission !== 'default') {
      return;
    }

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem(storageKey);
    if (wasDismissed) {
      return;
    }

    // Show after delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, showDelay);

    return () => clearTimeout(timer);
  }, [showOnMount, isSupported, permission, showDelay, storageKey, setIsOpen]);

  // Handle enable
  const handleEnable = useCallback(async () => {
    const subscription = await subscribe();

    if (subscription && serverEndpoint && userId) {
      setIsRegistering(true);
      await registerWithServer(serverEndpoint, userId);
      setIsRegistering(false);
    }

    if (subscription) {
      onEnabled?.();
      setIsOpen(false);
    }
  }, [subscribe, registerWithServer, serverEndpoint, userId, onEnabled, setIsOpen]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
    onDismiss?.();
  }, [storageKey, setIsOpen, onDismiss]);

  // Don't render if not supported or already enabled
  if (!isSupported || isEnabled) {
    return null;
  }

  // Modal mode
  if (mode === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                <BellRing className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle>Stay Updated with SAM</DialogTitle>
                <DialogDescription>
                  Get timely notifications about your learning progress
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3">
              {NOTIFICATION_BENEFITS.map((benefit) => (
                <BenefitItem key={benefit.title} {...benefit} />
              ))}
            </div>

            {/* Current state */}
            {permission === 'denied' && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Notifications are blocked. Please enable them in your browser settings.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="ghost" onClick={handleDismiss} className="flex-1">
              Maybe Later
            </Button>
            <Button
              onClick={handleEnable}
              disabled={isLoading || isRegistering || permission === 'denied'}
              className="flex-1"
            >
              {isLoading || isRegistering ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Enable Notifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Banner mode
  if (mode === 'banner') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
              className
            )}
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <BellRing className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Enable notifications</div>
                    <div className="text-sm text-white/80">
                      Get study reminders and progress updates
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleEnable}
                    disabled={isLoading || isRegistering}
                  >
                    {isLoading || isRegistering ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Enable'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Inline mode
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/30">
              <Bell className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-base">Push Notifications</CardTitle>
          </div>
          <PermissionState state={permission} />
        </div>
        <CardDescription>
          Get timely updates about your learning progress
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Benefits list */}
        <div className="space-y-2">
          {NOTIFICATION_BENEFITS.slice(0, 3).map((benefit) => (
            <div
              key={benefit.title}
              className="flex items-center gap-2 text-sm"
            >
              <benefit.icon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {benefit.title}
              </span>
            </div>
          ))}
        </div>

        {/* Action */}
        {permission === 'default' && (
          <Button
            onClick={handleEnable}
            disabled={isLoading || isRegistering}
            className="w-full"
          >
            {isLoading || isRegistering ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Enable Notifications
          </Button>
        )}

        {permission === 'denied' && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-amber-700 dark:text-amber-300">
              Blocked in browser settings
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PushNotificationOptIn;
