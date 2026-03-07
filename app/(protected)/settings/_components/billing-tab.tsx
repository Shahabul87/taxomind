"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Zap,
  TrendingUp,
  Clock,
  Check,
  X,
  ChevronRight,
  Sparkles,
  RefreshCcw,
  AlertCircle,
  Crown,
  Rocket,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

interface SubscriptionStats {
  tier: string;
  tierLabel: string;
  daily: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  monthly: {
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  features: {
    chat: boolean;
    courseGeneration: boolean;
    advancedAnalysis: boolean;
    codeReview: boolean;
    unlimitedExports: boolean;
    prioritySupport: boolean;
  };
  recentUsage: {
    date: string;
    generations: number;
    tokens: number;
  }[];
  nextReset: {
    daily: string;
    monthly: string;
  };
}

// Tier configurations for upgrade cards
const tierConfigs: Record<string, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  borderColor: string;
  price: string;
  features: string[];
}> = {
  FREE: {
    icon: Zap,
    color: "text-slate-600 dark:text-slate-400",
    bgGradient: "from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-700/40",
    borderColor: "border-slate-200 dark:border-slate-700",
    price: "$0",
    features: ["10 daily chat messages", "50 monthly AI operations", "Basic SAM AI features"],
  },
  STARTER: {
    icon: Rocket,
    color: "text-blue-600 dark:text-blue-400",
    bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    price: "$9.99/mo",
    features: ["100 daily chat messages", "500 monthly AI operations", "Course generation", "Chapter & lesson creation"],
  },
  PROFESSIONAL: {
    icon: Crown,
    color: "text-purple-600 dark:text-purple-400",
    bgGradient: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    price: "$29.99/mo",
    features: ["1,000 daily chat messages", "2,000 monthly AI operations", "Advanced analysis", "Code review", "Priority support"],
  },
  ENTERPRISE: {
    icon: Building2,
    color: "text-amber-600 dark:text-amber-400",
    bgGradient: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    price: "Custom",
    features: ["10,000 daily chat messages", "Unlimited AI operations", "All features included", "Dedicated support", "Custom integrations"],
  },
};

// Feature display names
const featureLabels: Record<string, string> = {
  chat: "SAM AI Chat",
  courseGeneration: "Course Generation",
  advancedAnalysis: "Advanced Analysis",
  codeReview: "Code Review",
  unlimitedExports: "Unlimited Exports",
  prioritySupport: "Priority Support",
};

