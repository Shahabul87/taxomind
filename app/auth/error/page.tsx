"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, TrendingUp, Award, Sparkles, ArrowLeft, HelpCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification token has expired or has already been used.",
  Default: "An error occurred during authentication.",
  OAuthSignin: "Error in constructing an authorization URL.",
  OAuthCallback: "Error in handling the response from an OAuth provider.",
  OAuthCreateAccount: "Could not create OAuth account in the database.",
  EmailCreateAccount: "Could not create email account in the database.",
  Callback: "Error in the OAuth callback handler route.",
  OAuthAccountNotLinked: "The account is not linked. Try signing in with a different account.",
  EmailSignin: "Sending the e-mail with the verification token failed.",
  CredentialsSignin: "The credentials provided are incorrect.",
  SessionRequired: "You must be signed in to access this page.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") as keyof typeof errorMessages;

  const errorMessage = error && errorMessages[error]
    ? errorMessages[error]
    : errorMessages.Default;

  const getErrorDetails = (error: string) => {
    switch (error) {
      case "OAuthSignin":
      case "OAuthCallback":
        return "This usually indicates a problem with OAuth provider configuration (Google/GitHub client ID/secret).";
      case "OAuthAccountNotLinked":
        return "You may have previously signed up with a different method. Try using the same method you used to create your account.";
      case "CredentialsSignin":
        return "Please check your email and password. If you have an old account, you may need to reset your password.";
      case "Configuration":
        return "The authentication service is not properly configured. Please contact support.";
      default:
        return "Please try again or contact support if the problem persists.";
    }
  };

  return (
    <div className="mt-20 flex flex-col items-center justify-center">
      <div className="w-full relative">
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

                <div>
                  <h2 className="text-4xl font-bold text-foreground mb-3">
                    Authentication Error
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    We encountered an issue while processing your request
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {[
                    {
                      icon: HelpCircle,
                      title: "We&apos;re Here to Help",
                      description: "Our support team is available to assist you",
                    },
                    {
                      icon: Shield,
                      title: "Secure Authentication",
                      description: "Your account security is our top priority",
                    },
                    {
                      icon: TrendingUp,
                      title: "Quick Resolution",
                      description: "Most authentication issues are resolved quickly",
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-lg shrink-0">
                        <feature.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">
                          {feature.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Trust Metrics */}
                <div className="p-5 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">50K+</p>
                      <p className="text-xs text-muted-foreground">Learners</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">10K+</p>
                      <p className="text-xs text-muted-foreground">AI Courses</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">4.9★</p>
                      <p className="text-xs text-muted-foreground">Rating</p>
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

              {/* Right Side - Error Details */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-white/95 dark:bg-slate-900/95 dark:backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                  {/* Gradient Header */}
                  <div className="relative h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 bg-size-200 bg-pos-0 animate-[shimmer_8s_ease-in-out_infinite]"></div>

                  <div className="p-8 space-y-6">
                    <div className="text-center space-y-4">
                      {/* Error Icon */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="mx-auto w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center"
                      >
                        <AlertTriangle className="w-10 h-10 text-destructive" />
                      </motion.div>

                      <h3 className="text-2xl font-bold text-foreground tracking-tight">
                        Oops! Something Went Wrong
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Don&apos;t worry, we&apos;ll help you get back on track
                      </p>
                    </div>

                    {/* Error Message */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive"
                    >
                      <p className="font-semibold mb-2">{errorMessage}</p>
                      <p className="text-xs text-destructive/80">
                        {getErrorDetails(error || "Default")}
                      </p>
                    </motion.div>

                    {/* Error Code */}
                    {error && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                        <p className="text-xs text-muted-foreground">
                          Error Code: <code className="font-mono font-semibold text-foreground">{error}</code>
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button
                        asChild
                        className="w-full h-13 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                      >
                        <Link href="/auth/login">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          <span className="relative z-10">Back to Sign In</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </Link>
                      </Button>

                      {error === "CredentialsSignin" && (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full h-13 rounded-xl font-semibold text-base border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                          <Link href="/auth/reset">
                            Reset Password
                          </Link>
                        </Button>
                      )}
                    </div>

                    {/* Help Text */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Need help? Contact support with the error code above
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
