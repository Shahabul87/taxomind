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
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Creator Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {/* Classic Creator */}
          <div className={cn(
            "group relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 cursor-pointer transition-all duration-200",
            "bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/10 dark:to-indigo-900/10",
            "border border-blue-200/60 dark:border-blue-700/30",
            "hover:border-blue-300 dark:hover:border-blue-600",
            "hover:shadow-xl hover:shadow-blue-500/15",
            "hover:scale-[1.01] active:scale-[0.99]"
          )}
          onClick={onSelectClassic}>
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-blue-100/80 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40 transition-colors flex-shrink-0">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-blue-100/60 dark:bg-blue-900/40 text-[10px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 flex-shrink-0">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>Flexible</span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                Manual Creator
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 sm:mb-4 leading-relaxed">
                Full control over every aspect. Perfect for experienced educators.
              </p>

              {/* Features */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <span>Custom structure design</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <span>Complete creative control</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <span>Step-by-step guidance</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Creator */}
          <div className={cn(
            "group relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6 cursor-pointer transition-all duration-200",
            "bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/10 dark:to-indigo-900/10",
            "border border-purple-200/60 dark:border-purple-700/30",
            "hover:border-purple-300 dark:hover:border-purple-600",
            "hover:shadow-xl hover:shadow-purple-500/15",
            "hover:scale-[1.01] active:scale-[0.99]"
          )}
          onClick={onSelectAI}>
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl bg-purple-100/80 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 transition-colors flex-shrink-0">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-purple-100/60 dark:bg-purple-900/40 text-[10px] sm:text-xs font-medium text-purple-700 dark:text-purple-300 flex-shrink-0">
                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>AI-Powered</span>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                AI Creator (Sam)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 sm:mb-4 leading-relaxed">
                AI generates complete course structure automatically.
              </p>

              {/* Features */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                  <span>Auto-generated structure</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                  <span>Bloom&apos;s taxonomy aligned</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                  <span>Smart recommendations</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Quick comparison */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/30">
          <p className="text-[10px] sm:text-xs text-center text-slate-600 dark:text-slate-400">
            Both methods allow full customization after creation
          </p>
        </div>
      </div>
    </div>
  );
};