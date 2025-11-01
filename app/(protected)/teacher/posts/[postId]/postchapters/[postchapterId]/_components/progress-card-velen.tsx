"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressCardVelenProps {
  completedFields: number;
  totalFields: number;
  completionText: string;
}

export const ProgressCardVelen = ({
  completedFields,
  totalFields,
  completionText
}: ProgressCardVelenProps) => {
  const percentage = Math.round((completedFields / totalFields) * 100);
  const isComplete = percentage === 100;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-300",
        isComplete
          ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/60 dark:border-emerald-800/60"
          : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60"
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-lg transition-colors duration-300",
              isComplete
                ? "bg-emerald-100 dark:bg-emerald-900/50"
                : "bg-violet-100 dark:bg-violet-900/50"
            )}>
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              )}
            </div>
            <div>
              <h3 className={cn(
                "text-base font-semibold",
                isComplete
                  ? "text-emerald-900 dark:text-emerald-100"
                  : "text-slate-900 dark:text-slate-100"
              )}>
                {isComplete ? "Chapter Complete!" : "Chapter Progress"}
              </h3>
              <p className={cn(
                "text-sm mt-0.5",
                isComplete
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              )}>
                {isComplete
                  ? "All required fields are filled"
                  : `Complete all fields ${completionText}`
                }
              </p>
            </div>
          </div>

          <div className={cn(
            "flex flex-col items-end gap-1 px-3 py-1.5 rounded-lg",
            isComplete
              ? "bg-emerald-100 dark:bg-emerald-900/50"
              : "bg-slate-100 dark:bg-slate-800"
          )}>
            <span className={cn(
              "text-2xl font-bold tabular-nums",
              isComplete
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-900 dark:text-slate-100"
            )}>
              {percentage}%
            </span>
            <span className={cn(
              "text-xs font-medium",
              isComplete
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400"
            )}>
              {completionText} fields
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              isComplete
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-violet-500 to-purple-500"
            )}
            style={{ width: `${percentage}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Field checklist */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {['Title', 'Description', 'Image', 'Settings'].map((field, index) => (
            <div
              key={field}
              className={cn(
                "flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-md transition-colors duration-200",
                index < completedFields
                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                  : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50"
              )}
            >
              {index < completedFields ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {field}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
