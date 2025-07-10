"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent";
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  color = "primary", 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const colorClasses = {
    primary: "text-purple-500",
    secondary: "text-blue-500",
    accent: "text-green-500"
  };

  return (
    <div className={cn(
      "flex items-center justify-center p-4",
      className
    )}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        colorClasses[color]
      )} />
    </div>
  );
}

export function SkeletonLoader({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-slate-800/50 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-slate-800/50 rounded-lg p-4 space-y-3 animate-pulse",
      className
    )}>
      <div className="h-4 bg-slate-700/50 rounded w-3/4" />
      <div className="h-3 bg-slate-700/50 rounded w-1/2" />
      <div className="h-20 bg-slate-700/50 rounded" />
    </div>
  );
}