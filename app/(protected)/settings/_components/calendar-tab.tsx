"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  RefreshCcw,
  Unlink,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  FileText,
  Target,
  CheckSquare,
  Video,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { SyncSettings, GoogleCalendar } from "@/types/google-calendar";
import { GOOGLE_CALENDAR_COLORS, SYNC_STATUS_CONFIG } from "@/types/google-calendar";

interface CalendarIntegrationData {
  connected: boolean;
  integration: {
    id: string;
    googleEmail: string;
    selectedCalendarId?: string;
    selectedCalendarName?: string;
    status: string;
    lastSyncAt?: string;
    lastSyncError?: string;
    syncErrorCount: number;
    settings: SyncSettings;
  } | null;
  calendars: GoogleCalendar[];
  recentSyncs: Array<{
    id: string;
    syncType: string;
    status: string;
    eventsCreated: number;
    eventsUpdated: number;
    eventsDeleted: number;
    eventsFailed: number;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    errorMessage?: string;
  }>;
}

export function CalendarTab() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [data, setData] = useState<CalendarIntegrationData | null>(null);
  const [settings, setSettings] = useState<SyncSettings | null>(null);

  // Fetch calendar status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar/status");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        if (result.data?.integration?.settings) {
          setSettings(result.data.integration.settings);
        }
      }
    } catch (error) {
      console.error("Failed to fetch calendar status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Connect to Google Calendar
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/calendar/auth");
      const result = await response.json();

      if (result.success && result.data?.authUrl) {
        window.location.href = result.data.authUrl;
      } else {
        toast.error(result.error?.message || "Failed to start connection");
      }
    } catch (error) {
      toast.error("Failed to connect to Google Calendar");
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from Google Calendar
  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar? Your sync settings will be lost.")) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch("/api/calendar/status", {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Google Calendar disconnected");
        setData(null);
        setSettings(null);
      } else {
        toast.error(result.error?.message || "Failed to disconnect");
      }
    } catch (error) {
      toast.error("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  // Trigger sync
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/calendar/learning-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncType: "incremental" }),
      });
      const result = await response.json();

      if (result.success) {
        const stats = result.data.stats;
        toast.success(
          `Sync completed: ${stats.eventsCreated} created, ${stats.eventsUpdated} updated, ${stats.eventsFailed} failed`
        );
        fetchStatus();
      } else {
        toast.error(result.error?.message || "Sync failed");
      }
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!settings) return;

    setSavingSettings(true);
    try {
      const response = await fetch("/api/calendar/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();

      if (result.success) {
        toast.success("Settings saved");
        fetchStatus();
      } else {
        toast.error(result.error?.message || "Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Update setting
  const updateSetting = <K extends keyof SyncSettings>(key: K, value: SyncSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCcw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Not connected state
  if (!data?.connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Connect Google Calendar
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
            Sync your learning activities, study sessions, and deadlines with Google Calendar to stay organized.
          </p>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {connecting ? (
              <>
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </>
            )}
          </Button>
        </div>

        {/* Features list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            {
              icon: BookOpen,
              title: "Study Sessions",
              description: "Auto-sync scheduled study sessions",
            },
            {
              icon: FileText,
              title: "Assignments & Quizzes",
              description: "Never miss a deadline",
            },
            {
              icon: Target,
              title: "Goal Milestones",
              description: "Track your learning goals",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className={cn(
                "p-4 rounded-xl",
                "bg-white/50 dark:bg-slate-800/50",
                "border border-slate-200/50 dark:border-slate-700/50"
              )}
            >
              <feature.icon className="h-6 w-6 text-blue-500 mb-2" />
              <h4 className="font-medium text-slate-900 dark:text-white">{feature.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Connected state
  const integration = data.integration;
  const statusConfig = integration?.status ? SYNC_STATUS_CONFIG[integration.status as keyof typeof SYNC_STATUS_CONFIG] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Connection Status Card */}
      <div
        className={cn(
          "p-6 rounded-xl",
          "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
          "border border-green-200/50 dark:border-green-700/50"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Connected</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {integration?.googleEmail}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              <span className="ml-2">{syncing ? "Syncing..." : "Sync Now"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Unlink className="h-4 w-4" />
              <span className="ml-2">Disconnect</span>
            </Button>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-4 mt-4">
          {statusConfig && (
            <Badge
              variant="outline"
              className={cn(
                "border",
                statusConfig.color === "green" && "border-green-500 text-green-600",
                statusConfig.color === "blue" && "border-blue-500 text-blue-600",
                statusConfig.color === "yellow" && "border-yellow-500 text-yellow-600",
                statusConfig.color === "red" && "border-red-500 text-red-600",
                statusConfig.color === "gray" && "border-gray-500 text-gray-600"
              )}
            >
              {statusConfig.icon === "CheckCircle" && <CheckCircle className="h-3 w-3 mr-1" />}
              {statusConfig.icon === "RefreshCcw" && <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />}
              {statusConfig.icon === "AlertCircle" && <AlertCircle className="h-3 w-3 mr-1" />}
              {statusConfig.icon === "Clock" && <Clock className="h-3 w-3 mr-1" />}
              {statusConfig.label}
            </Badge>
          )}
          {integration?.lastSyncAt && (
            <span className="text-xs text-slate-500">
              Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Calendar Selection */}
      {settings && data.calendars.length > 0 && (
        <div
          className={cn(
            "p-6 rounded-xl",
            "bg-white/80 dark:bg-slate-800/80",
            "backdrop-blur-sm",
            "border border-slate-200/50 dark:border-slate-700/50"
          )}
        >
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Selection
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Sync to Calendar</Label>
              <Select
                value={integration?.selectedCalendarId || ""}
                onValueChange={(value) => updateSetting("selectedCalendarId" as never, value as never)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a calendar" />
                </SelectTrigger>
                <SelectContent>
                  {data.calendars.map((cal) => (
                    <SelectItem key={cal.id} value={cal.id}>
                      {cal.summary} {cal.primary && "(Primary)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* What to Sync */}
      {settings && (
        <div
          className={cn(
            "p-6 rounded-xl",
            "bg-white/80 dark:bg-slate-800/80",
            "backdrop-blur-sm",
            "border border-slate-200/50 dark:border-slate-700/50"
          )}
        >
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            What to Sync
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "syncStudySessions" as const, label: "Study Sessions", icon: BookOpen },
              { key: "syncQuizzes" as const, label: "Quizzes & Exams", icon: FileText },
              { key: "syncAssignments" as const, label: "Assignments", icon: CheckSquare },
              { key: "syncGoalMilestones" as const, label: "Goal Milestones", icon: Target },
              { key: "syncLiveClasses" as const, label: "Live Classes", icon: Video },
              { key: "syncDailyTodos" as const, label: "Daily Todos", icon: CheckSquare },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.label}</span>
                </div>
                <Switch
                  checked={settings[item.key]}
                  onCheckedChange={(checked) => updateSetting(item.key, checked)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {settings && (
        <div
          className={cn(
            "rounded-xl",
            "bg-white/80 dark:bg-slate-800/80",
            "backdrop-blur-sm",
            "border border-slate-200/50 dark:border-slate-700/50"
          )}
        >
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-slate-500" />
              <span className="font-semibold text-slate-900 dark:text-white">Advanced Settings</span>
            </div>
            {showAdvanced ? (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-6 pt-0 space-y-6">
              {/* Sync Direction */}
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Sync Direction</Label>
                <Select
                  value={settings.syncDirection}
                  onValueChange={(value) => updateSetting("syncDirection", value as SyncSettings["syncDirection"])}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TAXOMIND_TO_GOOGLE">Taxomind → Google Calendar</SelectItem>
                    <SelectItem value="GOOGLE_TO_TAXOMIND">Google Calendar → Taxomind</SelectItem>
                    <SelectItem value="TWO_WAY">Two-way Sync</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Auto Sync */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 dark:text-slate-300">Auto Sync</Label>
                  <Switch
                    checked={settings.autoSyncEnabled}
                    onCheckedChange={(checked) => updateSetting("autoSyncEnabled", checked)}
                  />
                </div>
                {settings.autoSyncEnabled && (
                  <div>
                    <Label className="text-xs text-slate-500">Sync every {settings.autoSyncIntervalMinutes} minutes</Label>
                    <Slider
                      value={[settings.autoSyncIntervalMinutes]}
                      onValueChange={([value]) => updateSetting("autoSyncIntervalMinutes", value)}
                      min={5}
                      max={60}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              {/* Reminder */}
              <div>
                <Label className="text-slate-700 dark:text-slate-300">
                  Default Reminder: {settings.defaultReminderMinutes} minutes before
                </Label>
                <Slider
                  value={[settings.defaultReminderMinutes]}
                  onValueChange={([value]) => updateSetting("defaultReminderMinutes", value)}
                  min={0}
                  max={120}
                  step={5}
                  className="mt-2"
                />
              </div>

              {/* Event Colors */}
              <div>
                <Label className="text-slate-700 dark:text-slate-300 mb-2 block">Event Colors</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "studySessionColor" as const, label: "Study Sessions" },
                    { key: "quizColor" as const, label: "Quizzes" },
                    { key: "assignmentColor" as const, label: "Assignments" },
                    { key: "goalColor" as const, label: "Goals" },
                    { key: "liveClassColor" as const, label: "Live Classes" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <Select
                        value={settings[item.key]}
                        onValueChange={(value) => updateSetting(item.key, value)}
                      >
                        <SelectTrigger className="w-20">
                          <div
                            className="w-4 h-4 rounded"
                            style={{
                              backgroundColor:
                                GOOGLE_CALENDAR_COLORS[settings[item.key] as keyof typeof GOOGLE_CALENDAR_COLORS]?.hex ||
                                "#3b82f6",
                            }}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(GOOGLE_CALENDAR_COLORS).map(([id, colorData]) => (
                            <SelectItem key={id} value={id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: colorData.hex }}
                                />
                                <span>{colorData.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Include Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 dark:text-slate-300">Include descriptions in events</Label>
                  <Switch
                    checked={settings.includeDescription}
                    onCheckedChange={(checked) => updateSetting("includeDescription", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 dark:text-slate-300">Include course links</Label>
                  <Switch
                    checked={settings.includeCourseLink}
                    onCheckedChange={(checked) => updateSetting("includeCourseLink", checked)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      {settings && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            {savingSettings ? (
              <>
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      )}

      {/* Recent Syncs */}
      {data.recentSyncs && data.recentSyncs.length > 0 && (
        <div
          className={cn(
            "p-6 rounded-xl",
            "bg-white/80 dark:bg-slate-800/80",
            "backdrop-blur-sm",
            "border border-slate-200/50 dark:border-slate-700/50"
          )}
        >
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Syncs</h3>
          <div className="space-y-2">
            {data.recentSyncs.map((sync) => (
              <div
                key={sync.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="flex items-center gap-2">
                  {sync.status === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : sync.status === "partial" ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {sync.syncType} sync
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>+{sync.eventsCreated} /{sync.eventsUpdated} /{sync.eventsFailed}</span>
                  <span>{new Date(sync.completedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
