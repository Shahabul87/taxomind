"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AnchorItemVelen {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface InlineAnchorNavVelenProps {
  items: AnchorItemVelen[];
  className?: string;
}

export const InlineAnchorNavVelen = ({ items, className }: InlineAnchorNavVelenProps) => {
  return (
    <nav
      aria-label="Quick section navigation"
      className={cn(
        "flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent pb-2",
        className
      )}
    >
      {items.map((item, index) => (
        <a
          key={item.href}
          href={item.href}
          className={cn(
            "group inline-flex items-center gap-2 whitespace-nowrap",
            "px-3.5 py-2 rounded-lg text-sm font-medium",
            "bg-white dark:bg-slate-900",
            "text-slate-700 dark:text-slate-300",
            "border border-slate-200/60 dark:border-slate-800/60",
            "shadow-sm shadow-slate-900/5 dark:shadow-slate-950/20",
            "hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-950/30 dark:hover:to-purple-950/30",
            "hover:text-violet-700 dark:hover:text-violet-300",
            "hover:border-violet-200/60 dark:hover:border-violet-800/60",
            "hover:shadow-md hover:shadow-violet-500/10 dark:hover:shadow-violet-500/20",
            "active:scale-95",
            "transition-all duration-200"
          )}
        >
          {item.icon && (
            <span className="transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </span>
          )}
          <span>{item.label}</span>

          {/* Visual indicator */}
          {index === 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">
              1
            </span>
          )}
        </a>
      ))}
    </nav>
  );
};
