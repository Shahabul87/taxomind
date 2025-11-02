"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Global navigation component with theme toggle only
 * - Top-right: Theme toggle
 */
export function GlobalNavigation() {
  return (
    <>
      {/* Right Side - Theme Toggle Only */}
      <div className="fixed top-4 right-4 z-[100]">
        <ThemeToggle />
      </div>
    </>
  );
}
