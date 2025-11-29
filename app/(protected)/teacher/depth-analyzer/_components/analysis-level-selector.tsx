"use client";

import { motion } from "framer-motion";
import { BookOpen, Layers, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type AnalysisLevel = "course" | "chapter" | "section";

interface AnalysisLevelSelectorProps {
  value: AnalysisLevel;
  onChange: (level: AnalysisLevel) => void;
}

const levels = [
  {
    value: "course" as const,
    label: "Course",
    icon: BookOpen,
    description: "Analyze entire course",
    color: "purple",
  },
  {
    value: "chapter" as const,
    label: "Chapter",
    icon: Layers,
    description: "Analyze single chapter",
    color: "indigo",
  },
  {
    value: "section" as const,
    label: "Section",
    icon: FileText,
    description: "Analyze single section",
    color: "blue",
  },
];

export function AnalysisLevelSelector({
  value,
  onChange,
}: AnalysisLevelSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl backdrop-blur-sm">
      {levels.map((level) => {
        const isSelected = value === level.value;
        const Icon = level.icon;

        return (
          <motion.button
            key={level.value}
            onClick={() => onChange(level.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300",
              isSelected
                ? "text-white shadow-lg"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
            )}
          >
            {/* Selected background */}
            {isSelected && (
              <motion.div
                layoutId="selectedLevel"
                className={cn(
                  "absolute inset-0 rounded-lg",
                  level.color === "purple" &&
                    "bg-gradient-to-r from-purple-500 to-purple-600",
                  level.color === "indigo" &&
                    "bg-gradient-to-r from-indigo-500 to-indigo-600",
                  level.color === "blue" &&
                    "bg-gradient-to-r from-blue-500 to-blue-600"
                )}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            {/* Content */}
            <div className="relative flex items-center gap-2">
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isSelected
                    ? "text-white"
                    : level.color === "purple"
                    ? "text-purple-500"
                    : level.color === "indigo"
                    ? "text-indigo-500"
                    : "text-blue-500"
                )}
              />
              <div className="text-left">
                <span className="font-semibold text-sm sm:text-base">
                  {level.label}
                </span>
                <span className="hidden lg:block text-xs opacity-80">
                  {level.description}
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
