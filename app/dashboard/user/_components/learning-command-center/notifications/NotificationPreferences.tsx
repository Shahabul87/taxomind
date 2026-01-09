'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Moon,
  Clock,
  Coffee,
  Target,
  Flame,
  BarChart,
  Lightbulb,
  Mail,
  Smartphone,
  Check,
  X,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useNotificationPreferences } from '@/hooks/use-notification-preferences';
import {
  DAYS_OF_WEEK,
  REMINDER_INTERVALS,
  BREAK_INTERVALS,
  BREAK_DURATIONS,
} from '@/types/learning-notifications';
import type { UpdatePreferencesInput } from '@/types/learning-notifications';
import { cn } from '@/lib/utils';

interface NotificationPreferencesProps {
  onClose?: () => void;
  className?: string;
}

// Time options for quiet hours and digest time
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  const time = `${hours.toString().padStart(2, '0')}:${minutes}`;
  const label = `${hours === 0 ? '12' : hours > 12 ? hours - 12 : hours}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
  return { value: time, label };
});

export function NotificationPreferences({ onClose, className }: NotificationPreferencesProps) {
  const { preferences, isLoading, error, updatePreferences, resetPreferences } =
    useNotificationPreferences();

  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    types: true,
    quiet: false,
    breaks: false,
    digest: false,
  });

  // Local state for unsaved changes
  const [localPrefs, setLocalPrefs] = useState<UpdatePreferencesInput>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        enabled: preferences.enabled,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
        timezone: preferences.timezone,
        remindersBefore: preferences.remindersBefore,
        streakReminders: preferences.streakReminders,
        goalUpdates: preferences.goalUpdates,
        weeklySummary: preferences.weeklySummary,
        dailyDigest: preferences.dailyDigest,
        breakReminders: preferences.breakReminders,
        studySuggestions: preferences.studySuggestions,
        breakIntervalMinutes: preferences.breakIntervalMinutes,
        breakDurationMinutes: preferences.breakDurationMinutes,
        digestTime: preferences.digestTime,
        weeklyDigestDay: preferences.weeklyDigestDay,
      });
    }
  }, [preferences]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChange = (key: keyof UpdatePreferencesInput, value: unknown) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updatePreferences(localPrefs);
    setIsSaving(false);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    await resetPreferences();
    setIsSaving(false);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Card className={cn('w-full max-w-2xl', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-slate-600 dark:text-slate-400">
            Loading preferences...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('w-full max-w-2xl', className)}>
        <CardContent className="py-12 text-center">
          <X className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-red-600 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Notification Preferences</CardTitle>
              <CardDescription>
                Customize how and when you receive learning alerts
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {localPrefs.enabled ? (
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <BellOff className="h-5 w-5 text-slate-400" />
            )}
            <div>
              <Label className="font-medium">Learning Notifications</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {localPrefs.enabled ? 'Receiving notifications' : 'All notifications paused'}
              </p>
            </div>
          </div>
          <Switch
            checked={localPrefs.enabled ?? true}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        <AnimatePresence>
          {localPrefs.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Notification Types */}
              <Collapsible
                open={expandedSections.types}
                onOpenChange={() => toggleSection('types')}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Notification Types</span>
                    </div>
                    {expandedSections.types ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    {/* Reminder Before */}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <div>
                          <Label className="text-sm">Activity Reminders</Label>
                          <p className="text-xs text-slate-500">Get reminded before activities</p>
                        </div>
                      </div>
                      <Select
                        value={String(localPrefs.remindersBefore ?? 15)}
                        onValueChange={(v) => handleChange('remindersBefore', Number(v))}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REMINDER_INTERVALS.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Streak Reminders */}
                    <div className="flex items-center justify-between border-t border-slate-100 py-3 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <div>
                          <Label className="text-sm">Streak Reminders</Label>
                          <p className="text-xs text-slate-500">Don&apos;t lose your streak</p>
                        </div>
                      </div>
                      <Switch
                        checked={localPrefs.streakReminders ?? true}
                        onCheckedChange={(checked) => handleChange('streakReminders', checked)}
                      />
                    </div>

                    {/* Goal Updates */}
                    <div className="flex items-center justify-between border-t border-slate-100 py-3 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <Target className="h-4 w-4 text-violet-500" />
                        <div>
                          <Label className="text-sm">Goal Updates</Label>
                          <p className="text-xs text-slate-500">Progress and completion alerts</p>
                        </div>
                      </div>
                      <Switch
                        checked={localPrefs.goalUpdates ?? true}
                        onCheckedChange={(checked) => handleChange('goalUpdates', checked)}
                      />
                    </div>

                    {/* Study Suggestions */}
                    <div className="flex items-center justify-between border-t border-slate-100 py-3 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <div>
                          <Label className="text-sm">Study Suggestions</Label>
                          <p className="text-xs text-slate-500">AI-powered learning tips</p>
                        </div>
                      </div>
                      <Switch
                        checked={localPrefs.studySuggestions ?? true}
                        onCheckedChange={(checked) => handleChange('studySuggestions', checked)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Quiet Hours */}
              <Collapsible
                open={expandedSections.quiet}
                onOpenChange={() => toggleSection('quiet')}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <Moon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      <div className="text-left">
                        <span className="font-medium">Quiet Hours</span>
                        {localPrefs.quietHoursStart && localPrefs.quietHoursEnd && (
                          <Badge variant="secondary" className="ml-2">
                            {localPrefs.quietHoursStart} - {localPrefs.quietHoursEnd}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {expandedSections.quiet ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Pause notifications during these hours. You&apos;ll still receive them after
                      quiet hours end.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Start Time</Label>
                        <Select
                          value={localPrefs.quietHoursStart ?? 'none'}
                          onValueChange={(v) => handleChange('quietHoursStart', v === 'none' ? null : v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {TIME_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">End Time</Label>
                        <Select
                          value={localPrefs.quietHoursEnd ?? 'none'}
                          onValueChange={(v) => handleChange('quietHoursEnd', v === 'none' ? null : v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {TIME_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Break Reminders */}
              <Collapsible
                open={expandedSections.breaks}
                onOpenChange={() => toggleSection('breaks')}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <Coffee className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Break Reminders</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={localPrefs.breakReminders ?? true}
                        onCheckedChange={(checked) => handleChange('breakReminders', checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {expandedSections.breaks ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Get reminded to take breaks during long study sessions.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Remind me</Label>
                        <Select
                          value={String(localPrefs.breakIntervalMinutes ?? 60)}
                          onValueChange={(v) => handleChange('breakIntervalMinutes', Number(v))}
                          disabled={!localPrefs.breakReminders}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BREAK_INTERVALS.map((option) => (
                              <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Break Duration</Label>
                        <Select
                          value={String(localPrefs.breakDurationMinutes ?? 5)}
                          onValueChange={(v) => handleChange('breakDurationMinutes', Number(v))}
                          disabled={!localPrefs.breakReminders}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BREAK_DURATIONS.map((option) => (
                              <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Digest Settings */}
              <Collapsible
                open={expandedSections.digest}
                onOpenChange={() => toggleSection('digest')}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      <span className="font-medium">Daily &amp; Weekly Digests</span>
                    </div>
                    {expandedSections.digest ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                    {/* Daily Digest */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart className="h-4 w-4 text-indigo-500" />
                        <div>
                          <Label className="text-sm">Daily Digest</Label>
                          <p className="text-xs text-slate-500">
                            Summary of your daily learning activities
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={localPrefs.dailyDigest ?? true}
                        onCheckedChange={(checked) => handleChange('dailyDigest', checked)}
                      />
                    </div>

                    {localPrefs.dailyDigest && (
                      <div className="ml-7 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                        <Label className="text-sm">Send at</Label>
                        <Select
                          value={localPrefs.digestTime ?? '08:00'}
                          onValueChange={(v) => handleChange('digestTime', v)}
                        >
                          <SelectTrigger className="mt-1 w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Weekly Summary */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <BarChart className="h-4 w-4 text-violet-500" />
                        <div>
                          <Label className="text-sm">Weekly Summary</Label>
                          <p className="text-xs text-slate-500">
                            Comprehensive weekly learning report
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={localPrefs.weeklySummary ?? true}
                        onCheckedChange={(checked) => handleChange('weeklySummary', checked)}
                      />
                    </div>

                    {localPrefs.weeklySummary && (
                      <div className="ml-7 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                        <Label className="text-sm">Send on</Label>
                        <Select
                          value={String(localPrefs.weeklyDigestDay ?? 1)}
                          onValueChange={(v) => handleChange('weeklyDigestDay', Number(v))}
                        >
                          <SelectTrigger className="mt-1 w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                              <SelectItem key={day.value} value={String(day.value)}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={isSaving}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
