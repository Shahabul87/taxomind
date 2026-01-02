"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * VisuallyHidden component for accessibility
 * Hides content visually while keeping it accessible to screen readers
 */
export function VisuallyHidden({
  children,
  className,
  ...props
}: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "[clip:rect(0,0,0,0)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * LiveRegion component for announcing dynamic content changes
 * Uses aria-live to announce updates to screen readers
 */
interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  politeness?: "polite" | "assertive" | "off";
  atomic?: boolean;
  relevant?: "additions" | "removals" | "text" | "all";
}

export function LiveRegion({
  children,
  politeness = "polite",
  atomic = true,
  relevant = "additions",
  className,
  ...props
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "[clip:rect(0,0,0,0)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * SkipLink component for keyboard navigation
 * Allows users to skip to main content
 */
interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId: string;
  children?: React.ReactNode;
}

export function SkipLink({
  targetId,
  children = "Skip to main content",
  className,
  ...props
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus:not-sr-only",
        "focus:absolute focus:z-[9999] focus:top-4 focus:left-4",
        "focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900",
        "focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-blue-500",
        "focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}
