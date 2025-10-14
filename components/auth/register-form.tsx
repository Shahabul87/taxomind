"use client";

import * as z from "zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github, Eye, EyeOff, Mail, User, Lock, Shield, Users, Award, TrendingUp, CheckCircle2, Sparkles } from "lucide-react";
import { GoogleIcon } from "@/components/icons/custom-icons";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { motion } from "framer-motion";

import { RegisterSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { register } from "@/actions/register";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";

export const RegisterForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      register(values)
        .then((data) => {
          if (data.error) {
            form.reset();
            setError(data.error);
          }
          if (data.success) {
            form.reset();
            setSuccess(data.success);
            setTimeout(() => {
              router.push('/auth/check-email');
            }, 1500);
          }
        });
    });
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/30 to-purple-50 dark:from-gray-900 dark:via-indigo-900/10 dark:to-gray-900 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-blue-300/30 dark:bg-blue-500/10 rounded-full blur-3xl"
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
          className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300/30 dark:bg-indigo-500/10 rounded-full blur-3xl"
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
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full" />
              <div className="w-16 h-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin absolute top-0 left-0" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Creating your account...
            </p>
          </div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Benefits & Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-xl opacity-50" />
                  <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  TaxoMind
                </h1>
              </div>

              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Join TaxoMind Today
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Start your learning journey with enterprise-grade security and support
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                {[
                  {
                    icon: Shield,
                    title: "Enterprise Security",
                    description: "Bank-level encryption and SOC 2 Type II certified infrastructure protecting your data.",
                  },
                  {
                    icon: Award,
                    title: "Expert-Led Courses",
                    description: "Learn from industry professionals with verified credentials and real-world experience.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Track Your Progress",
                    description: "Advanced analytics and personalized insights to accelerate your learning journey.",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  >
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
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

              {/* Trust Indicators */}
              <div className="p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">Trusted by 50,000+ learners</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">4.9/5</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">10K+</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">99.9%</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Uptime</p>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">256-bit SSL Encryption</p>
                  <p className="text-sm text-green-700 dark:text-green-400">Your data is protected with industry-standard security</p>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Registration Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Create Your Account
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Already have an account?{" "}
                      <Link
                        href="/auth/login"
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        Sign In
                      </Link>
                    </p>
                  </div>

                  {/* Social OAuth Buttons */}
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => signIn("google", { callbackUrl: DEFAULT_LOGIN_REDIRECT })}
                      className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                      disabled={isPending}
                    >
                      <GoogleIcon className="w-5 h-5 mr-2" />
                      <span className="font-medium">Continue with Google</span>
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => signIn("github", { callbackUrl: DEFAULT_LOGIN_REDIRECT })}
                      className="w-full h-12 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                      disabled={isPending}
                    >
                      <Github className="w-5 h-5 mr-2" />
                      <span className="font-medium">Continue with GitHub</span>
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  {/* Registration Form */}
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Name Field */}
                    <div className="relative">
                      <label
                        htmlFor="name"
                        className={`absolute left-12 transition-all duration-200 pointer-events-none ${
                          form.watch("name") || form.formState.errors.name
                            ? "-top-2 left-3 text-xs bg-white dark:bg-gray-800 px-2 text-blue-600 dark:text-blue-400"
                            : "top-4 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <User
                          className={`absolute left-4 top-4 w-5 h-5 transition-colors ${
                            form.formState.errors.name
                              ? "text-red-500"
                              : form.watch("name")
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-400"
                          }`}
                        />
                        <Input
                          {...form.register("name")}
                          id="name"
                          type="text"
                          placeholder=" "
                          disabled={isPending}
                          className={`h-14 pl-12 pr-4 rounded-xl border-2 transition-all ${
                            form.formState.errors.name
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          }`}
                        />
                      </div>
                      {form.formState.errors.name && (
                        <p className="text-xs text-red-500 mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
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
                          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
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

                    {/* Password Strength Meter */}
                    <PasswordStrengthMeter password={form.watch("password") || ""} />

                    {/* Terms & Privacy Checkboxes */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="acceptTerms"
                          checked={form.watch("acceptTerms")}
                          onCheckedChange={(checked) => form.setValue("acceptTerms", checked as boolean)}
                          className="mt-1"
                          disabled={isPending}
                        />
                        <label
                          htmlFor="acceptTerms"
                          className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer"
                        >
                          I agree to the{" "}
                          <Link
                            href="/terms"
                            target="_blank"
                            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          >
                            Terms and Conditions
                          </Link>
                        </label>
                      </div>
                      {form.formState.errors.acceptTerms && (
                        <p className="text-xs text-red-500 ml-8">
                          {form.formState.errors.acceptTerms.message}
                        </p>
                      )}

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="acceptPrivacy"
                          checked={form.watch("acceptPrivacy")}
                          onCheckedChange={(checked) => form.setValue("acceptPrivacy", checked as boolean)}
                          className="mt-1"
                          disabled={isPending}
                        />
                        <label
                          htmlFor="acceptPrivacy"
                          className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer"
                        >
                          I agree to the{" "}
                          <Link
                            href="/privacy"
                            target="_blank"
                            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          >
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                      {form.formState.errors.acceptPrivacy && (
                        <p className="text-xs text-red-500 ml-8">
                          {form.formState.errors.acceptPrivacy.message}
                        </p>
                      )}
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {success}
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-base shadow-lg hover:shadow-xl transition-all"
                    >
                      {isPending ? "Creating Account..." : "Create Account"}
                    </Button>

                    {/* Security Note */}
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                      🔒 Protected by enterprise-grade encryption
                    </p>
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
