"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Github, Mail, Lock, Eye, EyeOff, Sparkles, Shield, Zap, Users } from "lucide-react";
import { GoogleIcon } from "@/components/icons/custom-icons";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { logger } from '@/lib/logger';

import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { login } from "@/actions/login";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");
  const urlError = searchParams?.get("error") === "OAuthAccountNotLinked"
    ? "Email already in use with different provider!"
    : "";

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

              if (data?.requiresSignIn && data?.email) {
                const result = await signIn("credentials", {
                  email: data.email,
                  password: values.password,
                  redirect: false,
                });

                if (result?.error) {
                  setError("Failed to sign in");
                } else if (result?.ok) {
                  window.location.href = callbackUrl || "/dashboard";
                }
              }
            }
            if (data?.twoFactor) {
              setShowTwoFactor(true);
              toast.success("Check your email for the 2FA code!");
            }
          })
          .catch((error) => {
            if (error?.message?.includes("NEXT_REDIRECT")) {
              return;
            }
            logger.error("Login error:", error);
            setError("Something went wrong");
          });
      });
    } catch (error) {
      logger.error("Form submission error:", error);
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-purple-300/30 dark:bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/4 right-0 w-96 h-96 bg-blue-300/30 dark:bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-300/30 dark:bg-pink-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Side - Branding & Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Logo with Glow */}
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-xl opacity-50" />
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                TaxoMind
              </h1>
            </motion.div>

            {/* Welcome Heading */}
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
                Welcome Back!
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Sign in to continue your learning journey
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4">
              {[
                {
                  icon: Shield,
                  title: "Secure & Private",
                  description: "Your data is protected with enterprise-grade security",
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Access your courses instantly from anywhere",
                },
                {
                  icon: Users,
                  title: "Collaborative Learning",
                  description: "Join thousands of learners worldwide",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                >
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white dark:border-gray-900"
                  />
                ))}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900 dark:text-white">
                  50,000+ learners
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Already joined us
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Loading Overlay */}
            {isPending && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                    <div className="absolute top-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 animate-pulse font-medium">
                    Signing you in...
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
              <div className="space-y-6">
                {/* Form Header */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Sign In
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/auth/register"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Sign Up
                    </Link>
                  </p>
                </div>

                {/* Email Field */}
                <div className="relative">
                  <label
                    htmlFor="email"
                    className={`absolute left-12 transition-all duration-200 pointer-events-none ${
                      form.watch("email") || form.formState.errors.email
                        ? "-top-2 left-3 text-xs bg-white dark:bg-gray-800 px-2 text-blue-600 dark:text-blue-400"
                        : "top-4 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className={`absolute left-4 top-4 w-5 h-5 transition-colors ${
                        form.formState.errors.email
                          ? "text-red-500"
                          : form.watch("email")
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400"
                      }`}
                    />
                    <Input
                      {...form.register("email")}
                      id="email"
                      type="email"
                      placeholder=" "
                      disabled={isPending}
                      className={`h-14 pl-12 pr-4 rounded-xl border-2 transition-all ${
                        form.formState.errors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-500 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="relative">
                  <label
                    htmlFor="password"
                    className={`absolute left-12 transition-all duration-200 pointer-events-none ${
                      form.watch("password") || form.formState.errors.password
                        ? "-top-2 left-3 text-xs bg-white dark:bg-gray-800 px-2 text-blue-600 dark:text-blue-400"
                        : "top-4 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-4 top-4 w-5 h-5 transition-colors ${
                        form.formState.errors.password
                          ? "text-red-500"
                          : form.watch("password")
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400"
                      }`}
                    />
                    <Input
                      {...form.register("password")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder=" "
                      disabled={isPending}
                      className={`h-14 pl-12 pr-12 rounded-xl border-2 transition-all ${
                        form.formState.errors.password
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">
                      {form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/auth/reset"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Error/Success Messages */}
                {(error || urlError) && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                    {error || urlError}
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400">
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isPending}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium text-base shadow-lg hover:shadow-xl transition-all"
                >
                  {isPending ? "Signing in..." : "Sign In"}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => signIn("google", { callbackUrl: DEFAULT_LOGIN_REDIRECT })}
                    variant="outline"
                    className="h-12 border-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <GoogleIcon className="w-5 h-5 mr-2" />
                    Google
                  </Button>
                  <Button
                    onClick={() => signIn("github", { callbackUrl: DEFAULT_LOGIN_REDIRECT })}
                    variant="outline"
                    className="h-12 border-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Github className="w-5 h-5 mr-2" />
                    GitHub
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
