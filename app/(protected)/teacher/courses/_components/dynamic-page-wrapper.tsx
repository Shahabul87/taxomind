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
      "bg-gradient-to-b from-gray-50 to-white",
      "dark:from-gray-900 dark:via-gray-900 dark:to-gray-950"
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
