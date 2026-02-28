import { Metadata } from "next";
import { Check, Building2, Crown, Zap, Star, Infinity, Bot, Brain, Wand2, Shield, Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { checkPremiumAccess } from "@/lib/premium/check-premium";
import { PricingClient } from "./_components/pricing-client";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Pricing | Taxomind",
  description: "Simple, transparent pricing. Unlock AI-powered course creation and learning features.",
};

interface PricingPageProps {
  searchParams: Promise<{ canceled?: string }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  const user = await currentUser();

  let isPremium = false;
  let currentPlan: string | null = null;

  if (user?.id) {
    const premiumStatus = await checkPremiumAccess(user.id);
    isPremium = premiumStatus.isPremium;
    currentPlan = premiumStatus.plan;
  }

  return (
    <PricingClient
      isLoggedIn={!!user?.id}
      isPremium={isPremium}
      currentPlan={currentPlan}
      showCanceled={params.canceled === "1"}
    />
  );
}
