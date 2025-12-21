"use client";

/**
 * AI Button Trigger Component
 *
 * Standardized trigger button for AI generation dialogs.
 * Supports multiple variants with consistent styling.
 */

import { forwardRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Sparkles, Loader2, Crown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TriggerVariant } from "./unified-ai-generator-types";

// ============================================================================
// Variant Styles
// ============================================================================

const variantStyles: Record<TriggerVariant, string> = {
  default: cn(
    "bg-gradient-to-r from-sky-500 to-blue-500",
    "hover:from-sky-600 hover:to-blue-600",
    "text-white font-semibold",
    "shadow-md hover:shadow-lg",
    "transition-all duration-200",
    "border-0"
  ),
  "sky-gradient": cn(
    "relative overflow-hidden group",
    "bg-gradient-to-r from-sky-500 to-blue-500",
    "hover:from-sky-600 hover:to-blue-600",
    "text-white font-semibold",
    "border-0",
    "shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-blue-500/40",
    "transition-all duration-300 ease-out",
    "hover:scale-[1.02]",
    // Shine effect
    "before:absolute before:inset-0",
    "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
    "before:translate-x-[-200%] group-hover:before:translate-x-[200%]",
    "before:transition-transform before:duration-700"
  ),
  "purple-gradient": cn(
    "relative overflow-hidden group",
    "bg-gradient-to-r from-purple-500 to-indigo-500",
    "hover:from-purple-600 hover:to-indigo-600",
    "text-white font-semibold",
    "border-0",
    "shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-indigo-500/40",
    "transition-all duration-300 ease-out",
    "hover:scale-[1.02]",
    // Shine effect
    "before:absolute before:inset-0",
    "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
    "before:translate-x-[-200%] group-hover:before:translate-x-[200%]",
    "before:transition-transform before:duration-700"
  ),
  outline: cn(
    "bg-white/80 dark:bg-slate-800/80",
    "border-slate-200 dark:border-slate-700",
    "text-slate-700 dark:text-slate-300",
    "hover:bg-slate-50 dark:hover:bg-slate-800",
    "hover:border-sky-300 dark:hover:border-sky-600",
    "hover:text-sky-600 dark:hover:text-sky-400",
    "font-semibold",
    "transition-all duration-200",
    "shadow-sm hover:shadow-md"
  ),
  ghost: cn(
    "text-sky-700 dark:text-sky-300",
    "hover:text-sky-800 dark:hover:text-sky-200",
    "hover:bg-sky-50 dark:hover:bg-sky-500/10",
    "font-semibold",
    "transition-all duration-200"
  ),
};

const sizeStyles = {
  sm: "h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm",
  default: "h-10 sm:h-11 px-4 sm:px-5 text-sm",
  lg: "h-11 sm:h-12 px-5 sm:px-6 text-base",
};

// ============================================================================
// Component Props
// ============================================================================

interface AIButtonTriggerProps extends Omit<ButtonProps, "variant" | "size"> {
  variant?: TriggerVariant;
  size?: "sm" | "default" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  buttonText?: string;
  showIcon?: boolean;
  iconPosition?: "left" | "right";
  animateIcon?: boolean;
  // Premium states
  isPremium?: boolean;
  showPremiumLock?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const AIButtonTrigger = forwardRef<HTMLButtonElement, AIButtonTriggerProps>(
  (
    {
      variant = "default",
      size = "sm",
      isLoading = false,
      loadingText = "Generating...",
      buttonText = "Generate with AI",
      showIcon = true,
      iconPosition = "left",
      animateIcon = true,
      isPremium = true,
      showPremiumLock = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    // If not premium and should show lock
    if (!isPremium && showPremiumLock) {
      return (
        <Button
          ref={ref}
          disabled
          className={cn(
            "relative overflow-hidden",
            "bg-gradient-to-r from-amber-50 to-yellow-50",
            "dark:from-amber-950/30 dark:to-yellow-950/30",
            "border-amber-200 dark:border-amber-800",
            "text-amber-700 dark:text-amber-300",
            sizeStyles[size],
            className
          )}
          {...props}
        >
          <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-amber-500" />
          <span className="hidden xs:inline">Upgrade to Premium</span>
          <span className="xs:hidden">
            <Lock className="h-3.5 w-3.5" />
          </span>
        </Button>
      );
    }

    const iconElement = isLoading ? (
      <Loader2 className={cn(
        "h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin",
        iconPosition === "left" ? "mr-1.5 sm:mr-2" : "ml-1.5 sm:ml-2"
      )} />
    ) : showIcon ? (
      <Sparkles className={cn(
        "h-3.5 w-3.5 sm:h-4 sm:w-4",
        animateIcon && "animate-pulse",
        iconPosition === "left" ? "mr-1.5 sm:mr-2" : "ml-1.5 sm:ml-2"
      )} />
    ) : null;

    const content = children || (
      <>
        {iconPosition === "left" && iconElement}
        <span className="relative z-10">
          {isLoading ? loadingText : (
            <>
              <span className="hidden xs:inline">{buttonText}</span>
              <span className="xs:hidden">AI Generate</span>
            </>
          )}
        </span>
        {iconPosition === "right" && iconElement}
      </>
    );

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          variantStyles[variant],
          sizeStyles[size],
          "w-full xs:w-auto justify-center",
          isDisabled && "opacity-50 cursor-not-allowed hover:scale-100",
          className
        )}
        {...props}
      >
        {content}
      </Button>
    );
  }
);

AIButtonTrigger.displayName = "AIButtonTrigger";

// ============================================================================
// Presets
// ============================================================================

/**
 * Default sky-blue gradient button with shine effect
 */
export function AIButtonDefault(props: AIButtonTriggerProps) {
  return <AIButtonTrigger variant="sky-gradient" {...props} />;
}

/**
 * Purple gradient button for premium features
 */
export function AIButtonPremium(props: AIButtonTriggerProps) {
  return <AIButtonTrigger variant="purple-gradient" {...props} />;
}

/**
 * Outline style button
 */
export function AIButtonOutline(props: AIButtonTriggerProps) {
  return <AIButtonTrigger variant="outline" {...props} />;
}
