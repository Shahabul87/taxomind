import { Metadata } from "next";
import { Check, Sparkles, Building2, Users, Zap } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Taxomind",
  description: "Simple, transparent pricing for individuals and teams. Start free and scale as you grow.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with online learning",
    features: [
      "Access to free courses",
      "Basic progress tracking",
      "Community forums",
      "Mobile app access",
      "Email support",
    ],
    cta: "Get Started",
    ctaLink: "/auth/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For serious learners who want to accelerate their growth",
    features: [
      "Everything in Free",
      "Unlimited course access",
      "AI-powered tutor",
      "Personalized learning paths",
      "Certificates & badges",
      "Priority support",
      "Offline downloads",
      "Advanced analytics",
    ],
    cta: "Start Free Trial",
    ctaLink: "/auth/register?plan=pro",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Team",
    price: "$49",
    period: "per user/month",
    description: "For teams that want to learn and grow together",
    features: [
      "Everything in Pro",
      "Team management dashboard",
      "Custom learning paths",
      "Progress reports",
      "Admin controls",
      "SSO integration",
      "Dedicated success manager",
      "API access",
    ],
    cta: "Contact Sales",
    ctaLink: "/contact",
    highlighted: false,
    minSeats: "5 seats minimum",
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
    answer: "Yes! Pro plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans. Enterprise customers can pay via invoice.",
  },
  {
    question: "Can I get a refund?",
    answer: "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact us for a full refund.",
  },
  {
    question: "Do you offer discounts for education?",
    answer: "Yes! Students and educators get 50% off Pro plans. Non-profits receive 25% off all plans.",
  },
  {
    question: "How does team billing work?",
    answer: "Team plans are billed per active user. You only pay for seats that are in use. Add or remove users anytime.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800 border-purple-300 dark:border-purple-700 shadow-xl shadow-purple-500/10"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-purple-600 text-white text-sm font-medium">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      /{plan.period}
                    </span>
                  </div>
                  {plan.minSeats && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {plan.minSeats}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.ctaLink}
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition-colors ${
                    plan.highlighted
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto p-8 md:p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900">
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
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {enterpriseFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-slate-300 text-sm">
                    <Check className="h-4 w-4 text-emerald-400" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
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
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Still Have Questions?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Our team is here to help you find the right plan for your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
              >
                Contact Sales
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
