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
      className="space-y-6"
    >
      {/* Basic Information Section */}
      <div className={cn(
        "p-6 rounded-xl",
        "bg-white/60 dark:bg-slate-800/60",
        "backdrop-blur-sm",
        "border border-slate-200/30 dark:border-slate-700/30",
        "shadow-lg"
      )}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Basic Information
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
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
                  <Input
                    {...field}
                    placeholder="John Doe"
                    disabled={isPending}
                    className={cn(
                      "bg-white/50 dark:bg-slate-900/50",
                      "border-slate-200/50 dark:border-slate-700/50",
                      "text-slate-900 dark:text-slate-100"
                    )}
                  />
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
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
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
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>OAuth Account:</strong> Email changes are managed through your OAuth provider (Google, GitHub, etc.)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Section */}
      {!isOAuth && (
        <div className={cn(
          "p-6 rounded-xl",
          "bg-white/60 dark:bg-slate-800/60",
          "backdrop-blur-sm",
          "border border-slate-200/30 dark:border-slate-700/30",
          "shadow-lg"
        )}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Change Password
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    <Input
                      {...field}
                      placeholder="Enter current password"
                      type="password"
                      disabled={isPending}
                      className={cn(
                        "bg-white/50 dark:bg-slate-900/50",
                        "border-slate-200/50 dark:border-slate-700/50",
                        "text-slate-900 dark:text-slate-100"
                      )}
                    />
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
                    <Input
                      {...field}
                      placeholder="Enter new password"
                      type="password"
                      disabled={isPending}
                      className={cn(
                        "bg-white/50 dark:bg-slate-900/50",
                        "border-slate-200/50 dark:border-slate-700/50",
                        "text-slate-900 dark:text-slate-100"
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Password must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </FormItem>
              )}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};
