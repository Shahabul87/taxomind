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
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/pricing">
            <Button
              size={size}
              variant="outline"
              className={cn(
                "group/premium relative overflow-hidden",
                "bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50",
                "dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-amber-950/30",
                "border-amber-200/80 dark:border-amber-800/60",
                "text-amber-700 dark:text-amber-300",
                "hover:from-amber-100 hover:via-yellow-100 hover:to-amber-100",
                "dark:hover:from-amber-950/50 dark:hover:via-yellow-950/40 dark:hover:to-amber-950/50",
                "hover:border-amber-400 dark:hover:border-amber-600",
                "hover:shadow-[0_0_16px_-4px_rgba(245,158,11,0.4)]",
                "dark:hover:shadow-[0_0_16px_-4px_rgba(245,158,11,0.2)]",
                "transition-all duration-300",
                "shadow-sm",
                size === "sm" && "h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm",
                size === "default" && "h-10 px-4 text-sm",
                size === "lg" && "h-11 px-6 text-base",
                className
              )}
            >
              {/* Shimmer effect */}
              <span
                className={cn(
                  "absolute inset-0 -translate-x-full",
                  "bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent",
                  "group-hover/premium:translate-x-full",
                  "transition-transform duration-700 ease-in-out"
                )}
                aria-hidden="true"
              />
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-amber-500 group-hover/premium:scale-110 transition-transform duration-200" />
              <span className="hidden xs:inline">{upgradeText}</span>
              <span className="xs:hidden">
                <Lock className="h-3.5 w-3.5" />
              </span>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={8}
          className={cn(
            "w-72 p-0 rounded-xl border-0",
            "bg-white dark:bg-zinc-900",
            "shadow-xl shadow-amber-500/10 dark:shadow-amber-500/5",
            "border border-amber-200/60 dark:border-amber-800/40",
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}
        >
          <div className="p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/30">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="font-semibold text-sm text-amber-700 dark:text-amber-300">
                {featureName}
              </p>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
              Upgrade to unlock unlimited AI generation and premium features for your courses.
            </p>
            <span className="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
              View Plans
              <svg
                className="ml-1 h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
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
