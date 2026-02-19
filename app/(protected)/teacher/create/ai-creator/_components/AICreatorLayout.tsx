"use client";

import type { ReactNode } from "react";

interface AICreatorLayoutProps {
  children: ReactNode;
}

export function AICreatorLayout({ children }: AICreatorLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <main>{children}</main>
    </div>
  );
}
