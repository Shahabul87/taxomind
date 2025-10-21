"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  isLoading?: boolean;
  delay?: number;
}

export const MetricCard = ({
  title,
  value,
  change,
  trend = 'stable',
  icon: Icon,
  iconColor = "text-white",
  iconBgColor = "from-indigo-500 to-purple-500",
  subtitle,
  isLoading = false,
  delay = 0,
}: MetricCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const TrendIcon = getTrendIcon();

  if (isLoading) {
    return (
      <Card className={cn(
        "bg-white/70 dark:bg-gray-900/70",
        "border border-gray-200/70 dark:border-gray-800/70",
        "rounded-xl shadow-md backdrop-blur-md",
        "p-4 sm:p-5 md:p-6"
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            <Skeleton className="h-2 sm:h-3 w-24 sm:w-32" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className={cn(
        "bg-white/70 dark:bg-gray-900/70",
        "border border-gray-200/70 dark:border-gray-800/70",
        "rounded-xl shadow-md backdrop-blur-md",
        "p-4 sm:p-5 md:p-6",
        "transition-all duration-300",
        "hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700",
        "h-full"
      )}>
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Icon */}
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={cn(
              "p-2 sm:p-2.5 md:p-3 rounded-lg flex-shrink-0",
              iconColor,
              `bg-gradient-to-br ${iconBgColor}`,
              "ring-1 ring-white/20 dark:ring-white/10",
              "shadow-lg"
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </p>
            <h3 className="text-xl sm:text-2xl md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1 truncate">
              {value}
            </h3>

            {/* Trend or Subtitle */}
            {change !== undefined && (
              <div className={cn("flex items-center gap-1 mt-0.5 sm:mt-1 flex-wrap", getTrendColor())}>
                <TrendIcon className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  vs last period
                </span>
              </div>
            )}
            {subtitle && !change && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <Card className={cn(
      "bg-white/70 dark:bg-gray-900/70",
      "border border-gray-200/70 dark:border-gray-800/70",
      "rounded-xl shadow-md backdrop-blur-md",
      "p-4 sm:p-5 md:p-6"
    )}>
      <div className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
          <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
          <Skeleton className="h-2 sm:h-3 w-24 sm:w-32" />
        </div>
      </div>
    </Card>
  );
};
