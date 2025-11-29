"use client";

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EnhancedButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  pulse?: boolean;
}

export function EnhancedButton({
  children,
  isLoading,
  loadingText,
  leftIcon,
  rightIcon,
  pulse,
  className,
  disabled,
  variant = "default",
  ...props
}: EnhancedButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Button
      disabled={isDisabled}
      variant={variant}
      className={cn(
        // Base styles
        "relative overflow-hidden font-semibold",
        "transition-all duration-300 ease-out",

        // Hover & focus states
        "hover:-translate-y-0.5 hover:shadow-lg",
        "focus-visible:ring-2 focus-visible:ring-offset-2",
        "active:translate-y-0 active:shadow-md",

        // Primary variant enhancements
        variant === "default" && [
          "bg-gradient-to-r from-indigo-600 to-indigo-700",
          "hover:from-indigo-500 hover:to-indigo-600",
          "focus-visible:ring-indigo-500",
          "shadow-md shadow-indigo-500/25",
        ],

        // Outline variant enhancements
        variant === "outline" && [
          "border-2 hover:border-indigo-300 dark:hover:border-indigo-600",
          "hover:bg-indigo-50 dark:hover:bg-indigo-950/30",
          "focus-visible:ring-indigo-500",
        ],

        // Ghost variant
        variant === "ghost" && [
          "hover:bg-slate-100 dark:hover:bg-slate-800",
        ],

        // Disabled state
        isDisabled && "opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-md",

        // Pulse animation
        pulse && !isDisabled && "animate-pulse",

        className
      )}
      {...props}
    >
      {/* Ripple effect overlay */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </span>

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="transition-transform group-hover:-translate-x-0.5">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="transition-transform group-hover:translate-x-0.5">{rightIcon}</span>}
          </>
        )}
      </span>
    </Button>
  );
}

// Navigation button specifically styled for step navigation
export function StepNavButton({
  direction,
  children,
  className,
  ...props
}: EnhancedButtonProps & { direction: 'back' | 'next' }) {
  return (
    <EnhancedButton
      variant={direction === 'back' ? 'outline' : 'default'}
      className={cn(
        "h-11 px-6 rounded-xl",
        direction === 'back' && "border-slate-200 dark:border-slate-700",
        direction === 'next' && [
          "bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600",
          "hover:from-indigo-500 hover:via-indigo-500 hover:to-purple-500",
        ],
        className
      )}
      {...props}
    >
      {children}
    </EnhancedButton>
  );
}

// Primary action button (e.g., Generate Course)
export function PrimaryActionButton({
  children,
  className,
  ...props
}: EnhancedButtonProps) {
  return (
    <EnhancedButton
      className={cn(
        "h-12 px-8 rounded-xl text-base",
        "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700",
        "hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600",
        "shadow-lg shadow-indigo-500/30",
        "hover:shadow-xl hover:shadow-indigo-500/40",
        className
      )}
      {...props}
    >
      {children}
    </EnhancedButton>
  );
}
