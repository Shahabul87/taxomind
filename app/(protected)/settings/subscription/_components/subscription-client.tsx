"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Sparkles,
  Check,
  Zap,
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  Shield,
  Bot,
  Brain,
  Wand2,
  AlertCircle,
  CheckCircle2,
  PartyPopper,
  XCircle,
  Star,
  Infinity,
} from "lucide-react";

interface SubscriptionData {
  userId: string;
  userName: string;
  userEmail: string;
  isPremium: boolean;
  plan: string | null;
  expiresAt: Date | null;
  daysRemaining: number | null;
  isExpired: boolean;
}

interface SubscriptionPageClientProps {
  subscription: SubscriptionData;
  preSelectedPlan?: string;
  showSuccess?: boolean;
  showCanceled?: boolean;
}

type PlanType = "MONTHLY" | "YEARLY" | "LIFETIME";

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  priceValue: number;
  period: string;
  description: string;
  savings?: string;
  popular?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

const plans: Plan[] = [
  {
    id: "MONTHLY",
    name: "Monthly",
    price: "$9.99",
    priceValue: 9.99,
    period: "/month",
    description: "Perfect for trying premium features",
    icon: Zap,
    features: [
      "Unlimited SAM AI Chat",
      "AI Course Creation",
      "Bloom&apos;s Taxonomy Alignment",
      "Content Generation",
      "Priority Support",
      "Cancel anytime",
    ],
  },
  {
    id: "YEARLY",
    name: "Yearly",
    price: "$79.99",
    priceValue: 79.99,
    period: "/year",
    description: "Best value for committed learners",
    savings: "Save 33%",
    popular: true,
    icon: Star,
    features: [
      "Everything in Monthly",
      "2 months FREE",
      "Early access to new features",
      "Advanced analytics",
      "Exclusive webinars",
      "Annual billing",
    ],
  },
  {
    id: "LIFETIME",
    name: "Lifetime",
    price: "$199",
    priceValue: 199,
    period: "one-time",
    description: "Pay once, access forever",
    savings: "Best Value",
    icon: Infinity,
    features: [
      "Everything in Yearly",
      "Lifetime access",
      "All future updates included",
      "Founder badge",
      "Direct support channel",
      "No recurring charges ever",
    ],
  },
];

