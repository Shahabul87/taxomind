"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DynamicPageWrapperProps {
  children: React.ReactNode;
}

export const DynamicPageWrapper = ({ children }: DynamicPageWrapperProps) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Listen to sidebar state changes
  useEffect(() => {
    const handleSidebarChange = (event: CustomEvent) => {
      setSidebarExpanded(event.detail.expanded);
    };

    window.addEventListener('sidebar-state-change', handleSidebarChange as EventListener);

    return () => {
      window.removeEventListener('sidebar-state-change', handleSidebarChange as EventListener);
    };
  }, []);

  return (
    <div className={cn(
      "min-h-screen w-full",
      "bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40",
      "dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
    )}>
      <motion.div
        className="w-full h-full py-8 lg:py-12"
        animate={{
          paddingLeft: sidebarExpanded ? "3.5rem" : "2rem",
          paddingRight: sidebarExpanded ? "3.5rem" : "2rem",
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
};
