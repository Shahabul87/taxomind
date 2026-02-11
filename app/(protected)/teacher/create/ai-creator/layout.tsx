/**
 * AI Creator Layout
 *
 * Server-side subscription check to prevent unauthorized direct URL access.
 * Only premium users can access the AI Course Creator.
 */

import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { withSubscriptionGate } from "@/lib/ai/subscription-gate";

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

  // Check if user can access AI course creation (requires STARTER+ subscription)
  const gateResult = await withSubscriptionGate(user.id, { category: "generation" });
  if (!gateResult.allowed) {
    redirect("/teacher/create?upgrade=ai-creator");
  }

  return <>{children}</>;
}
