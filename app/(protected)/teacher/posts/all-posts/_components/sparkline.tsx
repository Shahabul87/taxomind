"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fillOpacity?: number;
  showDots?: boolean;
  animate?: boolean;
  className?: string;
}

export const Sparkline = ({
  data,
  width = 80,
  height = 32,
  strokeWidth = 2,
  color = "#8b5cf6",
  fillOpacity = 0.15,
  showDots = false,
  animate = true,
  className,
}: SparklineProps) => {
  const { path, fillPath, points } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: "", fillPath: "", points: [] };
    }

    const padding = 4;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const normalizedData = data.map((value) => (value - min) / range);

    const stepX = effectiveWidth / (data.length - 1);

    const pts = normalizedData.map((value, index) => ({
      x: padding + index * stepX,
      y: padding + effectiveHeight - value * effectiveHeight,
    }));

    // Create smooth curve using cubic bezier
    let linePath = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];

      // Control points for smooth curve
      const cp1x = p0.x + (p1.x - p0.x) / 3;
      const cp1y = p0.y;
      const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cp2y = p1.y;

      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    // Create fill path (area under the line)
    const fillP = `${linePath} L ${pts[pts.length - 1].x} ${height - padding} L ${pts[0].x} ${height - padding} Z`;

    return { path: linePath, fillPath: fillP, points: pts };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ width, height }}>
        <span className="text-xs text-slate-400">No data</span>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <motion.path
        d={fillPath}
        fill={`url(#gradient-${color.replace("#", "")})`}
        initial={animate ? { opacity: 0 } : undefined}
        animate={animate ? { opacity: 1 } : undefined}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Line */}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
        animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      {/* End dot */}
      {showDots && points.length > 0 && (
        <motion.circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={color}
          initial={animate ? { scale: 0, opacity: 0 } : undefined}
          animate={animate ? { scale: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.3, delay: 1 }}
        />
      )}
    </svg>
  );
};

// Trend indicator component
interface TrendIndicatorProps {
  value: number;
  suffix?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const TrendIndicator = ({
  value,
  suffix = "%",
  showIcon = true,
  size = "sm",
  className,
}: TrendIndicatorProps) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-2.5 py-1.5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        sizeClasses[size],
        isNeutral
          ? "text-slate-500 bg-slate-100/80 dark:bg-slate-700/50"
          : isPositive
          ? "text-emerald-600 bg-emerald-100/80 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "text-rose-600 bg-rose-100/80 dark:bg-rose-900/30 dark:text-rose-400",
        className
      )}
    >
      {showIcon && (
        <svg
          className={cn("w-3 h-3", isNeutral && "hidden")}
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d={isPositive ? "M6 2L10 6H7V10H5V6H2L6 2Z" : "M6 10L2 6H5V2H7V6H10L6 10Z"}
            fill="currentColor"
          />
        </svg>
      )}
      <span>
        {isPositive ? "+" : ""}
        {value.toFixed(1)}
        {suffix}
      </span>
    </motion.div>
  );
};

// Mini bar chart for quick comparisons
interface MiniBarChartProps {
  data: { label: string; value: number; color?: string }[];
  width?: number;
  height?: number;
  className?: string;
}

export const MiniBarChart = ({
  data,
  width = 120,
  height = 40,
  className,
}: MiniBarChartProps) => {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("flex items-end gap-1", className)} style={{ width, height }}>
      {data.map((item, index) => {
        const barHeight = (item.value / max) * height;
        return (
          <motion.div
            key={item.label}
            className="flex-1 rounded-t-sm"
            style={{
              backgroundColor: item.color || "#8b5cf6",
              minWidth: 6,
            }}
            initial={{ height: 0 }}
            animate={{ height: barHeight }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            title={`${item.label}: ${item.value}`}
          />
        );
      })}
    </div>
  );
};

// Progress ring for circular metrics
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ProgressRing = ({
  progress,
  size = 48,
  strokeWidth = 4,
  color = "#8b5cf6",
  backgroundColor = "#e2e8f0",
  className,
  children,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          className="dark:opacity-30"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};
