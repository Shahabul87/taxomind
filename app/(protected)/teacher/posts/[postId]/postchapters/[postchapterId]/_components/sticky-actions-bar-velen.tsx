"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StickyActionsBarVelenProps {
  left: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export const StickyActionsBarVelen = ({
  left,
  center,
  right,
  className
}: StickyActionsBarVelenProps) => {
  return (
    <div
      className={cn(
        // Positioning - full width, flush with main header
        "fixed top-16 left-0 right-0 z-40",

        // Glass-morphism effect
        "backdrop-blur-xl bg-white/80 dark:bg-slate-900/80",
        "border-b border-slate-200/60 dark:border-slate-800/60",

        // Subtle shadow
        "shadow-sm shadow-slate-900/5 dark:shadow-slate-950/20",

        className
      )}
      role="region"
      aria-label="Chapter actions command bar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left section */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {left}
          </div>

          {/* Center section - only on larger screens */}
          {center && (
            <div className="hidden xl:flex items-center justify-center flex-shrink-0">
              {center}
            </div>
          )}

          {/* Right section */}
          {right && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {right}
            </div>
          )}
        </div>
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
    </div>
  );
};
