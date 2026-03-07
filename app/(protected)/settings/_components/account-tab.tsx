"use client";

import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { SettingsSchema } from "@/schemas";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Mail, User, Lock } from "lucide-react";

interface AccountTabProps {
  form: UseFormReturn<z.infer<typeof SettingsSchema>>;
  isPending: boolean;
  isOAuth: boolean;
}

export const AccountTab = ({ form, isPending, isOAuth }: AccountTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Basic Information Section */}
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
              "flex items-center justify-center",
              "shadow-sm"
            )}>
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Basic Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your personal details
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 dark:text-slate-300">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        {...field}
                        placeholder="John Doe"
                        disabled={isPending}
                        className={cn(
                          "pl-10",
                          "bg-white/50 dark:bg-slate-900/50",
                          "border-slate-200/50 dark:border-slate-700/50",
                          "text-slate-900 dark:text-slate-100"
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email Field */}
            {!isOAuth && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          {...field}
                          placeholder="john.doe@example.com"
                          type="email"
                          disabled={isPending}
                          className={cn(
                            "pl-10",
                            "bg-white/50 dark:bg-slate-900/50",
                            "border-slate-200/50 dark:border-slate-700/50",
                            "text-slate-900 dark:text-slate-100"
                          )}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isOAuth && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>OAuth Account:</strong> Email changes are managed through your OAuth provider.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Password Change Section */}
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
                "flex items-center justify-center",
                "shadow-sm"
              )}>
                <Lock className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Change Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update your password regularly for security
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      Current Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          {...field}
                          placeholder="Enter current password"
                          type="password"
                          disabled={isPending}
                          className={cn(
                            "pl-10",
                            "bg-white/50 dark:bg-slate-900/50",
                            "border-slate-200/50 dark:border-slate-700/50",
                            "text-slate-900 dark:text-slate-100"
                          )}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Password */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          {...field}
                          placeholder="Enter new password"
                          type="password"
                          disabled={isPending}
                          className={cn(
                            "pl-10",
                            "bg-white/50 dark:bg-slate-900/50",
                            "border-slate-200/50 dark:border-slate-700/50",
                            "text-slate-900 dark:text-slate-100"
                          )}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Min 8 chars with uppercase, lowercase, number, and special character
                    </p>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
