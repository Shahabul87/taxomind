/**
 * Utility functions for Course Depth Analyzer
 */

import { cn } from "@/lib/utils";

/**
 * Get color class based on score value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

/**
 * Get severity color class for gaps
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "high":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "low":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "";
  }
}

/**
 * Get match color class for course type matching
 */
export function getMatchColor(score?: number): string {
  if (!score && score !== 0) return "text-gray-600 dark:text-gray-400";
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

/**
 * Get progress bar color class based on score
 */
export function getProgressColor(score: number): string {
  if (score >= 80) return "bg-gradient-to-r from-emerald-500 to-green-400";
  if (score >= 60) return "bg-gradient-to-r from-amber-500 to-yellow-400";
  return "bg-gradient-to-r from-rose-500 to-red-400";
}

/**
 * Get quality level badge color
 */
export function getQualityLevelColor(level: string): string {
  switch (level) {
    case "Exemplary":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "Accomplished":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "Promising":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    default:
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }
}

/**
 * Get color variant class for metric cards
 */
export function getMetricColorClasses(color: "cyan" | "emerald" | "amber" | "blue" | "violet"): {
  card: string;
  icon: string;
  iconBg: string;
  accent: string;
} {
  const colorMap = {
    cyan: {
      card: "bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-200/50 dark:border-cyan-800/50 hover:border-cyan-300 dark:hover:border-cyan-700",
      icon: "text-cyan-600 dark:text-cyan-400",
      iconBg: "bg-cyan-500/20",
      accent: "bg-gradient-to-bl from-cyan-500/20 to-transparent",
    },
    emerald: {
      card: "bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-200/50 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700",
      icon: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/20",
      accent: "bg-gradient-to-bl from-emerald-500/20 to-transparent",
    },
    amber: {
      card: "bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-200/50 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700",
      icon: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/20",
      accent: "bg-gradient-to-bl from-amber-500/20 to-transparent",
    },
    blue: {
      card: "bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700",
      icon: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/20",
      accent: "bg-gradient-to-bl from-blue-500/15 to-transparent",
    },
    violet: {
      card: "bg-gradient-to-br from-violet-50/80 to-purple-50/50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200/50 dark:border-violet-800/50 hover:border-violet-300 dark:hover:border-violet-700",
      icon: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-500/20",
      accent: "bg-gradient-to-bl from-violet-500/15 to-transparent",
    },
  };

  return colorMap[color];
}

/**
 * DOK level labels mapping
 */
export const DOK_LABELS: Record<string, string> = {
  level1: "Recall",
  level2: "Skill/Concept",
  level3: "Strategic Thinking",
  level4: "Extended Thinking",
};

/**
 * SMART criteria labels
 */
export const SMART_CRITERIA = ["Specific", "Measurable", "Achievable", "Relevant", "Time-bound"] as const;

/**
 * Format score with appropriate label
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent quality";
  if (score >= 60) return "Good progress";
  return "Needs improvement";
}
