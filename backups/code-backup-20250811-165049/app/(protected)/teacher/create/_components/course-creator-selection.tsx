"use client";

import React from "react";
import { Bot, BookOpen, Sparkles, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseCreatorSelectionProps {
  onSelectClassic: () => void;
  onSelectAI: () => void;
  onBack: () => void;
}

export const CourseCreatorSelection = ({
  onSelectClassic,
  onSelectAI,
  onBack
}: CourseCreatorSelectionProps) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Creator Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Classic Creator */}
          <div className={cn(
            "group relative overflow-hidden rounded-xl sm:rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-200",
            "bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/10 dark:to-indigo-900/10",
            "border border-blue-200/60 dark:border-blue-700/30",
            "hover:border-blue-300 dark:hover:border-blue-600",
            "hover:shadow-xl hover:shadow-blue-500/15",
            "hover:scale-[1.01] active:scale-[0.99]"
          )}
          onClick={onSelectClassic}>
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 sm:p-3 rounded-xl bg-blue-100/80 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors">
                  <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100/60 dark:bg-blue-900/40 text-xs font-medium text-blue-700 dark:text-blue-300">
                  <Clock className="h-3 w-3" />
                  <span>Flexible</span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                Manual Creator
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                Full control over every aspect. Perfect for experienced educators.
              </p>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Custom structure design
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Complete creative control
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Step-by-step guidance
                </div>
              </div>
            </div>
          </div>

          {/* AI Creator */}
          <div className={cn(
            "group relative overflow-hidden rounded-xl sm:rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-200",
            "bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/10 dark:to-indigo-900/10",
            "border border-purple-200/60 dark:border-purple-700/30",
            "hover:border-purple-300 dark:hover:border-purple-600",
            "hover:shadow-xl hover:shadow-purple-500/15",
            "hover:scale-[1.01] active:scale-[0.99]"
          )}
          onClick={onSelectAI}>
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 sm:p-3 rounded-xl bg-purple-100/80 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors">
                  <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100/60 dark:bg-purple-900/40 text-xs font-medium text-purple-700 dark:text-purple-300">
                  <Sparkles className="h-3 w-3" />
                  <span>AI-Powered</span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                AI Creator (Sam)
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                AI generates complete course structure automatically.
              </p>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  Auto-generated structure
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  Bloom&apos;s taxonomy aligned
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  Smart recommendations
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Quick comparison */}
        <div className="mt-6 p-4 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30">
          <p className="text-xs text-center text-slate-600 dark:text-slate-400">
            Both methods allow full customization after creation
          </p>
        </div>
      </div>
    </div>
  );
};