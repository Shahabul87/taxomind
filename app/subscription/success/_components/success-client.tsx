"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Crown,
  CheckCircle2,
  Loader2,
  PartyPopper,
  Sparkles,
  ArrowRight,
  AlertCircle,
  XCircle,
} from "lucide-react";

interface SuccessPageClientProps {
  sessionId: string;
  userId: string;
}

type VerificationStatus = "verifying" | "success" | "error" | "already_premium";

export function SuccessPageClient({ sessionId, userId }: SuccessPageClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [planName, setPlanName] = useState<string>("");

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch("/api/subscription/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (data.success) {
          setPlanName(data.data?.plan || "Premium");
          setStatus("success");

          // Trigger confetti celebration
          triggerConfetti();
        } else if (data.error?.code === "ALREADY_PREMIUM") {
          setStatus("already_premium");
        } else {
          setErrorMessage(data.error?.message || "Verification failed");
          setStatus("error");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setErrorMessage("Failed to verify your subscription. Please contact support.");
        setStatus("error");
      }
    };

    verifySession();
  }, [sessionId]);

  const triggerConfetti = async () => {
    const confetti = (await import("canvas-confetti")).default;
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2,
        },
        colors: ["#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F59E0B"],
      });
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2,
        },
        colors: ["#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F59E0B"],
      });
    }, 250);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Verifying State */}
        {status === "verifying" && (
          <div className={cn(
            "p-8 rounded-3xl text-center",
            "bg-white dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-700",
            "shadow-xl"
          )}>
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Verifying Your Subscription
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Please wait while we activate your premium account...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className={cn(
            "p-8 rounded-3xl text-center",
            "bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800",
            "border border-purple-200 dark:border-purple-800",
            "shadow-xl shadow-purple-500/10"
          )}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="p-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                  <Crown className="h-12 w-12 text-white" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-1 -right-1 p-1.5 rounded-full bg-emerald-500"
                >
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="h-6 w-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Welcome to Premium!
                </h1>
                <PartyPopper className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your {planName} subscription has been activated successfully.
              </p>

              <div className="space-y-3 mb-6 text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  You now have access to:
                </p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Unlimited SAM AI Chat
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    AI Course Creation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Content Generation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Priority Support
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/teacher/create/ai-creator")}
                  className={cn(
                    "w-full h-12 text-base font-semibold rounded-xl",
                    "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600",
                    "hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700",
                    "shadow-lg shadow-purple-500/25"
                  )}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Your First AI Course
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Already Premium State */}
        {status === "already_premium" && (
          <div className={cn(
            "p-8 rounded-3xl text-center",
            "bg-white dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-700",
            "shadow-xl"
          )}>
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Crown className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Already Premium!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              You already have an active premium subscription.
            </p>
            <Button
              onClick={() => router.push("/settings/subscription")}
              className="w-full"
            >
              View Subscription Details
            </Button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className={cn(
            "p-8 rounded-3xl text-center",
            "bg-white dark:bg-slate-800",
            "border border-red-200 dark:border-red-800",
            "shadow-xl"
          )}>
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              {errorMessage}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
              If you were charged, please contact support with your session ID.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/settings/subscription")}
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = "mailto:support@taxomind.com"}
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
