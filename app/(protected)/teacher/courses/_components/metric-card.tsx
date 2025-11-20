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
        "group relative overflow-hidden border-0 shadow-lg rounded-lg",
        `bg-gradient-to-br ${iconBgColor}`,
        "p-5"
      )}>
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-8 h-8 rounded-lg bg-white/20" />
            <Skeleton className="h-4 w-24 bg-white/20" />
          </div>
          <Skeleton className="h-8 w-20 bg-white/20" />
          <Skeleton className="h-3 w-32 mt-2 bg-white/20" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
      `bg-gradient-to-br ${iconBgColor}`,
      "h-full"
    )}>
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative p-3 sm:p-4 md:p-5">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg flex-shrink-0">
            <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", iconColor)} />
          </div>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium text-white/90 truncate">{title}</span>
        </div>
        <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{value}</div>

        {/* Trend or Subtitle */}
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
            <TrendIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/80 flex-shrink-0" />
            <span className="text-[9px] sm:text-xs font-medium text-white/80">
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
        {subtitle && !change && (
          <div className="text-[9px] sm:text-xs text-white/80 mt-1.5 sm:mt-2">
            {subtitle}
          </div>
        )}
      </div>
    </Card>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 p-5">
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-8 h-8 rounded-lg bg-white/20" />
          <Skeleton className="h-4 w-24 bg-white/20" />
        </div>
        <Skeleton className="h-8 w-20 bg-white/20" />
        <Skeleton className="h-3 w-32 mt-2 bg-white/20" />
      </div>
    </Card>
  );
};
