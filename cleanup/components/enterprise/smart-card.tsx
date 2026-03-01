"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface SmartCardProps {
  children: ReactNode;
  variant?: 'default' | 'highlighted' | 'interactive' | 'ai-suggested';
  elevation?: 0 | 1 | 2 | 3;
  className?: string;
  title?: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'destructive';
  };
  icon?: LucideIcon;
  actions?: ReactNode;
  footer?: ReactNode;
  animated?: boolean;
}

export const SmartCard = ({
  children,
  variant = 'default',
  elevation = 1,
  className,
  title,
  subtitle,
  badge,
  icon: Icon,
  actions,
  footer,
  animated = true,
}: SmartCardProps) => {
  const variants = {
    default: 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50',
    highlighted: 'bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 border-purple-200 dark:border-purple-700/50',
    interactive: 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/50 hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer',
    'ai-suggested': 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-[1px]',
  };

  const elevations = {
    0: 'shadow-none',
    1: 'shadow-sm hover:shadow-md',
    2: 'shadow-md hover:shadow-lg',
    3: 'shadow-lg hover:shadow-xl',
  };

  const cardContent = (
    <>
      {(title || subtitle || badge || Icon || actions) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            {Icon && (
              <div className={cn(
                "p-2 rounded-lg",
                variant === 'ai-suggested'
                  ? "bg-gradient-to-r from-blue-500 to-purple-500"
                  : "bg-gradient-to-r from-purple-500 to-cyan-500"
              )}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 dark:from-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {badge && (
              <Badge variant={(badge.variant === 'warning' ? 'secondary' : badge.variant) || 'default'}>
                {badge.label}
              </Badge>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 ml-4">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {children}
      </div>

      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </>
  );

  if (variant === 'ai-suggested') {
    return (
      <div className={cn(
        "rounded-xl transition-all duration-300",
        animated && "hover:scale-[1.01]",
        elevations[elevation],
        className
      )}>
        <div className={variants[variant]}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            {cardContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border backdrop-blur-sm transition-all duration-300",
      variants[variant],
      elevations[elevation],
      animated && "hover:scale-[1.01]",
      className
    )}>
      <div className="p-6">
        {cardContent}
      </div>
    </div>
  );
};
