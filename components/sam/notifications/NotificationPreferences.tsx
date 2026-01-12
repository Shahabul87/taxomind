'use client';

/**
 * NotificationPreferences
 *
 * Settings panel for managing notification preferences.
 * Controls what types of notifications the user receives.
 *
 * Features:
 * - Category-based notification toggles
 * - Quiet hours settings
 * - Test notification button
 * - Push notification status
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Bell,
  BellRing,
  BellOff,
  Clock,
  Target,
  Trophy,
  MessageSquare,
  BookOpen,
  AlertTriangle,
  Calendar,
  Moon,
  Loader2,
  Check,
  X,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePushNotifications } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface NotificationPreferencesProps {
  className?: string;
  /** User ID for saving preferences */
  userId?: string;
  /** API endpoint to save preferences */
  apiEndpoint?: string;
  /** Initial preferences */
  initialPreferences?: NotificationPrefs;
  /** Callback when preferences change */
  onChange?: (prefs: NotificationPrefs) => void;
  /** Compact mode */
  compact?: boolean;
}

interface NotificationPrefs {
  // Category toggles
  studyReminders: boolean;
  goalProgress: boolean;
  checkIns: boolean;
  achievements: boolean;
  struggles: boolean;
  recommendations: boolean;

  // Global settings
  enabled: boolean;
  sound: boolean;

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: number; // 0-23
  quietHoursEnd: number; // 0-23
}

// Category IDs are the boolean preference fields (not numeric ones)
type NotificationCategoryId = 'studyReminders' | 'goalProgress' | 'checkIns' | 'achievements' | 'struggles' | 'recommendations';

