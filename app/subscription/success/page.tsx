/**
 * Subscription Success Page
 *
 * Shown after successful Stripe checkout.
 * Verifies the session and activates premium if valid.
 */

import { redirect } from "next/navigation";
import { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { SuccessPageClient } from "./_components/success-client";

export const metadata: Metadata = {
  title: "Subscription Activated | Taxomind",
  description: "Your premium subscription has been activated",
};

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const user = await currentUser();
  const params = await searchParams;

  if (!user?.id) {
    redirect("/auth/login?callbackUrl=/settings/subscription");
  }

  if (!params.session_id) {
    redirect("/settings/subscription");
  }

  return <SuccessPageClient sessionId={params.session_id} userId={user.id} />;
}
