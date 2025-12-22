"use client";

import { LucideIcon, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type MetricVariant = "primary" | "coral" | "teal" | "success";

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "stable";
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  isLoading?: boolean;
  delay?: number;
  variant?: MetricVariant;
  index?: number;
}

const variantStyles: Record<
  MetricVariant,
  { gradient: string; shadowClass: string }
> = {
  primary: {
    gradient:
      "from-[hsl(243,75%,58%)] via-[hsl(260,70%,55%)] to-[hsl(280,70%,55%)]",
    shadowClass: "shadow-[0_10px_40px_-10px_hsl(243,75%,58%,0.4)]",
  },
  coral: {
    gradient:
      "from-[hsl(12,76%,61%)] via-[hsl(20,80%,58%)] to-[hsl(35,85%,55%)]",
    shadowClass: "shadow-[0_10px_40px_-10px_hsl(12,76%,61%,0.4)]",
  },
  teal: {
    gradient:
      "from-[hsl(173,80%,40%)] via-[hsl(180,75%,42%)] to-[hsl(195,75%,45%)]",
    shadowClass: "shadow-[0_10px_40px_-10px_hsl(173,80%,40%,0.4)]",
  },
  success: {
    gradient:
      "from-[hsl(152,76%,40%)] via-[hsl(158,72%,42%)] to-[hsl(165,70%,45%)]",
    shadowClass: "shadow-[0_10px_40px_-10px_hsl(152,76%,40%,0.4)]",
  },
};

// Map old iconBgColor to new variant
const mapIconBgToVariant = (iconBgColor?: string): MetricVariant => {
  if (!iconBgColor) return "primary";
  if (iconBgColor.includes("emerald") || iconBgColor.includes("green"))
    return "success";
  if (iconBgColor.includes("violet") || iconBgColor.includes("purple"))
    return "primary";
  if (iconBgColor.includes("orange") || iconBgColor.includes("amber"))
    return "coral";
  if (iconBgColor.includes("blue") || iconBgColor.includes("cyan"))
    return "teal";
  return "primary";
};

export const MetricCard = ({
  title,
  value,
  change,
  trend = "stable",
  icon: Icon,
  iconColor = "text-white",
  iconBgColor,
  subtitle,
  isLoading = false,
  delay = 0,
  variant,
  index = 0,
}: MetricCardProps) => {
  // Use variant if provided, otherwise map from iconBgColor
  const effectiveVariant = variant ?? mapIconBgToVariant(iconBgColor);
  const styles = variantStyles[effectiveVariant];

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return TrendingUp;
      case "down":
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const TrendIcon = getTrendIcon();

  if (isLoading) {
    return <MetricCardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: (delay || index * 0.1) / 1000,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group h-full"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-4 sm:p-5 lg:p-6",
          "bg-gradient-to-br",
          styles.gradient,
          styles.shadowClass,
          "transition-all duration-300",
          "hover:shadow-2xl",
          "min-h-[130px] sm:min-h-[150px] h-full"
        )}
      >
        {/* Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-black/10 blur-xl pointer-events-none" />

        {/* Shimmer Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

        {/* Geometric Pattern */}
        <svg
          className="absolute right-0 bottom-0 w-24 h-24 text-white/5 pointer-events-none"
          viewBox="0 0 100 100"
        >
          <circle cx="80" cy="80" r="60" fill="currentColor" />
          <circle cx="80" cy="80" r="40" fill="currentColor" opacity="0.5" />
        </svg>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Top Row: Icon + Trend */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>

            {change !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold",
                  "bg-white/20 backdrop-blur-sm text-white"
                )}
              >
                <TrendIcon className="w-3 h-3" />
                <span>
                  {change > 0 ? "+" : ""}
                  {change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="flex-1">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-none">
              {value}
            </p>
          </div>

          {/* Bottom Row: Title + Subtitle */}
          <div className="mt-2 sm:mt-3">
            <h3 className="text-xs sm:text-sm font-semibold text-white/90 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-white/70 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
};

// Premium Skeleton loading state
export const MetricCardSkeleton = () => (
  <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 lg:p-6 min-h-[130px] sm:min-h-[150px] bg-[hsl(var(--teacher-surface))] border border-[hsl(var(--teacher-border-subtle))]">
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl teacher-shimmer" />
        <div className="w-12 h-5 rounded-full teacher-shimmer" />
      </div>
      <div className="w-20 sm:w-24 h-8 sm:h-10 rounded-lg teacher-shimmer" />
      <div className="space-y-1.5">
        <div className="w-16 sm:w-20 h-3 sm:h-4 rounded teacher-shimmer" />
        <div className="w-24 sm:w-28 h-2.5 sm:h-3 rounded teacher-shimmer" />
      </div>
    </div>
  </div>
);
