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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Lock,
  Download,
  Trash2,
  Eye,
  Cookie,
  Shield,
  FileText,
  AlertTriangle
} from "lucide-react";

interface PrivacyTabProps {
  form: UseFormReturn<z.infer<typeof SettingsSchema>>;
  isPending: boolean;
}

export const PrivacyTab = ({ form, isPending }: PrivacyTabProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");

  const handleExportData = async (format: "json" | "csv") => {
    setIsExporting(true);
    try {
      // TODO: Implement API call to export data
      console.log("Exporting data in format:", format);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Data export requested in ${format.toUpperCase()} format. You will receive an email when ready.`);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletionReason.trim()) {
      alert("Please provide a reason for account deletion");
      return;
    }
    // TODO: Implement API call to request account deletion
    console.log("Account deletion requested:", deletionReason);
    alert("Account deletion request submitted. Your account will be deleted in 30 days.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Profile Visibility */}
      <div className={cn(
        "p-6 rounded-3xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Profile Visibility
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Control who can see your profile information
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="profileVisibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Visibility</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white dark:bg-slate-900/50">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can see</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private - Only you</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showEmail"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm">Show Email</FormLabel>
                  <FormDescription className="text-xs">
                    Display email on public profile
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
            name="showPhone"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm">Show Phone Number</FormLabel>
                  <FormDescription className="text-xs">
                    Display phone on public profile
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
            name="showLearningProgress"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm">Show Learning Progress</FormLabel>
                  <FormDescription className="text-xs">
                    Display course progress and achievements
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

      {/* Data & Personalization */}
      <div className={cn(
        "p-6 rounded-3xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Data &amp; Personalization
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Manage how your data is used
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="allowDataCollection"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm">Analytics &amp; Data Collection</FormLabel>
                  <FormDescription className="text-xs">
                    Help improve our services with usage data
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
            name="allowPersonalization"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-1">
                  <FormLabel className="text-sm">Personalized Experience</FormLabel>
                  <FormDescription className="text-xs">
                    Enable AI-powered personalized recommendations
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

      {/* Cookie Preferences */}
      <div className={cn(
        "p-6 rounded-3xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <Cookie className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Cookie Preferences
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Manage cookie settings for your browsing experience
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">Necessary Cookies</p>
                <p className="text-xs text-slate-500">Required for basic site functionality</p>
              </div>
              <Switch checked={true} disabled={true} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">Functional Cookies</p>
                <p className="text-xs text-slate-500">Enable enhanced features and personalization</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">Analytics Cookies</p>
                <p className="text-xs text-slate-500">Help us improve our services</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">Marketing Cookies</p>
                <p className="text-xs text-slate-500">Used for targeted advertising</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </div>

      {/* GDPR Data Export */}
      <div className={cn(
        "p-6 rounded-3xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Data Export (GDPR)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Download a copy of your personal data
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Request a copy of all your personal data stored in our system. This includes your profile information, course progress, purchases, and activity history.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExportData("json")}
              disabled={isExporting}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export as JSON</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExportData("csv")}
              disabled={isExporting}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export as CSV</span>
            </Button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your data export will be emailed to you within 48 hours and will be available for download for 7 days.
          </p>
        </div>
      </div>

      {/* Account Deletion */}
      <div className={cn(
        "p-6 rounded-3xl",
        "bg-red-50/60 dark:bg-red-900/20",
        "backdrop-blur-sm",
        "border border-red-200/50 dark:border-red-800/50",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Delete Account
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              Permanently delete your account and all associated data
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
            <p className="text-sm text-red-900 dark:text-red-100 font-medium mb-2">
              ⚠️ Warning: This action cannot be undone
            </p>
            <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
              <li>All your course progress will be lost</li>
              <li>Your purchases will be deleted</li>
              <li>Your account will be permanently removed</li>
              <li>Data recovery will not be possible</li>
            </ul>
          </div>

          <Textarea
            placeholder="Please tell us why you&apos;re leaving (optional)"
            value={deletionReason}
            onChange={(e) => setDeletionReason(e.target.value)}
            className="bg-white dark:bg-slate-900/50"
            rows={4}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Your account will be scheduled for deletion in 30 days. You can cancel this request within 30 days by logging in.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
};
