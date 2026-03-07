"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { SettingsSchema } from "@/schemas";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Shield,
  Smartphone,
  Clock,
  Monitor,
  MapPin,
  Key,
  AlertTriangle,
  CheckCircle2,
  X
} from "lucide-react";
import { ActiveUserSession, LoginHistoryEntry } from "@/types/settings";
import { format } from "date-fns";

interface SecurityTabProps {
  form: UseFormReturn<z.infer<typeof SettingsSchema>>;
  isPending: boolean;
  isOAuth: boolean;
  totpEnabled: boolean;
  totpVerified: boolean;
}

export const SecurityTab = ({
  form,
  isPending,
  isOAuth,
  totpEnabled,
  totpVerified
}: SecurityTabProps) => {
  const [sessions, setSessions] = useState<ActiveUserSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [showTOTPSetup, setShowTOTPSetup] = useState(false);

  // Mock data - Replace with actual API calls
  const mockSessions: ActiveUserSession[] = [
    {
      id: "1",
      userId: "user-1",
      deviceName: "Chrome on MacBook Pro",
      deviceType: "desktop",
      browser: "Chrome 120",
      os: "macOS 14.2",
      ipAddress: "192.168.1.100",
      location: "San Francisco, CA, USA",
      lastActivity: new Date(),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isCurrent: true
    },
    {
      id: "2",
      userId: "user-1",
      deviceName: "Safari on iPhone 15",
      deviceType: "mobile",
      browser: "Safari 17",
      os: "iOS 17.2",
      ipAddress: "192.168.1.101",
      location: "San Francisco, CA, USA",
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isCurrent: false
    }
  ];

  const mockLoginHistory: LoginHistoryEntry[] = [
    {
      id: "1",
      userId: "user-1",
      success: true,
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      location: "San Francisco, CA, USA",
      failureReason: null,
      createdAt: new Date()
    },
    {
      id: "2",
      userId: "user-1",
      success: false,
      ipAddress: "203.0.113.42",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      location: "Unknown Location",
      failureReason: "Incorrect password",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ];

  const handleLogoutSession = async (sessionId: string) => {
    // TODO: Implement API call to logout session
    console.log("Logout session:", sessionId);
  };

  const handleLogoutAllOthers = async () => {
    // TODO: Implement API call to logout all other sessions
    console.log("Logout all other sessions");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Two-Factor Authentication */}
      {!isOAuth && (
        <div className={cn(
          "p-5 rounded-2xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-sm"
        )}>
          <div className="flex items-center space-x-3 mb-5">
            <div className={cn(
              "h-9 w-9 rounded-lg",
              "bg-gradient-to-br from-blue-500 to-indigo-500",
              "flex items-center justify-center shadow-sm"
            )}>
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isTwoFactorEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex-1">
                    <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email-Based 2FA
                    </FormLabel>
                    <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Receive verification codes via email
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      disabled={isPending}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* TOTP Authentication */}
            <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Authenticator App (TOTP)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Use Google Authenticator, Authy, or similar apps
                  </p>
                  {totpEnabled && totpVerified && (
                    <div className="flex items-center space-x-1 mt-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-white">Active</span>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant={totpEnabled ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setShowTOTPSetup(!showTOTPSetup)}
                >
                  {totpEnabled ? "Disable" : "Setup"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <div className={cn(
        "p-5 rounded-2xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-sm"
      )}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "h-9 w-9 rounded-lg",
              "bg-gradient-to-br from-blue-500 to-indigo-500",
              "flex items-center justify-center shadow-sm"
            )}>
              <Monitor className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Active Sessions
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Manage your active login sessions
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogoutAllOthers}
          >
            Logout All Others
          </Button>
        </div>

        <div className="space-y-3">
          {mockSessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "p-4 rounded-lg border",
                session.isCurrent
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {session.deviceName}
                    </span>
                    {session.isCurrent && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                      <MapPin className="h-3 w-3" />
                      <span>{session.location || "Unknown location"}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                      <Clock className="h-3 w-3" />
                      <span>Last active: {format(session.lastActivity, "PPp")}</span>
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLogoutSession(session.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Login History */}
      <div className={cn(
        "p-5 rounded-2xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-sm"
      )}>
        <div className="flex items-center space-x-3 mb-5">
          <div className={cn(
            "h-9 w-9 rounded-lg",
            "bg-gradient-to-br from-blue-500 to-indigo-500",
            "flex items-center justify-center shadow-sm"
          )}>
            <Key className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Login History
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Recent login attempts (last 10)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {mockLoginHistory.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "p-3 rounded-lg border",
                entry.success
                  ? "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {entry.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {entry.success ? "Successful Login" : "Failed Login"}
                    </span>
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {entry.location || entry.ipAddress}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {format(entry.createdAt, "PPp")}
                    </p>
                    {!entry.success && entry.failureReason && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Reason: {entry.failureReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
