"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  /** Array of numeric values to display */
  data: number[];
  /** Height of the sparkline in pixels */
  height?: number;
  /** Width of each bar in pixels */
  barWidth?: number;
  /** Gap between bars in pixels */
  gap?: number;
  /** Color variant */
  variant?: "primary" | "success" | "warning" | "neutral" | "accent";
  /** Show trend indicator */
  showTrend?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const variantColors = {
  primary: {
    bar: "bg-blue-500 dark:bg-blue-400",
    barMuted: "bg-blue-200 dark:bg-blue-800",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-slate-500 dark:text-slate-400",
    },
  },
  success: {
    bar: "bg-emerald-500 dark:bg-emerald-400",
    barMuted: "bg-emerald-200 dark:bg-emerald-800",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-slate-500 dark:text-slate-400",
    },
  },
  warning: {
    bar: "bg-amber-500 dark:bg-amber-400",
    barMuted: "bg-amber-200 dark:bg-amber-800",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-slate-500 dark:text-slate-400",
    },
  },
  neutral: {
    bar: "bg-slate-500 dark:bg-slate-400",
    barMuted: "bg-slate-200 dark:bg-slate-700",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-slate-500 dark:text-slate-400",
    },
  },
  accent: {
    bar: "bg-violet-500 dark:bg-violet-400",
    barMuted: "bg-violet-200 dark:bg-violet-800",
    trend: {
      up: "text-green-600 dark:text-green-400",
      down: "text-red-600 dark:text-red-400",
      neutral: "text-slate-500 dark:text-slate-400",
    },
  },
};

/**
 * Sparkline component for displaying mini bar charts
 *
 * Shows trend data in a compact, visually appealing format
 * with optional trend indicators.
 */
export function Sparkline({
  data,
  height = 24,
  barWidth = 3,
  gap = 1,
  variant = "primary",
  showTrend = false,
  className,
}: SparklineProps) {
  const colors = variantColors[variant];

  const { normalizedData, trend, percentChange } = useMemo(() => {
    if (!data || data.length === 0) {
      return { normalizedData: [], trend: "neutral" as const, percentChange: 0 };
    }

    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const normalized = data.map((value) => ((value - min) / range) * 100);

    // Calculate trend from last 3 data points
    const recentData = data.slice(-3);
    let trendDir: "up" | "down" | "neutral" = "neutral";
    let change = 0;

    if (recentData.length >= 2) {
      const first = recentData[0];
      const last = recentData[recentData.length - 1];
      change = first > 0 ? ((last - first) / first) * 100 : 0;

      if (change > 5) trendDir = "up";
      else if (change < -5) trendDir = "down";
    }

    return {
      normalizedData: normalized,
      trend: trendDir,
      percentChange: Math.round(change),
    };
  }, [data]);

  if (normalizedData.length === 0) {
    return (
      <div
        className={cn("flex items-end", className)}
        style={{ height, gap }}
        aria-label="No data available"
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={cn("rounded-t", colors.barMuted)}
            style={{
              width: barWidth,
              height: height * 0.3,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="flex items-end"
        style={{ height, gap }}
        role="img"
        aria-label={`Sparkline chart showing ${data.length} data points`}
      >
        {normalizedData.map((value, index) => {
          const isLast = index === normalizedData.length - 1;
          const barHeight = Math.max((value / 100) * height, 2);

          return (
            <div
              key={index}
              className={cn(
                "rounded-t transition-all duration-300",
                isLast ? colors.bar : colors.barMuted
              )}
              style={{
                width: barWidth,
                height: barHeight,
              }}
            />
          );
        })}
      </div>

      {showTrend && (
        <div className={cn("flex items-center text-xs font-medium", colors.trend[trend])}>
          {trend === "up" && (
            <>
              <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span>+{percentChange}%</span>
            </>
          )}
          {trend === "down" && (
            <>
              <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>{percentChange}%</span>
            </>
          )}
          {trend === "neutral" && <span>--</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Progress sparkline - shows progress as a filled bar
 */
interface ProgressSparklineProps {
  value: number;
  max?: number;
  variant?: "primary" | "success" | "warning" | "accent";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ProgressSparkline({
  value,
  max = 100,
  variant = "primary",
  size = "md",
  showLabel = true,
  className,
}: ProgressSparklineProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const colors = {
    primary: "bg-blue-500 dark:bg-blue-400",
    success: "bg-emerald-500 dark:bg-emerald-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    accent: "bg-violet-500 dark:bg-violet-400",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden",
          sizes[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colors[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 min-w-[2.5rem] text-right">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