export const BillingTab = () => {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/user/subscription-stats");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch subscription stats");
      }

      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchStats();
    }
  }, [fetchStats]);

  const formatTimeUntilReset = (resetDate: string) => {
    const reset = new Date(resetDate);
    const now = new Date();
    const diff = reset.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""}`;
    }
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getCurrentTierConfig = () => {
    return tierConfigs[stats?.tier || "FREE"] || tierConfigs.FREE;
  };

  const getNextTier = (): string | null => {
    const tiers = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
    const currentIndex = tiers.indexOf(stats?.tier || "FREE");
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }
    return null;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-600 dark:text-slate-300">Loading subscription details...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-5 rounded-2xl",
          "bg-red-50 dark:bg-red-900/20",
          "border border-red-200 dark:border-red-800"
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Error Loading Subscription
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Button onClick={fetchStats} variant="outline" className="border-red-300 text-red-700">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </motion.div>
    );
  }

  if (!stats) return null;

  const tierConfig = getCurrentTierConfig();
  const TierIcon = tierConfig.icon;
  const nextTier = getNextTier();
  const nextTierConfig = nextTier ? tierConfigs[nextTier] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Current Plan Header */}
      <div className={cn(
        "p-5 rounded-2xl",
        `bg-gradient-to-br ${tierConfig.bgGradient}`,
        "backdrop-blur-sm",
        `border ${tierConfig.borderColor}`,
        "shadow-sm"
      )}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center",
              "bg-white/80 dark:bg-slate-800/80 shadow-sm"
            )}>
              <TierIcon className={cn("h-6 w-6", tierConfig.color)} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Current Plan</p>
              <h2 className={cn("text-2xl font-bold", tierConfig.color)}>
                {stats.tierLabel}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-3xl font-bold", tierConfig.color)}>
              {tierConfig.price}
            </p>
            {stats.tier !== "ENTERPRISE" && (
              <p className="text-xs text-slate-500 dark:text-slate-400">per month</p>
            )}
          </div>
        </div>

        {/* Upgrade Button for non-enterprise */}
        {nextTier && nextTierConfig && (
          <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
            <Button
              asChild
              className={cn(
                "w-full",
                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                "text-white shadow-lg"
              )}
            >
              <Link href="/pricing">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to {nextTier.charAt(0) + nextTier.slice(1).toLowerCase()}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className={cn(
        "p-5 rounded-2xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-sm"
      )}>
        <div className="flex items-center space-x-3 mb-5">
          <div className={cn(
            "h-9 w-9 rounded-lg",
            "bg-gradient-to-br from-blue-500 to-indigo-500",
            "flex items-center justify-center shadow-sm"
          )}>
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              AI Usage
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Your current usage and limits
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Daily Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Daily Chat Usage
                </span>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {stats.daily.used} / {stats.daily.limit}
              </span>
            </div>
            <Progress
              value={stats.daily.percentage}
              className="h-2"
            />
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{stats.daily.remaining} remaining</span>
              <span>Resets in {formatTimeUntilReset(stats.nextReset.daily)}</span>
            </div>
          </div>

          {/* Monthly Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Monthly AI Operations
                </span>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {stats.monthly.used} / {stats.monthly.limit}
              </span>
            </div>
            <Progress
              value={stats.monthly.percentage}
              className={cn("h-2", getProgressColor(stats.monthly.percentage))}
            />
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{stats.monthly.remaining} remaining</span>
              <span>Resets in {formatTimeUntilReset(stats.nextReset.monthly)}</span>
            </div>
          </div>
        </div>

        {/* Usage Warning */}
        {(stats.daily.percentage >= 80 || stats.monthly.percentage >= 80) && (
          <div className={cn(
            "mt-4 p-3 rounded-lg",
            "bg-amber-50 dark:bg-amber-900/20",
            "border border-amber-200 dark:border-amber-800"
          )}>
            <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              You&apos;re approaching your usage limit. Consider upgrading for more capacity.
            </p>
          </div>
        )}
      </div>

      {/* Features Included */}
      <div className={cn(
        "p-5 rounded-2xl",
        "bg-white/80 dark:bg-slate-800/80",
        "backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-sm"
      )}>
        <div className="flex items-center space-x-3 mb-5">
          <div className={cn(
            "h-9 w-9 rounded-lg",
            "bg-gradient-to-br from-blue-500 to-indigo-500",
            "flex items-center justify-center shadow-sm"
          )}>
            <Check className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Features
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              What&apos;s included in your plan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(stats.features).map(([key, enabled]) => (
            <div
              key={key}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                enabled
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "bg-slate-50 dark:bg-slate-900/30"
              )}
            >
              {enabled ? (
                <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <X className="h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              )}
              <span className={cn(
                "text-sm",
                enabled
                  ? "text-green-800 dark:text-green-200"
                  : "text-slate-500 dark:text-slate-400"
              )}>
                {featureLabels[key] || key}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Usage Chart */}
      {stats.recentUsage.length > 0 && (
        <div className={cn(
          "p-5 rounded-2xl",
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-sm"
        )}>
          <div className="flex items-center space-x-3 mb-5">
            <div className={cn(
              "h-9 w-9 rounded-lg",
              "bg-gradient-to-br from-blue-500 to-indigo-500",
              "flex items-center justify-center shadow-sm"
            )}>
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Recent Activity
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Last 7 days of AI usage
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {stats.recentUsage.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30"
              >
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {day.generations} operations
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {day.tokens.toLocaleString()} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA for non-enterprise */}
      {nextTier && nextTierConfig && (
        <div className={cn(
          "p-5 rounded-2xl",
          `bg-gradient-to-br ${nextTierConfig.bgGradient}`,
          "backdrop-blur-sm",
          `border ${nextTierConfig.borderColor}`,
          "shadow-sm"
        )}>
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
              "bg-white/80 dark:bg-slate-800/80 shadow-md"
            )}>
              {nextTierConfig.icon && <nextTierConfig.icon className={cn("h-6 w-6", nextTierConfig.color)} />}
            </div>
            <div className="flex-1">
              <h3 className={cn("text-lg font-bold mb-1", nextTierConfig.color)}>
                Upgrade to {nextTier.charAt(0) + nextTier.slice(1).toLowerCase()}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Get more AI power and unlock advanced features
              </p>
              <ul className="space-y-2 mb-4">
                {nextTierConfig.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/pricing">
                  View Pricing
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