const premiumFeatures = [
  {
    icon: Bot,
    title: "AI Course Creation",
    description: "Generate complete courses with SAM AI in minutes",
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

export function SubscriptionPageClient({
  subscription,
  preSelectedPlan,
  showSuccess,
  showCanceled,
}: SubscriptionPageClientProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(
    (preSelectedPlan?.toUpperCase() as PlanType) || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

  // Show success/canceled toast on mount
  useEffect(() => {
    if (showSuccess) {
      toast.success("Welcome to Premium!", {
        description: "Your subscription has been activated successfully.",
        icon: <PartyPopper className="h-5 w-5 text-purple-500" />,
      });
      // Clean up URL
      router.replace("/settings/subscription", { scroll: false });
    }
    if (showCanceled) {
      toast.info("Checkout canceled", {
        description: "You can try again when you&apos;re ready.",
      });
      router.replace("/settings/subscription", { scroll: false });
    }
  }, [showSuccess, showCanceled, router]);

  const handleCheckout = async (planId: PlanType) => {
    try {
      setIsLoading(true);
      setLoadingPlan(planId);

      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (!data.success) {
        if (data.error?.code === "ALREADY_LIFETIME") {
          toast.info("Already Premium", {
            description: "You already have lifetime premium access!",
          });
          return;
        }
        throw new Error(data.error?.message || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setIsLoading(false);
      setLoadingPlan(null);
    }
  };

  const formatExpiryDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/settings")}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-6",
              "text-sm text-slate-600 dark:text-slate-400",
              "hover:text-slate-900 dark:hover:text-white",
              "hover:bg-slate-100 dark:hover:bg-slate-700/50",
              "transition-colors"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/25">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Subscription
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {subscription.isPremium
                  ? "Manage your premium subscription"
                  : "Unlock all premium features"}
              </p>
            </div>
          </div>
        </div>

        {/* Current Subscription Status */}
        {subscription.isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-8 p-6 rounded-2xl",
              "bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50",
              "dark:from-violet-950/50 dark:via-purple-950/50 dark:to-fuchsia-950/50",
              "border border-purple-200/50 dark:border-purple-800/50"
            )}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Premium {subscription.plan}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    {subscription.plan === "LIFETIME" ? (
                      <span className="flex items-center gap-1">
                        <Infinity className="h-4 w-4" />
                        Lifetime Access
                      </span>
                    ) : subscription.expiresAt ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Expires: {formatExpiryDate(subscription.expiresAt)}
                        {subscription.daysRemaining && subscription.daysRemaining > 0 && (
                          <span className="text-purple-600 dark:text-purple-400 ml-2">
                            ({subscription.daysRemaining} days left)
                          </span>
                        )}
                      </span>
                    ) : (
                      "Active subscription"
                    )}
                  </p>
                </div>
              </div>

              {subscription.plan !== "LIFETIME" && (
                <Button
                  variant="outline"
                  className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                  onClick={() => {
                    toast.info("Manage Subscription", {
                      description: "Contact support to manage your subscription.",
                    });
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              )}
            </div>

            {subscription.isExpired && (
              <div className="mt-4 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Your subscription has expired. Renew to continue accessing premium features.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Features Overview */}
        {!subscription.isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Premium Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {premiumFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl",
                    "bg-white dark:bg-slate-800",
                    "border border-slate-200 dark:border-slate-700",
                    "shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <feature.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Pricing Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {subscription.isPremium && subscription.plan !== "LIFETIME"
              ? "Upgrade Your Plan"
              : subscription.plan === "LIFETIME"
              ? "Your Plan"
              : "Choose Your Plan"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = subscription.isPremium && subscription.plan === plan.id;
              const isPlanDisabled =
                (subscription.plan === "LIFETIME") ||
                (subscription.plan === "YEARLY" && plan.id === "MONTHLY") ||
                isCurrentPlan;
              const PlanIcon = plan.icon;

              return (
                <motion.div
                  key={plan.id}
                  whileHover={!isPlanDisabled ? { scale: 1.02, y: -4 } : undefined}
                  className={cn(
                    "relative p-6 rounded-2xl transition-all duration-300",
                    "border-2",
                    plan.popular && !isCurrentPlan
                      ? "border-purple-500 bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800"
                      : isCurrentPlan
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
                    isPlanDisabled && !isCurrentPlan && "opacity-60"
                  )}
                >
                  {/* Badge */}
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 text-xs font-bold bg-purple-600 text-white rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 text-xs font-bold bg-green-600 text-white rounded-full">
                        CURRENT PLAN
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-100 dark:bg-slate-700 mb-3">
                      <PlanIcon className={cn(
                        "h-6 w-6",
                        plan.popular ? "text-purple-600 dark:text-purple-400" : "text-slate-600 dark:text-slate-400"
                      )} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    {plan.savings && (
                      <span className="inline-block mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                        {plan.savings}
                      </span>
                    )}
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-1">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={isPlanDisabled || isLoading}
                    className={cn(
                      "w-full h-12 text-base font-semibold rounded-xl transition-all",
                      isCurrentPlan
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : plan.popular
                        ? "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white shadow-lg shadow-purple-500/25"
                        : "bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white"
                    )}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Current Plan
                      </>
                    ) : isPlanDisabled ? (
                      "Not Available"
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        {subscription.isPremium ? "Upgrade" : "Get Started"}
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400"
        >
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            Secure payment via Stripe
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            Instant access
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
            Cancel anytime
          </span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            30-day money-back guarantee
          </span>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                q: "Can I switch plans anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards through our secure Stripe payment processor.",
              },
              {
                q: "Is there a free trial?",
                a: "We offer a generous free tier with limited AI usage. Try it before upgrading!",
              },
              {
                q: "Can I get a refund?",
                a: "Yes! We offer a 30-day money-back guarantee on all paid plans.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className={cn(
                  "p-4 rounded-xl",
                  "bg-white dark:bg-slate-800",
                  "border border-slate-200 dark:border-slate-700"
                )}
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
