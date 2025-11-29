"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundProps {
  variant?: 'default' | 'gradient' | 'mesh' | 'particles';
  className?: string;
}

export function AnimatedBackground({ variant = 'default', className }: AnimatedBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20" />

      {/* Animated gradient orbs */}
      <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-300/30 dark:bg-purple-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-indigo-300/30 dark:bg-indigo-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-300/30 dark:bg-pink-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-cyan-300/20 dark:bg-cyan-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-60 animate-blob animation-delay-3000" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.4) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(99, 102, 241, 0.4) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Radial highlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-indigo-500/5 via-transparent to-transparent dark:from-indigo-400/5" />
    </div>
  );
}

// Floating particles component for extra visual flair
export function FloatingParticles({ count = 20 }: { count?: number }) {
  return (
    <div className="fixed inset-0 -z-5 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-indigo-400/40 dark:bg-indigo-300/30 rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  );
}

// Premium card wrapper with glass effect
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle' | 'gradient';
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  hoverEffect = true
}: GlassCardProps) {
  const variants = {
    default: cn(
      "bg-white/70 dark:bg-slate-900/70",
      "border border-white/50 dark:border-slate-700/50",
      "shadow-xl shadow-slate-200/50 dark:shadow-black/20"
    ),
    elevated: cn(
      "bg-white/80 dark:bg-slate-900/80",
      "border border-white/60 dark:border-slate-700/60",
      "shadow-2xl shadow-slate-200/60 dark:shadow-black/30"
    ),
    subtle: cn(
      "bg-white/50 dark:bg-slate-900/50",
      "border border-slate-200/30 dark:border-slate-700/30",
      "shadow-lg shadow-slate-200/30 dark:shadow-black/10"
    ),
    gradient: cn(
      "bg-gradient-to-br from-white/80 via-white/60 to-indigo-50/40",
      "dark:from-slate-900/80 dark:via-slate-900/60 dark:to-indigo-950/40",
      "border border-white/50 dark:border-slate-700/50",
      "shadow-xl shadow-indigo-200/30 dark:shadow-indigo-900/20"
    )
  };

  return (
    <div
      className={cn(
        "backdrop-blur-xl rounded-2xl transition-all duration-300",
        variants[variant],
        hoverEffect && "hover:shadow-2xl hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  );
}

// Animated icon wrapper
interface AnimatedIconProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'pulse' | 'bounce' | 'glow' | 'none';
  color?: 'indigo' | 'purple' | 'emerald' | 'amber' | 'rose';
}

export function AnimatedIcon({
  children,
  className,
  variant = 'glow',
  color = 'indigo'
}: AnimatedIconProps) {
  const colorClasses = {
    indigo: "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40",
    purple: "bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/40",
    emerald: "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/40",
    amber: "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/40",
    rose: "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/40"
  };

  const animations = {
    pulse: "animate-pulse",
    bounce: "animate-bounce",
    glow: "",
    none: ""
  };

  return (
    <div
      className={cn(
        "relative p-3 rounded-xl text-white shadow-lg",
        colorClasses[color],
        animations[variant],
        variant === 'glow' && "before:absolute before:inset-0 before:rounded-xl before:bg-inherit before:blur-md before:opacity-50 before:-z-10",
        className
      )}
    >
      {children}
    </div>
  );
}

// Progress ring component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progress-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

// Shimmer effect component
export function ShimmerEffect({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 -translate-x-full animate-shimmer",
        "bg-gradient-to-r from-transparent via-white/20 to-transparent",
        className
      )}
    />
  );
}
