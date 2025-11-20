"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Mail, Shield, Lock, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { logger } from '@/lib/logger';

import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { login } from "@/actions/admin/login";

export const AdminLoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  // Avoid theme-dependent dynamic classes in JS; rely on Tailwind `dark:` classes.

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    try {
      setError("");
      setSuccess("");

      startTransition(() => {
        login(values, callbackUrl)
          .then(async (data) => {

            if (data?.error) {
              form.reset();
              setError(data.error);
            }
            if (data?.success) {
              form.reset();
              setSuccess(data.success);

              // PHASE 2: Admin session established by login action
              toast.success("Admin login successful! Redirecting...");

              // Redirect to admin dashboard or callback URL
              const redirectUrl = (data as any).redirectTo || callbackUrl || "/dashboard/admin";
              setTimeout(() => {
                window.location.href = redirectUrl;
              }, 500);
            }
            if (data?.twoFactor) {
              setShowTwoFactor(true);
              toast.success("Check your email for the 2FA code!");
            }
          })
          .catch((error) => {
            if (error?.message?.includes("NEXT_REDIRECT") || error?.digest?.includes("NEXT_REDIRECT")) {
              // Redirect happening - navigate to dashboard
              toast.success("Admin login successful! Redirecting...");
              const redirectUrl = callbackUrl || "/dashboard/admin";
              setTimeout(() => {
                window.location.href = redirectUrl;
              }, 500);
              return;
            }
            logger.error("Admin login error:", error);
            setError("Something went wrong");
          });
      });
    } catch (error) {
      logger.error("Admin form submission error:", error);
      setError("An unexpected error occurred");
    }
  };

  // Optimized animation variants - using CSS transitions instead of spring physics
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto" style={{ contain: 'layout style' }}>
      {/* Header Section */}
      <motion.div
        className="flex flex-col items-center justify-center mb-8 lg:mb-0 lg:hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
      >
        {/* Icon and Title */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-md">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Admin Portal
          </h1>
        </div>

        {/* Subtitle */}
        <p className="mt-2 text-base font-medium text-center text-slate-600 dark:text-slate-300">
          Secure Administrator Authentication
        </p>

        {/* Warning Badge */}
        <motion.div
          className="mt-6 px-4 py-3 rounded-xl bg-blue-50/50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Admin access only - All login attempts are logged
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Form Section */}
      <div className="max-w-md mx-auto">
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-400/5 to-transparent dark:from-blue-500/5 dark:via-indigo-500/5 pointer-events-none" />
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 w-full"
            >
              {showTwoFactor ? (
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="relative z-10">
                        <FormLabel className="text-base font-semibold text-slate-800 dark:text-slate-200">
                          Two Factor Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="123456"
                            type="text"
                            className="w-full h-14 border-2 rounded-xl text-lg transition-all duration-200 bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400 dark:hover:border-slate-600"
                          />
                        </FormControl>
                        <FormMessage className="text-blue-600 dark:text-blue-400" />
                      </FormItem>
                    )}
                  />
                </motion.div>
              ) : (
                <>
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="w-full relative z-10">
                          <FormLabel className="text-base font-semibold text-slate-800 dark:text-slate-200">
                            Admin Email
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="admin@taxomind.com"
                                type="email"
                                className="w-full h-14 border-2 rounded-xl text-lg pl-12 transition-all duration-200 bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400 dark:hover:border-slate-600"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                              />
                            </FormControl>
                            <div className={[
                              "absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-200 pointer-events-none",
                              field.value || focusedField === 'email' ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
                              "text-slate-400 dark:text-slate-500"
                            ].join(' ')}>
                              <Mail className="w-5 h-5" />
                            </div>
                            <div className={[
                              "absolute top-0 left-0 h-full w-1 rounded-l-xl transition-all duration-200",
                              field.value ? "bg-gradient-to-b from-blue-500 to-indigo-500 opacity-100" : "bg-transparent opacity-0"
                            ].join(' ')}></div>
                          </div>
                          <FormMessage className="text-blue-600 dark:text-blue-400" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="w-full relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel className="text-base font-semibold text-slate-800 dark:text-slate-200">
                              Admin Password
                            </FormLabel>
                            <Link
                              href="/admin/auth/reset"
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors underline-offset-4 hover:underline"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="••••••••"
                                type={showPassword ? "text" : "password"}
                                className="w-full h-14 border-2 rounded-xl text-lg pl-12 pr-12 transition-all duration-200 bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-500/70 focus:ring-4 focus:ring-blue-500/10 hover:border-slate-400 dark:hover:border-slate-600"
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                              />
                            </FormControl>
                            <div className={[
                              "absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-200 pointer-events-none",
                              field.value || focusedField === 'password' ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
                              "text-slate-400 dark:text-slate-500"
                            ].join(' ')}>
                              <Lock className="w-5 h-5" />
                            </div>
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors focus:outline-none text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                            <div className={[
                              "absolute top-0 left-0 h-full w-1 rounded-l-xl transition-all duration-200",
                              field.value ? "bg-gradient-to-b from-blue-500 to-indigo-500 opacity-100" : "bg-transparent opacity-0"
                            ].join(' ')}></div>
                          </div>
                          <FormMessage className="text-blue-600 dark:text-blue-400" />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                </>
              )}

              <motion.div variants={itemVariants}>
                <FormError message={error} />
                <FormSuccess message={success} />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="pt-4 relative z-10"
              >
                <Button
                  disabled={isPending}
                  type="submit"
                  className="w-full h-14 rounded-xl text-lg font-bold transition-all duration-300 shadow-md hover:shadow-xl relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                >
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isPending && (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isPending ? "Authenticating..." : "Admin Sign In"}
                  </span>
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="text-center pt-4 relative z-10">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Not an admin?{' '}
                  <Link
                    href="/auth/login"
                    className="font-semibold transition-all duration-200 underline-offset-4 hover:underline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Regular Login
                  </Link>
                </p>
              </motion.div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
};
