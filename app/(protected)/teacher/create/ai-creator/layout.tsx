/**
 * AI Creator Layout
 *
 * Server-side subscription check to prevent unauthorized direct URL access.
 * Only premium users can access the AI Course Creator.
 */

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { checkPremiumAccess } from "@/lib/premium/check-premium";
import { canAccessSamFeature } from "@/lib/premium/sam-access";

interface AICreatorLayoutProps {
  children: React.ReactNode;
}

export default async function AICreatorLayout({
  children,
}: AICreatorLayoutProps) {
  const user = await currentUser();

  // Check if user is authenticated
  if (!user?.id) {
    redirect("/auth/login?callbackUrl=/teacher/create/ai-creator");
  }

  // Check premium status
  const premiumStatus = await checkPremiumAccess(user.id);

  // Check if user can access AI course creation feature
  const accessResult = await canAccessSamFeature(user.id, "course-creation");

  // If not premium and feature not available, redirect to create page with upgrade message
  if (!premiumStatus.isPremium && !accessResult.allowed) {
    redirect("/teacher/create?upgrade=ai-creator");
  }

  return <>{children}</>;
}
