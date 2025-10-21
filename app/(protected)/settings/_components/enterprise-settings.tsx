"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
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
import { SettingsTab, SettingsUser } from "@/types/settings";

interface EnterpriseSettingsProps {
  user: SettingsUser;
}

export const EnterpriseSettings = ({ user }: EnterpriseSettingsProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      // Account
      name: user.name || undefined,
      email: user.email || undefined,
      password: undefined,
      newPassword: undefined,
      role: user.role,
      isTwoFactorEnabled: user.isTwoFactorEnabled || undefined,

      // Profile
      phone: user.phone || undefined,
      image: user.image || undefined,
      learningStyle: user.learningStyle || undefined,

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
        className={cn(
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border-l border-r-0 border-t-0 border-b-0 border-slate-200/50 dark:border-slate-700/50",
          "shadow-xl shadow-slate-900/5 dark:shadow-black/20",
          "h-full min-h-screen"
        )}
      >
        {/* Header Section */}
        <div
          className={cn(
            "px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
            "bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-900/30 dark:to-indigo-900/20",
            "border-b border-slate-200/50 dark:border-slate-700/50",
            "backdrop-blur-sm"
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100/80 dark:bg-blue-900/40 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                Account Settings
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Manage your account, security, privacy, and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <SettingsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isTeacher={user.isTeacher}
            isAffiliate={user.isAffiliate}
          />
        </div>

        {/* Error and Success Messages */}
        {(error || success) && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <FormError message={error} />
            <FormSuccess message={success} />
          </div>
        )}

        {/* Form Section */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              </AnimatePresence>

              {/* Submit Button - Hide for Financial tab */}
              {activeTab !== "financial" && (
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isPending}
                  >
                    Reset Changes
                  </Button>
                  <Button
                    disabled={isPending}
                    type="submit"
                    className={cn(
                      "w-full sm:w-auto px-6 sm:px-8 py-3",
                      "bg-gradient-to-r from-blue-600 to-indigo-600",
                      "hover:from-blue-700 hover:to-indigo-700",
                      "dark:from-blue-500 dark:to-indigo-500",
                      "dark:hover:from-blue-600 dark:hover:to-indigo-600",
                      "text-white font-medium text-sm sm:text-base",
                      "backdrop-blur-sm shadow-lg",
                      "border border-blue-200/20 dark:border-blue-700/30",
                      "hover:shadow-xl hover:scale-105",
                      "transition-all duration-300",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                  >
                    {isPending ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
};
