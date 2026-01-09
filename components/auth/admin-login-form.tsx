"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Shield,
  Lock,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from "@/lib/logger";

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

              toast.success("Admin login successful! Redirecting...");

              const redirectUrl =
                (data as Record<string, unknown>).redirectTo as string ||
                callbackUrl ||
                "/dashboard/admin";
              setTimeout(() => {
                window.location.href = redirectUrl;
              }, 500);
            }
            if (data?.twoFactor) {
              setShowTwoFactor(true);
              toast.success("Check your email for the 2FA code!");
            }
          })
          .catch((err: Error & { digest?: string }) => {
            if (
              err?.message?.includes("NEXT_REDIRECT") ||
              err?.digest?.includes("NEXT_REDIRECT")
            ) {
              toast.success("Admin login successful! Redirecting...");
              const redirectUrl = callbackUrl || "/dashboard/admin";
              setTimeout(() => {
                window.location.href = redirectUrl;
              }, 500);
              return;
            }
            logger.error("Admin login error:", err);
            setError("Something went wrong");
          });
      });
    } catch (err) {
      logger.error("Admin form submission error:", err);
      setError("An unexpected error occurred");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    },
  };

  return (
    <div className="w-full" style={{ contain: "layout style" }}>
      {/* Mobile Header */}
      <motion.div
        className="flex flex-col items-center justify-center mb-8 lg:hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-xl animate-pulse" />
            <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-2xl shadow-emerald-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Admin Portal
          </h1>
        </div>

        <p className="text-sm text-slate-400 text-center">
          Secure Administrator Authentication
        </p>

        <motion.div
          className="mt-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-medium text-amber-300">
              All login attempts are monitored
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Form Card */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 shadow-2xl shadow-black/20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/20 pointer-events-none" />
        <div className="absolute inset-[1px] rounded-3xl bg-slate-900/95 pointer-events-none" />

        {/* Inner glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        <div className="relative p-8 sm:p-10">
          {/* Form Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <KeyRound className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                {showTwoFactor ? "Verify Identity" : "Sign In"}
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              {showTwoFactor
                ? "Enter the verification code sent to your device"
                : "Enter your credentials to access the admin console"}
            </p>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <AnimatePresence mode="wait">
                {showTwoFactor ? (
                  <motion.div
                    key="2fa"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-300">
                            Verification Code
                          </FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Input
                                {...field}
                                disabled={isPending}
                                placeholder="000000"
                                type="text"
                                maxLength={6}
                                className="w-full h-14 px-4 text-center text-2xl font-mono tracking-[0.5em] bg-slate-800/50 border-2 border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
                              />
                              <div className="absolute inset-0 rounded-xl bg-emerald-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-amber-400" />
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
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-300">
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <div
                                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                                    focusedField === "email" || field.value
                                      ? "text-emerald-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  <Mail className="w-5 h-5" />
                                </div>
                                <Input
                                  {...field}
                                  disabled={isPending}
                                  placeholder="admin@taxomind.com"
                                  type="email"
                                  className="w-full h-14 pl-12 pr-4 bg-slate-800/50 border-2 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-600 transition-all duration-300"
                                  onFocus={() => setFocusedField("email")}
                                  onBlur={() => setFocusedField(null)}
                                />
                                <div
                                  className={`absolute inset-0 rounded-xl bg-emerald-500/5 transition-opacity pointer-events-none ${
                                    focusedField === "email"
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {/* Active indicator line */}
                                <div
                                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500 transition-all duration-300 ${
                                    field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-amber-400" />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-1">
                              <FormLabel className="text-sm font-medium text-slate-300">
                                Password
                              </FormLabel>
                              <Link
                                href="/admin/auth/reset"
                                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                Forgot password?
                              </Link>
                            </div>
                            <FormControl>
                              <div className="relative group">
                                <div
                                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                                    focusedField === "password" || field.value
                                      ? "text-emerald-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  <Lock className="w-5 h-5" />
                                </div>
                                <Input
                                  {...field}
                                  disabled={isPending}
                                  placeholder="Enter your password"
                                  type={showPassword ? "text" : "password"}
                                  className="w-full h-14 pl-12 pr-12 bg-slate-800/50 border-2 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-600 transition-all duration-300"
                                  onFocus={() => setFocusedField("password")}
                                  onBlur={() => setFocusedField(null)}
                                />
                                <button
                                  type="button"
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-lg p-1"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={
                                    showPassword
                                      ? "Hide password"
                                      : "Show password"
                                  }
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                  ) : (
                                    <Eye className="w-5 h-5" />
                                  )}
                                </button>
                                <div
                                  className={`absolute inset-0 rounded-xl bg-emerald-500/5 transition-opacity pointer-events-none ${
                                    focusedField === "password"
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <div
                                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500 transition-all duration-300 ${
                                    field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-amber-400" />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants}>
                <FormError message={error} />
                <FormSuccess message={success} />
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <Button
                  disabled={isPending}
                  type="submit"
                  className="relative w-full h-14 rounded-xl text-base font-semibold overflow-hidden group bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isPending ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>
                          {showTwoFactor ? "Verify Code" : "Sign In Securely"}
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="text-center pt-4 border-t border-slate-800"
              >
                <p className="text-sm text-slate-400">
                  Not an administrator?{" "}
                  <Link
                    href="/auth/login"
                    className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Regular Sign In
                  </Link>
                </p>
              </motion.div>
            </form>
          </Form>
        </div>
      </motion.div>

      {/* Security notice */}
      <motion.div
        className="mt-6 text-center lg:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-xs text-slate-500">
          Protected by enterprise-grade encryption
        </p>
      </motion.div>
    </div>
  );
};
