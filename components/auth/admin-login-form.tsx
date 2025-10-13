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
            if (error?.message?.includes("NEXT_REDIRECT")) {
              // Redirect happening - this is success
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
        className="flex flex-col items-center justify-center mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
      >
        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <Shield className="w-12 h-12 text-red-600 dark:text-red-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
            Admin Portal
          </h1>
        </div>

        {/* Subtitle */}
        <p className="mt-2 text-lg font-medium text-center text-slate-600 dark:text-gray-300">
          Secure Administrator Authentication
        </p>

        {/* Warning Badge */}
        <motion.div
          className="mt-6 px-4 py-3 rounded-xl border bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Admin access only - All login attempts are logged
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Form Section */}
      <div className="max-w-md mx-auto">
        <motion.div
          className="border rounded-2xl p-8 shadow-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/50"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
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
                      <FormItem>
                        <FormLabel className="text-base font-medium text-slate-700 dark:text-gray-200">
                          Two Factor Code
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="123456"
                            type="text"
                            className="w-full h-14 border-2 rounded-xl text-lg transition-all duration-300 bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-red-500 dark:focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 dark:text-red-400" />
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
                        <FormItem className="w-full relative">
                          <FormLabel className="text-base font-medium text-slate-700 dark:text-gray-200">
                            Admin Email
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="admin@taxomind.com"
                                type="email"
                                className="w-full h-14 border-2 rounded-xl text-lg pl-12 transition-colors duration-200 bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-red-500 dark:focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                              />
                            </FormControl>
                            <div className={[
                              "absolute left-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-200 pointer-events-none",
                              field.value || focusedField === 'email' ? 'opacity-0' : 'opacity-100',
                              "text-slate-400 dark:text-gray-500"
                            ].join(' ')}>
                              <Mail className="w-5 h-5" />
                            </div>
                            <div className={[
                              "absolute top-0 left-0 h-full w-1 rounded-l-xl transition-colors duration-200",
                              field.value ? "bg-gradient-to-b from-red-500 to-orange-500" : "bg-transparent"
                            ].join(' ')}></div>
                          </div>
                          <FormMessage className="text-red-600 dark:text-red-400" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="w-full relative">
                          <FormLabel className="text-base font-medium text-slate-700 dark:text-gray-200">
                            Admin Password
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="••••••••"
                                type={showPassword ? "text" : "password"}
                                className="w-full h-14 border-2 rounded-xl text-lg pl-12 pr-12 transition-colors duration-200 bg-white dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:border-red-500 dark:focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                              />
                            </FormControl>
                            <div className={[
                              "absolute left-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-200 pointer-events-none",
                              field.value || focusedField === 'password' ? 'opacity-0' : 'opacity-100',
                              "text-slate-400 dark:text-gray-500"
                            ].join(' ')}>
                              <Lock className="w-5 h-5" />
                            </div>
                            <button
                              type="button"
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors focus:outline-none text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                            <div className={[
                              "absolute top-0 left-0 h-full w-1 rounded-l-xl transition-colors duration-200",
                              field.value ? "bg-gradient-to-b from-red-500 to-orange-500" : "bg-transparent"
                            ].join(' ')}></div>
                          </div>
                          <FormMessage className="text-red-600 dark:text-red-400" />
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
                className="pt-2"
              >
                <Button
                  disabled={isPending}
                  type="submit"
                  className="w-full h-14 rounded-xl text-lg font-semibold transition-colors duration-200 shadow-lg relative overflow-hidden group bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white"
                >
                  <span className="relative z-10">
                    {isPending ? "Authenticating..." : "Admin Sign In"}
                  </span>
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="text-center pt-2">
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Not an admin?{' '}
                  <Link
                    href="/auth/login"
                    className="font-medium transition-colors underline-offset-4 hover:underline text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
