"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  hover?: boolean;
}

export function DashboardCard({ 
  children, 
  className, 
  title,
  icon,
  hover = true
}: DashboardCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "relative overflow-hidden rounded-xl border",
        "bg-white/70 dark:bg-slate-800/70",
        "backdrop-blur-sm",
        "border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg shadow-slate-900/5 dark:shadow-black/20",
        className
      )}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {title && (
          <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-transparent to-purple-50/30 dark:to-purple-950/20">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  {icon}
                </div>
              )}
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
            </div>
          </div>
        )}
        <div className={cn(
          "text-slate-900 dark:text-white",
          "[&_h1]:text-slate-900 [&_h1]:dark:text-white",
          "[&_h2]:text-slate-900 [&_h2]:dark:text-white", 
          "[&_h3]:text-slate-900 [&_h3]:dark:text-white",
          "[&_h4]:text-slate-900 [&_h4]:dark:text-white",
          "[&_h5]:text-slate-900 [&_h5]:dark:text-white",
          "[&_p]:text-slate-700 [&_p]:dark:text-slate-300",
          "[&_span]:text-slate-700 [&_span]:dark:text-slate-300",
          "[&_.text-gray-600]:text-slate-600 [&_.text-gray-600]:dark:text-slate-400",
          "[&_.text-gray-500]:text-slate-500 [&_.text-gray-500]:dark:text-slate-500",
          "[&_.text-gray-400]:text-slate-400 [&_.text-gray-400]:dark:text-slate-400"
        )}>
          {children}
        </div>
      </div>
    </motion.div>
  );
}