"use client";

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
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Mail, Smartphone, Brain } from "lucide-react";
import { NotificationPreferences, PushNotificationOptIn } from "@/components/sam/notifications";

interface NotificationsTabProps {
  form: UseFormReturn<z.infer<typeof SettingsSchema>>;
  isPending: boolean;
}

export const NotificationsTab = ({ form, isPending }: NotificationsTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Email Notifications */}
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
            <Mail className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Email Notifications
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Choose what emails you&apos;d like to receive
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="emailNotifications"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    All Email Notifications
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Master switch for all email notifications
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

          <FormField
            control={form.control}
            name="emailCourseUpdates"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Course Updates
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    New chapters, assignments, and course announcements
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

          <FormField
            control={form.control}
            name="emailNewMessages"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Messages
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Messages from instructors and other students
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

          <FormField
            control={form.control}
            name="emailMarketingEmails"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Marketing & Promotions
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Special offers, new courses, and platform updates
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

          <FormField
            control={form.control}
            name="emailWeeklyDigest"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Weekly Digest
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Summary of your weekly learning activity
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
        </div>
      </div>

      {/* Push Notifications */}
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
            <Smartphone className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Push Notifications
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Real-time notifications on your devices
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="pushNotifications"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    All Push Notifications
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Master switch for all push notifications
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

          <FormField
            control={form.control}
            name="pushCourseReminders"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Course Reminders
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Remind you to continue learning
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

          <FormField
            control={form.control}
            name="pushNewMessages"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    New Messages
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Instant alerts for new messages
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

          <FormField
            control={form.control}
            name="pushAchievements"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Achievements & Milestones
                  </FormLabel>
                  <FormDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Celebrate your learning progress
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
        </div>

        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Push notifications require browser permission. You&apos;ll be prompted to allow notifications when you enable this feature.
          </p>
        </div>

        {/* Browser Push Notification Opt-In */}
        <div className="mt-6">
          <PushNotificationOptIn mode="inline" />
        </div>
      </div>

      {/* SAM AI Notification Preferences */}
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
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              SAM AI Notifications
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Personalized learning notifications from your AI mentor
            </p>
          </div>
        </div>
        <NotificationPreferences compact={true} />
      </div>
    </motion.div>
  );
};
