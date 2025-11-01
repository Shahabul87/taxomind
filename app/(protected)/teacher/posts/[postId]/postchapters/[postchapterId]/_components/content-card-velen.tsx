"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ContentCardVelenProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  hover?: boolean;
}

export const ContentCardVelen = ({
  className,
  hover = true,
  ...props
}: ContentCardVelenProps) => {
  return (
    <div
      className={cn(
        // Base surface with subtle gradient
        "relative overflow-hidden",
        "bg-white dark:bg-slate-900",
        "rounded-xl border border-slate-200/60 dark:border-slate-800/60",

        // Elevation with refined shadows
        "shadow-sm shadow-slate-900/5 dark:shadow-slate-950/20",

        // Interactive states
        hover && [
          "transition-all duration-300 ease-out",
          "hover:shadow-md hover:shadow-slate-900/10 dark:hover:shadow-slate-950/30",
          "hover:border-slate-300/60 dark:hover:border-slate-700/60",
          "hover:-translate-y-0.5",
        ],

        // Default padding
        "p-6",

        className
      )}
      {...props}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {props.children}
      </div>
    </div>
  );
};
