"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { useSession } from "next-auth/react";

import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSchema } from "@/schemas";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { settings } from "@/actions/settings";
import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-current-user";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
// UserRole removed - users no longer have roles
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";



export const PrivateDetailsSettingsPage = () => {
  const user:any = useCurrentUser();

  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      password: undefined,
      newPassword: undefined,
      name: user?.name || undefined,
      email: user?.email || undefined,
      isTwoFactorEnabled: user?.isTwoFactorEnabled || undefined,
    }
  });

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(values)
        .then((data) => {
          if (data.error) {
            setError(data.error);
          }

          if (data.success) {
            update();
            setSuccess(data.success);
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "rounded-xl sm:rounded-2xl",
            "bg-white/80 dark:bg-slate-800/80",
            "backdrop-blur-sm",
            "border border-slate-200/50 dark:border-slate-700/50",
            "shadow-xl shadow-slate-900/5 dark:shadow-black/20"
          )}
        >
          {/* Header Section */}
          <div className={cn(
            "px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
            "bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-900/30 dark:to-indigo-900/20",
            "border-b border-slate-200/50 dark:border-slate-700/50",
            "backdrop-blur-sm"
          )}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100/80 dark:bg-blue-900/40 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Account Settings</h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Manage your account preferences and security</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-4 sm:p-6 lg:p-8">
            <Form {...form}>
              <form className="space-y-6 sm:space-y-8 max-w-4xl mx-auto" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                  {/* Basic Info Section */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className={cn(
                      "p-4 sm:p-6 rounded-xl",
                      "bg-white/60 dark:bg-slate-800/60",
                      "backdrop-blur-sm",
                      "border border-slate-200/30 dark:border-slate-700/30",
                      "shadow-lg shadow-slate-900/5 dark:shadow-black/10",
                      "hover:bg-white/70 dark:hover:bg-slate-800/70",
                      "transition-all duration-300"
                    )}>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 sm:mb-4">Basic Information</h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700 dark:text-slate-300">Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="John Doe"
                                  disabled={isPending}
                                  className={cn(
                                    "bg-white/50 dark:bg-slate-900/50",
                                    "backdrop-blur-sm",
                                    "border-slate-200/50 dark:border-slate-700/50",
                                    "text-slate-900 dark:text-slate-100",
                                    "placeholder:text-slate-500 dark:placeholder:text-slate-400",
                                    "focus:bg-white/70 dark:focus:bg-slate-900/70",
                                    "transition-all duration-300"
                                  )}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {user?.isOAuth === false && (
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Email</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="john.doe@example.com"
                                    type="email"
                                    disabled={isPending}
                                    className={cn(
                                      "bg-white/50 dark:bg-slate-900/50",
                                      "backdrop-blur-sm",
                                      "border-slate-200/50 dark:border-slate-700/50",
                                      "text-slate-900 dark:text-slate-100",
                                      "placeholder:text-slate-500 dark:placeholder:text-slate-400",
                                      "focus:bg-white/70 dark:focus:bg-slate-900/70",
                                      "transition-all duration-300"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className={cn(
                      "p-4 sm:p-6 rounded-xl",
                      "bg-white/60 dark:bg-slate-800/60",
                      "backdrop-blur-sm",
                      "border border-slate-200/30 dark:border-slate-700/30",
                      "shadow-lg shadow-slate-900/5 dark:shadow-black/10",
                      "hover:bg-white/70 dark:hover:bg-slate-800/70",
                      "transition-all duration-300"
                    )}>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 sm:mb-4">Security</h3>
                      <div className="space-y-4">
                        {user?.isOAuth === false && (
                          <>
                            <FormField
                              control={form.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 dark:text-slate-300">Current Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="••••••"
                                      type="password"
                                      disabled={isPending}
                                      className={cn(
                                        "bg-white/50 dark:bg-slate-900/50",
                                        "backdrop-blur-sm",
                                        "border-slate-200/50 dark:border-slate-700/50",
                                        "text-slate-900 dark:text-slate-100",
                                        "placeholder:text-slate-500 dark:placeholder:text-slate-400",
                                        "focus:bg-white/70 dark:focus:bg-slate-900/70",
                                        "transition-all duration-300"
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 dark:text-slate-300">New Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="••••••"
                                      type="password"
                                      disabled={isPending}
                                      className={cn(
                                        "bg-white/50 dark:bg-slate-900/50",
                                        "backdrop-blur-sm",
                                        "border-slate-200/50 dark:border-slate-700/50",
                                        "text-slate-900 dark:text-slate-100",
                                        "placeholder:text-slate-500 dark:placeholder:text-slate-400",
                                        "focus:bg-white/70 dark:focus:bg-slate-900/70",
                                        "transition-all duration-300"
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role & 2FA Section */}
                <div className={cn(
                  "p-4 sm:p-6 rounded-xl",
                  "bg-white/60 dark:bg-slate-800/60",
                  "backdrop-blur-sm",
                  "border border-slate-200/30 dark:border-slate-700/30",
                  "shadow-lg shadow-slate-900/5 dark:shadow-black/10",
                  "hover:bg-white/70 dark:hover:bg-slate-800/70",
                  "transition-all duration-300"
                )}>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 sm:mb-4">Account Preferences</h3>
                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                    {/* Only show Role selection for admin users */}
                    {/* Account Type Display */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Account Type</label>
                      <div className={cn(
                        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg",
                        "bg-white/50 dark:bg-slate-900/50",
                        "border border-slate-200/50 dark:border-slate-700/50"
                      )}>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {user?.isTeacher ? 'Instructor' : 'Learner'}
                        </span>
                        {!user?.isTeacher && (
                          <Link
                            href="/auth/register-teacher"
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap"
                          >
                            Apply to become an instructor →
                          </Link>
                        )}
                      </div>
                      {user?.isTeacher === true && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Verified instructor account
                        </p>
                      )}
                    </div>

                    {/* 2FA toggle remains visible for all non-OAuth users */}
                    {user?.isOAuth === false && (
                      <FormField
                        control={form.control}
                        name="isTwoFactorEnabled"
                        render={({ field }) => (
                          <FormItem className={cn(
                            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg",
                            "bg-white/50 dark:bg-slate-900/50",
                            "backdrop-blur-sm",
                            "border border-slate-200/50 dark:border-slate-700/50",
                            "hover:bg-white/60 dark:hover:bg-slate-900/60",
                            "transition-all duration-300"
                          )}>
                            <div className="flex-1">
                              <FormLabel className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">Two Factor Authentication</FormLabel>
                              <FormDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Add an extra layer of security to your account
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
                    )}
                  </div>
                </div>

                {/* Error and Success Messages */}
                <div className="space-y-4">
                  <FormError message={error} />
                  <FormSuccess message={success} />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row justify-end gap-3">
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
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </motion.div>
    </div>
  );
}
 
