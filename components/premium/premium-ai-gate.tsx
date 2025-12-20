"use client";

/**
 * Premium AI Gate Component
 *
 * Wraps AI generation buttons and only shows them for premium users.
 * Non-premium users see an upgrade prompt button instead.
 */

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PremiumAIGateProps {
  /** The AI button/component to show for premium users */
  children: ReactNode;
  /** Whether the current user is premium */
  isPremium: boolean;
  /** Optional: Custom upgrade button text */
  upgradeText?: string;
  /** Optional: Hide completely instead of showing upgrade button */
  hideIfNotPremium?: boolean;
  /** Optional: Size variant */
  size?: "sm" | "default" | "lg";
  /** Optional: Additional class names for the upgrade button */
  className?: string;
  /** Optional: Feature name to display in tooltip */
  featureName?: string;
}

export function PremiumAIGate({
  children,
  isPremium,
  upgradeText = "Upgrade to Premium",
  hideIfNotPremium = false,
  size = "sm",
  className,
  featureName = "AI Generation",
}: PremiumAIGateProps) {
  // Premium users see the actual AI button
  if (isPremium) {
    return <>{children}</>;
  }

  // If hideIfNotPremium is true, render nothing
  if (hideIfNotPremium) {
    return null;
  }

  // Non-premium users see an upgrade prompt
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/pricing">
            <Button
              size={size}
              variant="outline"
              className={cn(
                "relative overflow-hidden",
                "bg-gradient-to-r from-amber-50 to-yellow-50",
                "dark:from-amber-950/30 dark:to-yellow-950/30",
                "border-amber-200 dark:border-amber-800",
                "text-amber-700 dark:text-amber-300",
                "hover:from-amber-100 hover:to-yellow-100",
                "dark:hover:from-amber-950/50 dark:hover:to-yellow-950/50",
                "hover:border-amber-300 dark:hover:border-amber-700",
                "transition-all duration-200",
                "shadow-sm hover:shadow-md",
                size === "sm" && "h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm",
                size === "default" && "h-10 px-4 text-sm",
                size === "lg" && "h-11 px-6 text-base",
                className
              )}
            >
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-amber-500" />
              <span className="hidden xs:inline">{upgradeText}</span>
              <span className="xs:hidden">
                <Lock className="h-3.5 w-3.5" />
              </span>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>
              <strong>{featureName}</strong> is a premium feature.
              <br />
              Upgrade to unlock unlimited AI generation.
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// NOTE: For server-side premium checks, import directly from "@/lib/premium"
// e.g., import { checkPremiumAccess, isPremiumUser } from "@/lib/premium";
// Do NOT re-export here as it would bundle Prisma into client code.
