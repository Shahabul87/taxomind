"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Crown,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  ArrowRight,
  Lock,
  Bot,
  Brain,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  title?: string;
  description?: string;
}

const premiumFeatures = [
  {
    icon: Bot,
    title: "AI Course Creation",
    description: "Generate complete courses with SAM AI",
  },
  {
    icon: Brain,
    title: "Bloom&apos;s Taxonomy Alignment",
    description: "Pedagogically-sound course structures",
  },
  {
    icon: Wand2,
    title: "Content Generation",
    description: "AI-powered lessons, quizzes & exams",
  },
  {
    icon: Zap,
    title: "Unlimited AI Usage",
    description: "No daily or monthly limits",
  },
];

const plans = [
  {
    name: "Monthly",
    price: "$9.99",
    period: "/month",
    popular: false,
  },
  {
    name: "Yearly",
    price: "$79.99",
    period: "/year",
    savings: "Save 33%",
    popular: true,
  },
  {
    name: "Lifetime",
    price: "$199",
    period: "one-time",
    savings: "Best Value",
    popular: false,
  },
];

export function UpgradePromptModal({
  isOpen,
  onClose,
  feature = "AI Course Creation",
  title,
  description,
}: UpgradePromptProps) {
  const router = useRouter();

  const handleUpgrade = (plan: string) => {
    // Navigate to subscription page with plan pre-selected
    router.push(`/settings/subscription?plan=${plan.toLowerCase()}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 pb-8">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <DialogHeader className="text-left p-0">
                <DialogTitle className="text-2xl font-bold text-white">
                  {title || `Unlock ${feature}`}
                </DialogTitle>
                <DialogDescription className="text-white/80 mt-1">
                  {description ||
                    "Upgrade to Premium to access all AI-powered features"}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Lock indicator */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
            <div className="p-2 rounded-full bg-white shadow-lg">
              <Lock className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-8 space-y-6">
          {/* Features grid */}
          <div className="grid grid-cols-2 gap-3">
            {premiumFeatures.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex-shrink-0 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <item.icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Plans */}
          <div className="grid grid-cols-3 gap-3">
            {plans.map((plan) => (
              <motion.button
                key={plan.name}
                onClick={() => handleUpgrade(plan.name)}
                className={cn(
                  "relative p-4 rounded-xl text-left transition-all",
                  "border-2",
                  plan.popular
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-600 text-white rounded-full">
                      POPULAR
                    </span>
                  </div>
                )}
                {plan.savings && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {plan.savings}
                  </span>
                )}
                <div className="mt-1">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {plan.period}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {plan.name}
                </p>
              </motion.button>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => router.push("/settings/subscription")}
            className={cn(
              "w-full h-12 text-base font-semibold rounded-xl",
              "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600",
              "hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700",
              "shadow-lg shadow-purple-500/25"
            )}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            View All Plans
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Secure payment
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Instant access
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline upgrade prompt for embedding in pages
 */
export function UpgradePromptInline({
  feature = "AI Course Creation",
  onUpgrade,
  className,
}: {
  feature?: string;
  onUpgrade?: () => void;
  className?: string;
}) {
  const router = useRouter();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      router.push("/settings/subscription");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50",
        "dark:from-violet-950/50 dark:via-purple-950/50 dark:to-fuchsia-950/50",
        "border border-purple-200/50 dark:border-purple-800/50",
        "p-6",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 rounded-full blur-3xl" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/25">
          <Lock className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {feature} requires Premium
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Upgrade to unlock AI-powered course creation and all premium
            features
          </p>
        </div>

        <Button
          onClick={handleUpgrade}
          className={cn(
            "flex-shrink-0 h-10 px-5 rounded-xl font-semibold",
            "bg-gradient-to-r from-violet-600 to-purple-600",
            "hover:from-violet-700 hover:to-purple-700",
            "shadow-lg shadow-purple-500/25"
          )}
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade Now
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Locked feature overlay for cards/buttons
 */
export function LockedFeatureOverlay({
  children,
  isLocked,
  feature = "This feature",
  onUpgradeClick,
}: {
  children: React.ReactNode;
  isLocked: boolean;
  feature?: string;
  onUpgradeClick?: () => void;
}) {
  const router = useRouter();

  if (!isLocked) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      router.push("/settings/subscription");
    }
  };

  return (
    <div className="relative">
      <div className="opacity-60 pointer-events-none">{children}</div>

      {/* Lock overlay */}
      <div
        onClick={handleClick}
        className={cn(
          "absolute inset-0 flex items-center justify-center cursor-pointer",
          "bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]",
          "rounded-inherit",
          "transition-all hover:bg-white/70 dark:hover:bg-slate-900/70"
        )}
      >
        <div className="flex flex-col items-center gap-2 p-4 text-center">
          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
            <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Premium Required
          </span>
          <Button
            size="sm"
            className="h-8 px-4 text-xs bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          >
            <Crown className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
}
