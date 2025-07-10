"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  blur?: 'sm' | 'md' | 'lg';
}

export function GlassCard({ 
  children, 
  className, 
  hover = true,
  gradient = false,
  blur = 'sm'
}: GlassCardProps) {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md', 
    lg: 'backdrop-blur-lg'
  };

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={cn(
        "relative overflow-hidden rounded-xl border",
        "bg-white/70 dark:bg-slate-800/70",
        blurClasses[blur],
        "border-slate-200/50 dark:border-slate-700/50",
        "shadow-lg shadow-slate-900/5 dark:shadow-black/20",
        gradient && "bg-gradient-to-br from-white/80 to-purple-50/50 dark:from-slate-800/80 dark:to-purple-950/30",
        className
      )}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

export function GlassHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      "px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50",
      "bg-gradient-to-r from-transparent to-purple-50/30 dark:to-purple-950/20",
      className
    )}>
      {children}
    </div>
  );
}

export function GlassContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}