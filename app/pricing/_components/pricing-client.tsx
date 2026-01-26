"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Check,
  Building2,
  Crown,
  Zap,
  Star,
  Infinity,
  Bot,
  Brain,
  Wand2,
  Shield,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface PricingClientProps {
  isLoggedIn: boolean;
  isPremium: boolean;
  currentPlan: string | null;
  showCanceled?: boolean;
}

type PlanType = "MONTHLY" | "YEARLY" | "LIFETIME";

interface Plan {
  id: PlanType | "FREE";
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  savings?: string;
  badge?: string;
}

const plans: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with online learning",
    features: [
      "Access to free courses",
      "Basic progress tracking",
      "Community forums",
      "Limited SAM AI chat (10/day)",
      "Email support",
    ],
    cta: "Get Started",
  },
  {
    id: "MONTHLY",
    name: "Premium Monthly",
    price: "$9.99",
    period: "/month",
    description: "Unlock all AI-powered features",
    features: [
      "Everything in Free",
      "Unlimited SAM AI chat",
      "AI Course Creation",
      "Bloom&apos;s Taxonomy alignment",
      "Content generation",
      "Priority support",
      "Cancel anytime",
    ],
    cta: "Subscribe Monthly",
    highlighted: false,
  },
  {
    id: "YEARLY",
    name: "Premium Yearly",
    price: "$79.99",
    period: "/year",
    description: "Best value for committed learners",
    features: [
      "Everything in Monthly",
      "2 months FREE",
      "Early access to new features",
      "Advanced analytics",
      "Exclusive webinars",
      "Annual billing",
    ],
    cta: "Subscribe Yearly",
    highlighted: true,
    savings: "Save 33%",
    badge: "Most Popular",
  },
  {
    id: "LIFETIME",
    name: "Premium Lifetime",
    price: "$199",
    period: "one-time",
    description: "Pay once, access forever",
    features: [
      "Everything in Yearly",
      "Lifetime access",
      "All future updates",
      "Founder badge",
      "Direct support channel",
      "No recurring charges",
    ],
    cta: "Get Lifetime Access",
    savings: "Best Value",
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
    title: "Bloom&apos;s Taxonomy",
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

const enterpriseFeatures = [
  "Custom contract & SLA",
  "Dedicated infrastructure",
  "White-label solution",
  "Custom integrations",
  "Advanced security & compliance",
  "24/7 phone support",
  "On-premise deployment option",
  "Custom AI model training",
];

const faqs = [
  {
    question: "Can I switch plans anytime?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.",
  },
  {
    question: "Is there a free trial?",
    answer: "We offer a generous free tier with limited AI usage. Try it before upgrading to unlock unlimited access!",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards through our secure Stripe payment processor.",
  },
  {
    question: "Can I get a refund?",
    answer: "We offer a 30-day money-back guarantee on all paid plans. If you&apos;re not satisfied, contact us for a full refund.",
  },
  {
    question: "What&apos;s included in AI Course Creation?",
    answer: "Create complete courses with AI-generated chapters, sections, learning objectives, quizzes, and exams aligned with Bloom&apos;s Taxonomy.",
  },
  {
    question: "How does Lifetime access work?",
    answer: "Pay once and get permanent access to all premium features, including future updates. No recurring charges ever.",
  },
];

export function PricingClient({
  isLoggedIn,
  isPremium,
  currentPlan,
  showCanceled,
}: PricingClientProps) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

  useEffect(() => {
    if (showCanceled) {
      toast.info("Checkout canceled", {
        description: "You can try again when you&apos;re ready.",
      });
    }
  }, [showCanceled]);

  const handlePlanSelect = async (planId: Plan["id"]) => {
    if (planId === "FREE") {
      if (isLoggedIn) {
        router.push("/dashboard");
      } else {
        router.push("/auth/register");
      }
      return;
    }

    if (!isLoggedIn) {
      router.push(`/auth/register?redirect=/pricing&plan=${planId.toLowerCase()}`);
      return;
    }

    // Handle checkout for premium plans
    try {
      setLoadingPlan(planId as PlanType);

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

      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPlanState = (planId: Plan["id"]) => {
    if (!isPremium) return { isCurrentPlan: false, isDisabled: false };

    const isCurrentPlan = currentPlan === planId;
    const isDisabled =
      currentPlan === "LIFETIME" ||
      (currentPlan === "YEARLY" && planId === "MONTHLY") ||
      isCurrentPlan;

    return { isCurrentPlan, isDisabled };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Unlock AI-Powered Learning
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300">
              Start free and upgrade when you need more. No hidden fees, no surprises.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Premium Features Preview */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
            >
              {premiumFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={cn(
                    "p-4 rounded-xl text-center",
                    "bg-white dark:bg-slate-800",
                    "border border-slate-200 dark:border-slate-700",
                    "shadow-sm"
                  )}
                >
                  <div className="inline-flex items-center justify-center p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 mb-3">
                    <feature.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => {
              const { isCurrentPlan, isDisabled } = getPlanState(plan.id);

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={!isDisabled ? { scale: 1.02, y: -4 } : undefined}
                  className={cn(
                    "relative p-6 rounded-2xl transition-all duration-300",
                    "border-2",
                    plan.highlighted
                      ? "border-purple-500 bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800 shadow-xl shadow-purple-500/10"
                      : isCurrentPlan
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
                    isDisabled && !isCurrentPlan && "opacity-60"
                  )}
                >
                  {/* Badge */}
                  {plan.badge && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-bold">
                        CURRENT PLAN
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {plan.name}
                    </h3>
                    {plan.savings && (
                      <span className="inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full mb-2">
                        {plan.savings}
                      </span>
                    )}
                    <div className="flex items-baseline justify-center gap-1 mt-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-sm">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={isDisabled || loadingPlan !== null}
                    className={cn(
                      "w-full h-11 font-semibold rounded-xl transition-all",
                      isCurrentPlan
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : plan.highlighted
                        ? "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 text-white shadow-lg shadow-purple-500/25"
                        : plan.id === "FREE"
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
                        : "bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white"
                    )}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : isDisabled ? (
                      "Not Available"
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-5xl mx-auto p-8 md:p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-4">
                  <Building2 className="h-4 w-4" />
                  Enterprise
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Built for Scale
                </h2>
                <p className="text-slate-300 mb-6">
                  Custom solutions for organizations with advanced security, compliance, and deployment needs.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors"
                >
                  Talk to Sales
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {enterpriseFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-slate-300 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400"
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
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Join thousands of educators and learners using AI-powered course creation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                isPremium ? (
                  <Link
                    href="/teacher/create/ai-creator"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 transition-colors shadow-lg shadow-purple-500/25"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create AI Course
                  </Link>
                ) : (
                  <Button
                    onClick={() => handlePlanSelect("YEARLY")}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 transition-colors shadow-lg shadow-purple-500/25"
                  >
                    <Crown className="h-5 w-5 mr-2" />
                    Get Premium
                  </Button>
                )
              ) : (
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 transition-colors shadow-lg shadow-purple-500/25"
                >
                  Get Started Free
                </Link>
              )}
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
