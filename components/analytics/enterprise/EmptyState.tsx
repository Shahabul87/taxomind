"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Clock,
  Target,
  Zap,
  Award,
  Activity,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface EmptyStateProps {
  /** Icon to display */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description: string;
  /** Primary action button */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty state component for when there&apos;s no data to display
 *
 * Provides helpful guidance and CTAs to help users get started
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: "py-6 px-4",
      icon: "w-10 h-10",
      iconWrapper: "w-16 h-16",
      title: "text-base",
      description: "text-sm",
    },
    md: {
      container: "py-10 px-6",
      icon: "w-12 h-12",
      iconWrapper: "w-20 h-20",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-16 px-8",
      icon: "w-16 h-16",
      iconWrapper: "w-24 h-24",
      title: "text-xl",
      description: "text-base",
    },
  };

  const sizeConfig = sizes[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeConfig.container,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4",
            sizeConfig.iconWrapper
          )}
        >
          <div className={cn("text-slate-400 dark:text-slate-500", sizeConfig.icon)}>
            {icon}
          </div>
        </div>
      )}

      <h3
        className={cn(
          "font-semibold text-slate-800 dark:text-slate-200 mb-2",
          sizeConfig.title
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "text-slate-500 dark:text-slate-400 max-w-sm mb-6",
          sizeConfig.description
        )}
      >
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              asChild={!!action.href}
              className="gap-2"
            >
              {action.href ? (
                <a href={action.href}>
                  {action.label}
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <>
                  {action.label}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              asChild={!!secondaryAction.href}
            >
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Metric-specific empty states with contextual messaging
 */
export const metricEmptyStates = {
  time: {
    icon: <Clock className="w-full h-full" />,
    title: "No learning time yet",
    description: "Start a course to begin tracking your study time and build productive habits.",
    action: { label: "Browse Courses", href: "/search" },
  },
  engagement: {
    icon: <Activity className="w-full h-full" />,
    title: "No engagement data",
    description: "Complete lessons and interact with course materials to see your engagement metrics.",
    action: { label: "Continue Learning", href: "/dashboard" },
  },
  progress: {
    icon: <Target className="w-full h-full" />,
    title: "No progress tracked",
    description: "Enroll in a course and complete lessons to track your learning progress.",
    action: { label: "Find a Course", href: "/search" },
  },
  streak: {
    icon: <Zap className="w-full h-full" />,
    title: "Start your streak",
    description: "Learn something today to begin building your daily study streak.",
    action: { label: "Start Learning", href: "/dashboard" },
  },
  courses: {
    icon: <BookOpen className="w-full h-full" />,
    title: "No courses yet",
    description: "Explore our catalog and enroll in courses that interest you.",
    action: { label: "Explore Courses", href: "/search" },
  },
  achievements: {
    icon: <Award className="w-full h-full" />,
    title: "No achievements yet",
    description: "Complete courses and reach milestones to earn achievements and badges.",
    action: { label: "View Achievements", href: "/achievements" },
  },
  performance: {
    icon: <TrendingUp className="w-full h-full" />,
    title: "No performance data",
    description: "Complete quizzes and assessments to track your performance metrics.",
    action: { label: "Take a Quiz", href: "/dashboard" },
  },
  insights: {
    icon: <Sparkles className="w-full h-full" />,
    title: "Insights coming soon",
    description: "Continue learning to unlock personalized AI-powered insights and recommendations.",
    action: { label: "Keep Learning", href: "/dashboard" },
  },
};

/**
 * Zero value display component
 * Shows a meaningful empty state instead of just "0"
 */
interface ZeroValueProps {
  metric: keyof typeof metricEmptyStates;
  showAction?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ZeroValue({
  metric,
  showAction = false,
  size = "sm",
  className,
}: ZeroValueProps) {
  const state = metricEmptyStates[metric];

  return (
    <EmptyState
      icon={state.icon}
      title={state.title}
      description={state.description}
      action={showAction ? state.action : undefined}
      size={size}
      className={className}
    />
  );
}

/**
 * Inline zero value with minimal footprint
 */
interface InlineZeroProps {
  label: string;
  sublabel?: string;
  className?: string;
}

export function InlineZero({ label, sublabel, className }: InlineZeroProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="text-2xl font-bold text-slate-300 dark:text-slate-600">--</div>
      <div className="text-xs text-slate-400 dark:text-slate-500">{label}</div>
      {sublabel && (
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sublabel}</div>
      )}
    </div>
  );
}
