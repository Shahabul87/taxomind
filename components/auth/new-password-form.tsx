"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Lock, Shield, Brain, TrendingUp, Award, Sparkles, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

import { NewPasswordSchema } from "@/schemas";
import { Button } from "@/components/ui/button";
import { newPassword } from "@/actions/new-password";

export const NewPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token");

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      newPassword(values, token)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }
          if (data?.success) {
            form.reset();
            setSuccess(data.success);

            // Auto-redirect to login after successful password reset
            setTimeout(() => {
              router.push("/auth/login?message=Password updated successfully! Please login with your new password.");
            }, 2000);
          }
        });
    });
  };

  return (
    <div className="w-full relative">
      {/* Loading Overlay */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4 max-w-sm mx-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-muted rounded-full" />
              <div className="w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin absolute top-0 left-0" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                Resetting password
              </p>
              <p className="text-sm text-slate-600">
                This will only take a moment...
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - AI-Powered LMS Features */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur-xl opacity-50" />
                  <div className="relative bg-gradient-to-r from-primary to-accent p-3 rounded-xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  TaxoMind
                </h1>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.h2
                  className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent bg-size-200 bg-pos-0"
                  animate={{
                    backgroundPosition: ['0%', '100%', '0%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{ backgroundSize: '200% auto' }}
                >
                  Set New Password
                </motion.h2>
                <motion.p
                  className="text-lg text-slate-700 dark:text-gray-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Create a strong password to secure your account
                </motion.p>
              </motion.div>

              {/* Features */}
              <div className="space-y-3">
                {[
                  {
                    icon: Shield,
                    title: "Secure Reset",
                    description: "Your password is encrypted with military-grade security",
                    gradient: "from-purple-500 to-blue-500",
                    iconColor: "text-purple-100",
                  },
                  {
                    icon: Lock,
                    title: "Strong Protection",
                    description: "Advanced password requirements for maximum safety",
                    gradient: "from-blue-500 to-cyan-500",
                    iconColor: "text-blue-100",
                  },
                  {
                    icon: TrendingUp,
                    title: "Quick Access",
                    description: "Instantly regain access to your learning journey",
                    gradient: "from-cyan-500 to-emerald-500",
                    iconColor: "text-cyan-100",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800/90 dark:to-slate-800/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/50 hover:border-purple-400/40 dark:hover:border-purple-500/40 hover:shadow-lg dark:hover:shadow-purple-500/10 transition-all duration-300"
                  >
                    <div className={`p-3 bg-gradient-to-br ${feature.gradient} rounded-xl shrink-0 shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                      <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Trust Metrics */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="group">
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">50K+</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-gray-300 mt-1">Learners</p>
                  </div>
                  <div className="group">
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">10K+</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-gray-300 mt-1">AI Courses</p>
                  </div>
                  <div className="group">
                    <p className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">4.9★</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-gray-300 mt-1">Rating</p>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Enterprise-grade security with end-to-end encryption
                </p>
              </div>
            </motion.div>

            {/* Right Side - New Password Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white dark:bg-slate-900/95 dark:backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                {/* Gradient Header */}
                <div className="relative h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-size-200 bg-pos-0 animate-[shimmer_8s_ease-in-out_infinite]"></div>

                <div className="p-8 space-y-6">
                  <motion.div
                    className="text-center space-y-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.h3
                      className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-primary bg-clip-text text-transparent"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      Create New Password
                    </motion.h3>
                    <motion.p
                      className="text-sm text-slate-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      Enter a strong password to secure your account
                    </motion.p>
                  </motion.div>

                  {/* New Password Form */}
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {/* Password Field */}
                    <div className="relative group">
                      <div className="relative">
                        <Lock
                          className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
                            form.formState.errors.password
                              ? "text-red-500"
                              : form.watch("password")
                              ? "text-purple-500 dark:text-purple-400"
                              : "text-slate-400 dark:text-slate-500"
                          } ${form.watch("password") ? "top-4 -translate-y-0" : ""}`}
                        />
                        <input
                          {...form.register("password")}
                          id="password"
                          type={showPassword ? "text" : "password"}
                          disabled={isPending}
                          className={`peer w-full h-14 pl-12 pr-12 pt-4 pb-2 rounded-xl border bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white
                            transition-all duration-300 outline-none
                            placeholder-transparent
                            ${
                              form.formState.errors.password
                                ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                                : "border-slate-200 dark:border-slate-700/50 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed`}
                          placeholder="New Password"
                        />
                        <label
                          htmlFor="password"
                          className={`absolute left-12 top-1/2 -translate-y-1/2 text-sm transition-all duration-300 pointer-events-none
                            peer-focus:-top-2 peer-focus:left-3 peer-focus:text-xs peer-focus:px-2
                            peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:px-2
                            ${
                              form.formState.errors.password
                                ? "text-destructive peer-focus:text-destructive peer-[:not(:placeholder-shown)]:text-destructive"
                                : "text-slate-600 dark:text-slate-400 peer-focus:text-purple-500 dark:peer-focus:text-purple-400 peer-[:not(:placeholder-shown)]:text-purple-500 dark:peer-[:not(:placeholder-shown)]:text-purple-400"
                            }
                            peer-focus:bg-white dark:peer-focus:bg-slate-900 peer-[:not(:placeholder-shown)]:bg-white dark:peer-[:not(:placeholder-shown)]:bg-slate-900`}
                        >
                          New Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {form.formState.errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs text-destructive mt-1.5 ml-1"
                        >
                          {form.formState.errors.password.message}
                        </motion.p>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="p-3 rounded-lg bg-accent dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                      <p className="text-xs text-slate-600 mb-2 font-medium">Password must contain:</p>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                          At least 8 characters
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                          One uppercase letter
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                          One number
                        </li>
                      </ul>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold">!</span>
                        </div>
                        <p className="flex-1">{error}</p>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-xl bg-green-500/10 dark:bg-green-400/10 border border-green-500/20 dark:border-green-400/20 text-sm text-green-700 dark:text-green-400 flex items-center gap-3"
                      >
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold">✓</span>
                        </div>
                        <p className="flex-1">{success}</p>
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <Button
                      disabled={isPending}
                      type="submit"
                      className="w-full h-13 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                      <span className="relative z-10">
                        {isPending ? "Resetting..." : "Reset Password"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </Button>

                    {/* Back to Login Link */}
                    <div className="flex justify-center pt-2">
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to login
                      </Link>
                    </div>

                    {/* Security Note */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Shield className="w-3.5 h-3.5 text-slate-600" />
                      <p className="text-xs text-slate-600">
                        Protected by enterprise-grade encryption
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
