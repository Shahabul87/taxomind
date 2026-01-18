'use client';

/**
 * ChannelSettings Component
 *
 * Manages notification delivery channels: in-app, push, and email.
 * Includes quiet hours, digest settings, and channel-specific preferences.
 *
 * @module components/sam/notification-center/ChannelSettings
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Send,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { usePushNotifications } from '@sam-ai/react';

// Channel configuration
const CHANNELS = [
  {
    id: 'inApp',
    label: 'In-App',
    description: 'Notifications within the application',
    icon: Monitor,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'push',
    label: 'Push',
    description: 'Browser and mobile notifications',
    icon: Smartphone,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Email notifications and digests',
    icon: Mail,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
] as const;

// Digest frequency options
const DIGEST_FREQUENCIES = [
  { value: 'realtime', label: 'Real-time', description: 'Instant delivery' },
  { value: 'hourly', label: 'Hourly', description: 'Bundled every hour' },
  { value: 'daily', label: 'Daily', description: 'Once per day' },
  { value: 'weekly', label: 'Weekly', description: 'Weekly summary' },
] as const;

// Time options for quiet hours
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
}));

interface ChannelSettingsProps {
  className?: string;
}

interface ChannelPreferences {
  inApp: {
    enabled: boolean;
    sound: boolean;
    soundVolume: number;
  };
  push: {
    enabled: boolean;
    permission: NotificationPermission | 'unsupported';
  };
  email: {
    enabled: boolean;
    digestFrequency: string;
    digestTime: number;
  };
  quietHours: {
    enabled: boolean;
    start: number;
    end: number;
  };
}

const DEFAULT_PREFERENCES: ChannelPreferences = {
  inApp: {
    enabled: true,
    sound: true,
    soundVolume: 70,
  },
  push: {
    enabled: false,
    permission: 'default',
  },
  email: {
    enabled: true,
    digestFrequency: 'daily',
    digestTime: 9,
  },
  quietHours: {
    enabled: false,
    start: 22,
    end: 7,
  },
};

export function ChannelSettings({ className }: ChannelSettingsProps) {
  const [preferences, setPreferences] = useState<ChannelPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const initialPrefsRef = useRef<ChannelPreferences | null>(null);

  const {
    permission,
    isSupported,
    requestPermission,
  } = usePushNotifications();

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/sam/agentic/notifications/preferences');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const loadedPrefs: ChannelPreferences = {
              inApp: {
                enabled: data.data.enabled ?? true,
                sound: data.data.sound ?? true,
                soundVolume: data.data.soundVolume ?? 70,
              },
              push: {
                enabled: data.data.pushEnabled ?? false,
                permission: isSupported ? permission : 'unsupported',
              },
              email: {
                enabled: data.data.emailEnabled ?? true,
                digestFrequency: data.data.emailDigestFrequency ?? 'daily',
                digestTime: data.data.emailDigestTime ?? 9,
              },
              quietHours: {
                enabled: data.data.quietHoursEnabled ?? false,
                start: data.data.quietHoursStart ?? 22,
                end: data.data.quietHoursEnd ?? 7,
              },
            };
            setPreferences(loadedPrefs);
            initialPrefsRef.current = loadedPrefs;
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    loadPreferences();
  }, [permission, isSupported]);

  // Track changes
  useEffect(() => {
    if (initialPrefsRef.current) {
      const changed = JSON.stringify(preferences) !== JSON.stringify(initialPrefsRef.current);
      setHasChanges(changed);
    }
  }, [preferences]);

  // Update push permission status
  useEffect(() => {
    setPreferences((prev) => ({
      ...prev,
      push: {
        ...prev.push,
        permission: isSupported ? permission : 'unsupported',
      },
    }));
  }, [permission, isSupported]);

  // Save preferences
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/sam/agentic/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: preferences.inApp.enabled,
          sound: preferences.inApp.sound,
          soundVolume: preferences.inApp.soundVolume,
          pushEnabled: preferences.push.enabled,
          emailEnabled: preferences.email.enabled,
          emailDigestFrequency: preferences.email.digestFrequency,
          emailDigestTime: preferences.email.digestTime,
          quietHoursEnabled: preferences.quietHours.enabled,
          quietHoursStart: preferences.quietHours.start,
          quietHoursEnd: preferences.quietHours.end,
        }),
      });

      if (response.ok) {
        toast.success('Notification settings saved');
        initialPrefsRef.current = preferences;
        setHasChanges(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [preferences]);

  // Request push permission
  const handleRequestPushPermission = useCallback(async () => {
    try {
      const granted = await requestPermission?.();
      if (granted) {
        setPreferences((prev) => ({
          ...prev,
          push: { ...prev.push, enabled: true, permission: 'granted' },
        }));
        toast.success('Push notifications enabled');
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      toast.error('Failed to enable push notifications');
    }
  }, [requestPermission]);

  // Test notification
  const handleTestNotification = useCallback(() => {
    if (preferences.inApp.sound) {
      // Play a simple notification sound
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = preferences.inApp.soundVolume / 100;
      audio.play().catch(() => {});
    }
    toast.success('Test notification', {
      description: 'This is how your notifications will appear',
    });
  }, [preferences.inApp.sound, preferences.inApp.soundVolume]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Channel Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon;
          const isEnabled =
            channel.id === 'inApp'
              ? preferences.inApp.enabled
              : channel.id === 'push'
                ? preferences.push.enabled
                : preferences.email.enabled;

          return (
            <motion.div
              key={channel.id}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.15 }}
            >
              <Card
                className={cn(
                  'relative overflow-hidden border-zinc-800/60 bg-zinc-900/50 transition-all duration-200',
                  isEnabled && 'border-l-2 border-l-indigo-500/70 bg-zinc-900/80'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        channel.bgColor
                      )}
                    >
                      <Icon className={cn('h-5 w-5', channel.color)} />
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => {
                        if (channel.id === 'push' && checked && permission !== 'granted') {
                          handleRequestPushPermission();
                          return;
                        }
                        setPreferences((prev) => ({
                          ...prev,
                          [channel.id]:
                            channel.id === 'inApp'
                              ? { ...prev.inApp, enabled: checked }
                              : channel.id === 'push'
                                ? { ...prev.push, enabled: checked }
                                : { ...prev.email, enabled: checked },
                        }));
                      }}
                      disabled={channel.id === 'push' && !isSupported}
                    />
                  </div>
                  <CardTitle className="text-base text-zinc-100">{channel.label}</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    {channel.description}
                  </CardDescription>
                </CardHeader>

                {channel.id === 'push' && !isSupported && (
                  <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Not supported in this browser
                  </div>
                )}

                {channel.id === 'push' && isSupported && permission === 'denied' && (
                  <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 p-2 text-xs text-rose-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Permission blocked - enable in browser settings
                  </div>
                )}

                {channel.id === 'push' && isSupported && permission === 'granted' && (
                  <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Push notifications enabled
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Sound Settings */}
      <AnimatePresence>
        {preferences.inApp.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    {preferences.inApp.sound ? (
                      <Volume2 className="h-5 w-5 text-orange-400" />
                    ) : (
                      <VolumeX className="h-5 w-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-zinc-100">Sound Settings</CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      Configure notification sounds
                    </CardDescription>
                  </div>
                  <Switch
                    checked={preferences.inApp.sound}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({
                        ...prev,
                        inApp: { ...prev.inApp, sound: checked },
                      }))
                    }
                  />
                </div>
              </CardHeader>
              {preferences.inApp.sound && (
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-zinc-400">Volume</Label>
                      <span className="text-sm text-zinc-500">
                        {preferences.inApp.soundVolume}%
                      </span>
                    </div>
                    <Slider
                      value={[preferences.inApp.soundVolume]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={([value]) =>
                        setPreferences((prev) => ({
                          ...prev,
                          inApp: { ...prev.inApp, soundVolume: value },
                        }))
                      }
                      className="py-2"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestNotification}
                    className="w-full border-zinc-700/50 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100"
                  >
                    <Send className="mr-2 h-3.5 w-3.5" />
                    Test Notification
                  </Button>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Digest Settings */}
      <AnimatePresence>
        {preferences.email.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-zinc-800/60 bg-zinc-900/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                    <Calendar className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-zinc-100">Email Digest</CardTitle>
                    <CardDescription className="text-xs text-zinc-500">
                      How often to receive email summaries
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid gap-3 sm:grid-cols-4">
                  {DIGEST_FREQUENCIES.map((freq) => (
                    <button
                      key={freq.value}
                      onClick={() =>
                        setPreferences((prev) => ({
                          ...prev,
                          email: { ...prev.email, digestFrequency: freq.value },
                        }))
                      }
                      className={cn(
                        'rounded-lg border p-3 text-left transition-all duration-200',
                        preferences.email.digestFrequency === freq.value
                          ? 'border-indigo-500/50 bg-indigo-500/10'
                          : 'border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-800/30'
                      )}
                    >
                      <p
                        className={cn(
                          'text-sm font-medium',
                          preferences.email.digestFrequency === freq.value
                            ? 'text-indigo-300'
                            : 'text-zinc-300'
                        )}
                      >
                        {freq.label}
                      </p>
                      <p className="text-xs text-zinc-500">{freq.description}</p>
                    </button>
                  ))}
                </div>

                {preferences.email.digestFrequency !== 'realtime' && (
                  <div className="flex items-center gap-4">
                    <Label className="text-sm text-zinc-400">Delivery time</Label>
                    <Select
                      value={String(preferences.email.digestTime)}
                      onValueChange={(value) =>
                        setPreferences((prev) => ({
                          ...prev,
                          email: { ...prev.email, digestTime: parseInt(value) },
                        }))
                      }
                    >
                      <SelectTrigger className="w-40 border-zinc-700/50 bg-zinc-800/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900">
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem
                            key={time.value}
                            value={String(time.value)}
                            className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                          >
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiet Hours */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <Moon className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-base text-zinc-100">Quiet Hours</CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Pause notifications during specific hours
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={preferences.quietHours.enabled}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({
                  ...prev,
                  quietHours: { ...prev.quietHours, enabled: checked },
                }))
              }
            />
          </div>
        </CardHeader>
        <AnimatePresence>
          {preferences.quietHours.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-zinc-500" />
                    <Select
                      value={String(preferences.quietHours.start)}
                      onValueChange={(value) =>
                        setPreferences((prev) => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, start: parseInt(value) },
                        }))
                      }
                    >
                      <SelectTrigger className="w-32 border-zinc-700/50 bg-zinc-800/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900">
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem
                            key={time.value}
                            value={String(time.value)}
                            className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                          >
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-zinc-500" />
                    <Select
                      value={String(preferences.quietHours.end)}
                      onValueChange={(value) =>
                        setPreferences((prev) => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, end: parseInt(value) },
                        }))
                      }
                    >
                      <SelectTrigger className="w-32 border-zinc-700/50 bg-zinc-800/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900">
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem
                            key={time.value}
                            value={String(time.value)}
                            className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                          >
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Notifications will be held during quiet hours and delivered when they end
                </p>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Save Button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="sticky bottom-4"
          >
            <Card className="border-indigo-500/30 bg-zinc-900/95 shadow-xl backdrop-blur-xl">
              <CardContent className="flex items-center justify-between p-4">
                <p className="text-sm text-zinc-400">You have unsaved changes</p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (initialPrefsRef.current) {
                        setPreferences(initialPrefsRef.current);
                      }
                    }}
                    className="text-zinc-400 hover:text-zinc-100"
                  >
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChannelSettings;
