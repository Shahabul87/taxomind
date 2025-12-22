"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Sparkline, ProgressSparkline } from "./Sparkline";
import { InlineZero } from "./EmptyState";

interface MetricCardProps {
  /** Card title/label */
  label: string;
  /** Primary value to display */
  value: string | number;
  /** Optional unit (e.g., "h", "%", "days") */
  unit?: string;
  /** Subtitle or additional context */
  subtitle?: string;
  /** Icon component */
  icon: ReactNode;
  /** Color variant */
  variant?: "primary" | "success" | "warning" | "accent" | "neutral";
  /** Historical data for sparkline */
  trend?: number[];
  /** Show trend indicator */
  showTrend?: boolean;
  /** Progress value (0-100) for progress bar */
  progress?: number;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const variantStyles = {
  primary: {
    iconBg: "bg-blue-50 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    accentBorder: "border-l-blue-500",
  },
  success: {
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accentBorder: "border-l-emerald-500",
  },
  warning: {
    iconBg: "bg-amber-50 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    accentBorder: "border-l-amber-500",
  },
  accent: {
    iconBg: "bg-violet-50 dark:bg-violet-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
    accentBorder: "border-l-violet-500",
  },
  neutral: {
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    accentBorder: "border-l-slate-400",
  },
};

/**
 * Enterprise Metric Card
 *
 * A clean, professional metric display card with:
 * - Consistent typography hierarchy
 * - Optional sparkline trends
 * - Optional progress bars
 * - Proper empty state handling
 */
export function MetricCard({
  label,
  value,
  unit,
  subtitle,
  icon,
  variant = "primary",
  trend,
  showTrend = false,
  progress,
  className,
  onClick,
}: MetricCardProps) {
  const styles = variantStyles[variant];
  const isZero = value === 0 || value === "0" || value === "0%";
  const isClickable = !!onClick;

  // Determine sparkline variant based on card variant
  const sparklineVariant = variant === "neutral" ? "neutral" : variant;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={isClickable ? { y: -2 } : undefined}
    >
      <Card
        className={cn(
          "relative overflow-hidden bg-white dark:bg-slate-800",
          "border border-slate-200 dark:border-slate-700",
          "border-l-4",
          styles.accentBorder,
          "transition-all duration-200",
          "hover:shadow-md",
          isClickable && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        <div className="p-4 sm:p-5">
          {/* Header: Icon + Label */}
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg",
                styles.iconBg
              )}
            >
              <div className={cn("w-4 h-4", styles.iconColor)}>{icon}</div>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {label}
            </span>
          </div>

          {/* Value */}
          {isZero ? (
            <InlineZero label="No data yet" sublabel="Start learning to track" />
          ) : (
            <>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {value}
                </span>
                {unit && (
                  <span className="text-lg font-medium text-slate-500 dark:text-slate-400">
                    {unit}
                  </span>
                )}
              </div>

              {/* Subtitle */}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {subtitle}
                </p>
              )}

              {/* Sparkline Trend */}
              {trend && trend.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <Sparkline
                    data={trend}
                    variant={sparklineVariant}
                    showTrend={showTrend}
                    height={20}
                    barWidth={4}
                  />
                </div>
              )}

              {/* Progress Bar */}
              {typeof progress === "number" && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <ProgressSparkline
                    value={progress}
                    variant={variant === "neutral" ? "primary" : variant}
                    size="md"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * Compact metric for inline display
 */
interface CompactMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  variant?: "primary" | "success" | "warning" | "accent" | "neutral";
  className?: string;
}

export function CompactMetric({
  label,
  value,
  unit,
  variant = "primary",
  className,
}: CompactMetricProps) {
  const isZero = value === 0 || value === "0" || value === "0%";
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg",
        "bg-slate-50 dark:bg-slate-800/50",
        className
      )}
    >
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      {isZero ? (
        <span className="text-lg font-semibold text-slate-300 dark:text-slate-600">--</span>
      ) : (
        <span className={cn("text-lg font-semibold", styles.iconColor)}>
          {value}
          {unit && <span className="text-sm ml-0.5">{unit}</span>}
        </span>
      )}
    </div>
  );
}

/**
 * Activity stat for today&apos;s activity section
 */
interface ActivityStatProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  variant?: "primary" | "success" | "warning" | "accent";
  className?: string;
}

export function ActivityStat({
  label,
  value,
  icon,
  variant = "primary",
  className,
}: ActivityStatProps) {
  const isZero = value === 0 || value === "0" || value === "0%";
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "text-center p-4 rounded-xl",
        "bg-slate-50 dark:bg-slate-800/50",
        "border border-slate-100 dark:border-slate-700",
        className
      )}
    >
      <div
        className={cn(
          "w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center",
          styles.iconBg
        )}
      >
        <div className={cn("w-4 h-4", styles.iconColor)}>{icon}</div>
      </div>
      {isZero ? (
        <div className="text-xl font-bold text-slate-300 dark:text-slate-600">--</div>
      ) : (
        <div className="text-xl font-bold text-slate-900 dark:text-white">{value}</div>
      )}
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}
