"use client";

import { useState, useTransition, useEffect } from "react";
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
    if (tabParam && ['account', 'security', 'privacy', 'profile', 'notifications', 'financial'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      // Account
      name: user.name || undefined,
      email: user.email || undefined,
      password: undefined,
      newPassword: undefined,
      isTwoFactorEnabled: user.isTwoFactorEnabled || undefined,

      // Profile
      phone: user.phone || undefined,
      image: user.image || undefined,
      bio: user.bio || undefined,
      location: user.location || undefined,
      website: user.website || undefined,
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
        className="h-full min-h-screen"
      >
        {/* Enterprise Header Section */}
        <div className="px-4 py-8 sm:px-6 lg:px-8 mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={cn(
              "bg-white/80 dark:bg-slate-800/80",
              "backdrop-blur-sm",
              "border border-slate-200/50 dark:border-slate-700/50",
              "shadow-lg",
              "rounded-3xl",
              "p-6 sm:p-8"
            )}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className={cn(
                "h-14 w-14 rounded-2xl",
                "bg-gradient-to-br from-blue-500 to-indigo-500",
                "flex items-center justify-center",
                "shadow-lg shadow-blue-500/20"
              )}>
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className={cn(
                  "text-2xl sm:text-3xl font-bold tracking-tight",
                  "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
                  "dark:from-blue-400 dark:to-indigo-400"
                )}>
                  Account Settings
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1">
                  Manage your account, security, privacy, and preferences
                </p>
              </div>
            </div>
          </motion.div>
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