interface NotificationCategory {
  id: NotificationCategoryId;
  icon: typeof Bell;
  label: string;
  description: string;
  color: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PREFERENCES: NotificationPrefs = {
  studyReminders: true,
  goalProgress: true,
  checkIns: true,
  achievements: true,
  struggles: true,
  recommendations: true,
  enabled: true,
  sound: true,
  quietHoursEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 7,
};

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    id: 'studyReminders',
    icon: Clock,
    label: 'Study Reminders',
    description: 'Reminders to review and practice',
    color: 'text-blue-500',
  },
  {
    id: 'goalProgress',
    icon: Target,
    label: 'Goal Progress',
    description: 'Updates on your learning goals',
    color: 'text-green-500',
  },
  {
    id: 'checkIns',
    icon: MessageSquare,
    label: 'SAM Check-ins',
    description: 'Personalized check-in messages',
    color: 'text-purple-500',
  },
  {
    id: 'achievements',
    icon: Trophy,
    label: 'Achievements',
    description: 'Milestone and badge notifications',
    color: 'text-amber-500',
  },
  {
    id: 'struggles',
    icon: AlertTriangle,
    label: 'Struggle Alerts',
    description: 'Help suggestions when struggling',
    color: 'text-red-500',
  },
  {
    id: 'recommendations',
    icon: BookOpen,
    label: 'Recommendations',
    description: 'Suggested content and activities',
    color: 'text-indigo-500',
  },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12 AM' : i === 12 ? '12 PM' : i > 12 ? `${i - 12} PM` : `${i} AM`,
}));

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NotificationPreferences({
  className,
  userId,
  apiEndpoint = '/api/sam/agentic/notifications/preferences',
  initialPreferences,
  onChange,
  compact = false,
}: NotificationPreferencesProps) {
  // State
  const [preferences, setPreferences] = useState<NotificationPrefs>(
    initialPreferences || DEFAULT_PREFERENCES
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Hook
  const {
    permission,
    isSupported,
    isEnabled,
    isLoading,
    showNotification,
    subscribe,
  } = usePushNotifications();

  // Load preferences from API
  useEffect(() => {
    if (!userId) return;

    const loadPreferences = async () => {
      try {
        const response = await fetch(`${apiEndpoint}?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPreferences((prev) => ({ ...prev, ...data.data }));
          }
        }
      } catch (error) {
        console.error('[NotificationPreferences] Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, [userId, apiEndpoint]);

  // Update preference
  const updatePreference = useCallback(
    <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
      setPreferences((prev) => {
        const newPrefs = { ...prev, [key]: value };
        onChange?.(newPrefs);
        setHasChanges(true);
        return newPrefs;
      });
    },
    [onChange]
  );

  // Save preferences
  const savePreferences = useCallback(async () => {
    if (!userId) return;

    setIsSaving(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences }),
      });

      if (response.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('[NotificationPreferences] Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  }, [userId, preferences, apiEndpoint]);

  // Test notification
  const handleTestNotification = useCallback(async () => {
    if (!isEnabled) {
      await subscribe();
    }

    setIsTesting(true);
    await showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from SAM. Notifications are working correctly!',
      icon: '/icons/sam-icon.png',
      tag: 'test-notification',
    });
    setIsTesting(false);
  }, [isEnabled, subscribe, showNotification]);

  // Toggle all
  const handleToggleAll = useCallback(
    (enabled: boolean) => {
      const newPrefs = { ...preferences };
      NOTIFICATION_CATEGORIES.forEach((cat) => {
        newPrefs[cat.id] = enabled;
      });
      newPrefs.enabled = enabled;
      setPreferences(newPrefs);
      onChange?.(newPrefs);
      setHasChanges(true);
    },
    [preferences, onChange]
  );

  // Get enabled count
  const enabledCount = NOTIFICATION_CATEGORIES.filter(
    (cat) => preferences[cat.id]
  ).length;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <CardTitle className={compact ? 'text-base' : undefined}>
              Notification Settings
            </CardTitle>
          </div>
          <Badge
            variant={isEnabled ? 'default' : 'secondary'}
            className={cn(
              isEnabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : ''
            )}
          >
            {isEnabled ? (
              <>
                <Bell className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <BellOff className="h-3 w-3 mr-1" />
                Inactive
              </>
            )}
          </Badge>
        </div>
        {!compact && (
          <CardDescription>
            Customize which notifications you receive from SAM
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Global toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/30">
              <BellRing className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <div className="font-medium text-sm">All Notifications</div>
              <div className="text-xs text-gray-500">
                {enabledCount} of {NOTIFICATION_CATEGORIES.length} enabled
              </div>
            </div>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={(checked) => handleToggleAll(checked)}
          />
        </div>

        {/* Category toggles */}
        <div className="space-y-3">
          {NOTIFICATION_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isOn = preferences[category.id];

            return (
              <div
                key={category.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg transition-colors',
                  !preferences.enabled && 'opacity-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-4 w-4', category.color)} />
                  <div>
                    <Label
                      htmlFor={category.id}
                      className="text-sm cursor-pointer"
                    >
                      {category.label}
                    </Label>
                    {!compact && (
                      <div className="text-xs text-gray-500">
                        {category.description}
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  id={category.id}
                  checked={isOn as boolean}
                  onCheckedChange={(checked) =>
                    updatePreference(category.id, checked)
                  }
                  disabled={!preferences.enabled}
                />
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Sound toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {preferences.sound ? (
              <Volume2 className="h-4 w-4 text-gray-500" />
            ) : (
              <VolumeX className="h-4 w-4 text-gray-500" />
            )}
            <Label htmlFor="sound" className="text-sm cursor-pointer">
              Notification Sound
            </Label>
          </div>
          <Switch
            id="sound"
            checked={preferences.sound}
            onCheckedChange={(checked) => updatePreference('sound', checked)}
          />
        </div>

        {/* Quiet hours */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-gray-500" />
              <Label htmlFor="quietHours" className="text-sm cursor-pointer">
                Quiet Hours
              </Label>
            </div>
            <Switch
              id="quietHours"
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) =>
                updatePreference('quietHoursEnabled', checked)
              }
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="flex items-center gap-2 pl-7">
              <Select
                value={preferences.quietHoursStart.toString()}
                onValueChange={(v) =>
                  updatePreference('quietHoursStart', parseInt(v))
                }
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value.toString()}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">to</span>
              <Select
                value={preferences.quietHoursEnd.toString()}
                onValueChange={(v) =>
                  updatePreference('quietHoursEnd', parseInt(v))
                }
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value.toString()}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            disabled={isTesting || !isSupported || permission === 'denied'}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-1" />
            )}
            Test
          </Button>

          {hasChanges && (
            <Button
              size="sm"
              onClick={savePreferences}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save Changes
            </Button>
          )}
        </div>

        {/* Browser permission note */}
        {permission === 'denied' && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-300">
              Notifications are blocked in your browser. Please enable them in
              browser settings to receive notifications.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationPreferences;
