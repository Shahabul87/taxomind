/**
 * Subscription Page
 *
 * Allows users to view their current subscription status and upgrade/downgrade plans.
 * Integrates with Stripe for payment processing.
 */

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkPremiumAccess } from "@/lib/premium/check-premium";
import { SubscriptionPageClient } from "./_components/subscription-client";

export const metadata: Metadata = {
  title: "Subscription | Taxomind",
  description: "Manage your subscription and unlock premium features",
};

interface SubscriptionPageProps {
  searchParams: Promise<{ plan?: string; success?: string; canceled?: string }>;
}

export default async function SubscriptionPage({ searchParams }: SubscriptionPageProps) {
  const user = await currentUser();
  const params = await searchParams;

  if (!user?.id) {
    redirect("/auth/login?callbackUrl=/settings/subscription");
  }

  // Fetch user subscription data
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      isPremium: true,
      premiumPlan: true,
      premiumExpiresAt: true,
    },
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  // Get premium status
  const premiumStatus = await checkPremiumAccess(user.id);

  // Build subscription data for client component
  const subscriptionData = {
    userId: dbUser.id,
    userName: dbUser.name || "User",
    userEmail: dbUser.email || "",
    isPremium: premiumStatus.isPremium,
    plan: premiumStatus.plan,
    expiresAt: premiumStatus.expiresAt,
    daysRemaining: premiumStatus.daysRemaining,
    isExpired: premiumStatus.isExpired,
  };

  return (
    <SubscriptionPageClient
      subscription={subscriptionData}
      preSelectedPlan={params.plan}
      showSuccess={params.success === "true"}
      showCanceled={params.canceled === "1"}
    />
  );
}
