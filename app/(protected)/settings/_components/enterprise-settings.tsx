"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsSchema } from "@/schemas";
import { settings } from "@/actions/settings";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { SettingsTabs } from "./settings-tabs";
import { AccountTab } from "./account-tab";
import { SecurityTab } from "./security-tab";
import { PrivacyTab } from "./privacy-tab";
import { ProfileTab } from "./profile-tab";
import { NotificationsTab } from "./notifications-tab";
import { FinancialTab } from "./financial-tab";
import { BillingTab } from "./billing-tab";
import { CalendarTab } from "./calendar-tab";
import { AIProvidersTab } from "./ai-providers-tab";
import { SettingsTab, SettingsUser } from "@/types/settings";

interface EnterpriseSettingsProps {
  user: SettingsUser;
}

export const EnterpriseSettings = ({ user }: EnterpriseSettingsProps) => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(tabParam || "account");
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  // Handle URL tab parameter changes
  useEffect(() => {
    if (tabParam && ['account', 'security', 'privacy', 'profile', 'notifications', 'financial', 'billing', 'calendar', 'ai-providers'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      // Account - use empty string for text inputs to keep them controlled
      name: user.name ?? "",
      email: user.email ?? "",
      password: "",
      newPassword: "",
      isTwoFactorEnabled: user.isTwoFactorEnabled ?? false,

      // Profile - use empty string for text inputs to keep them controlled
      phone: user.phone ?? "",
      image: user.image ?? "",
      bio: user.bio ?? "",
      location: user.location ?? "",
      website: user.website ?? "",
      learningStyle: user.learningStyle ?? undefined,

      // Notifications (defaults - should be fetched from user preferences)
      emailNotifications: true,
      emailCourseUpdates: true,
      emailNewMessages: true,
      emailMarketingEmails: false,
      emailWeeklyDigest: true,
      pushNotifications: true,
      pushCourseReminders: true,
      pushNewMessages: true,
      pushAchievements: true,

      // Privacy (defaults - should be fetched from user preferences)
      profileVisibility: "public",
      showEmail: false,
      showPhone: false,
      showLearningProgress: true,
      allowDataCollection: true,
      allowPersonalization: true,
    },
  });

  // Warn before switching tabs with unsaved changes
  const handleTabChange = useCallback((tab: SettingsTab) => {
    if (form.formState.isDirty) {
      const confirmed = window.confirm("You have unsaved changes. Switch tab anyway?");
      if (!confirmed) return;
      form.reset();
    }
    setActiveTab(tab);
  }, [form]);

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    setError(undefined);
    setSuccess(undefined);

    startTransition(() => {
      settings(values)
        .then((data) => {
          if (data.error) {
            setError(data.error);
          }

          if (data.success) {
            update();
            setSuccess(data.success);
            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };

  return (
    <div className="w-full h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full min-h-screen"
      >
        {/* Enterprise Header Section */}
        <div className="px-4 pt-6 pb-2 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={cn(
              "bg-white/80 dark:bg-slate-800/80",
              "backdrop-blur-sm",
              "border border-slate-200/50 dark:border-slate-700/50",
              "shadow-lg",
              "rounded-2xl",
              "p-5 sm:p-6"
            )}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-xl",
                "bg-gradient-to-br from-blue-500 to-indigo-500",
                "flex items-center justify-center",
                "shadow-md shadow-blue-500/20"
              )}>
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Account Settings
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  Manage your account, security, privacy, and preferences
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4">
          <SettingsTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isTeacher={user.isTeacher}
            isAffiliate={user.isAffiliate}
          />
        </div>

        {/* Error and Success Messages */}
        {(error || success) && (
          <div className="px-4 sm:px-6 lg:px-8 pt-3">
            <FormError message={error} />
            <FormSuccess message={success} />
          </div>
        )}

        {/* Form Section */}
        <div className="px-4 pt-4 pb-24 sm:px-6 sm:pb-24 lg:px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence mode="wait">
                {activeTab === "account" && (
                  <AccountTab
                    form={form}
                    isPending={isPending}
                    isOAuth={user.isOAuth}
                  />
                )}
                {activeTab === "security" && (
                  <SecurityTab
                    form={form}
                    isPending={isPending}
                    isOAuth={user.isOAuth}
                    totpEnabled={user.totpEnabled}
                    totpVerified={user.totpVerified}
                  />
                )}
                {activeTab === "privacy" && (
                  <PrivacyTab form={form} isPending={isPending} />
                )}
                {activeTab === "profile" && (
                  <ProfileTab
                    form={form}
                    isPending={isPending}
                    currentImage={user.image}
                    currentBio={user.bio}
                    currentLocation={user.location}
                    currentWebsite={user.website}
                    profileLinks={user.profileLinks}
                    userName={user.name}
                  />
                )}
                {activeTab === "notifications" && (
                  <NotificationsTab form={form} isPending={isPending} />
                )}
                {activeTab === "financial" && (user.isTeacher || user.isAffiliate) && (
                  <FinancialTab
                    walletBalance={user.walletBalance}
                    affiliateEarnings={user.affiliateEarnings}
                    affiliateCode={user.affiliateCode}
                    isTeacher={user.isTeacher}
                    isAffiliate={user.isAffiliate}
                  />
                )}
                {activeTab === "billing" && (
                  <BillingTab />
                )}
                {activeTab === "calendar" && (
                  <CalendarTab />
                )}
                {activeTab === "ai-providers" && (
                  <AIProvidersTab />
                )}
              </AnimatePresence>

              {/* Sticky Save Bar - Hide for tabs with their own save */}
              {activeTab !== "financial" && activeTab !== "billing" && activeTab !== "calendar" && activeTab !== "ai-providers" && (
                <div className={cn(
                  "fixed bottom-0 left-0 right-0 z-40",
                  "bg-white/95 dark:bg-slate-900/95",
                  "backdrop-blur-md",
                  "border-t border-slate-200 dark:border-slate-700",
                  "px-4 py-3 sm:px-6 lg:px-8",
                  "shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.2)]"
                )}>
                  <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {form.formState.isDirty && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Unsaved changes
                        </motion.div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.reset()}
                        disabled={isPending || !form.formState.isDirty}
                      >
                        Reset
                      </Button>
                      <Button
                        disabled={isPending}
                        type="submit"
                        size="sm"
                        className={cn(
                          "px-6",
                          "bg-gradient-to-r from-blue-600 to-indigo-600",
                          "hover:from-blue-700 hover:to-indigo-700",
                          "dark:from-blue-500 dark:to-indigo-500",
                          "dark:hover:from-blue-600 dark:hover:to-indigo-600",
                          "text-white font-medium",
                          "shadow-md hover:shadow-lg",
                          "transition-all duration-200",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        {isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
};
