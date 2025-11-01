"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderVelenProps {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeaderVelen = ({
  title,
  subtitle,
  icon,
  className,
  action
}: SectionHeaderVelenProps) => {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 ring-1 ring-violet-500/20 dark:ring-violet-500/30">
            <div className="text-violet-600 dark:text-violet-400">
              {icon}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
};
