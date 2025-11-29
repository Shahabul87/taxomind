"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Target,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

// ============================================
// Loading State Component
// ============================================

export function AnalyzerLoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 sm:py-16"
    >
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-full blur-2xl scale-150" />

        {/* Multi-ring loader */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200/50 dark:border-slate-700/50" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin"
            style={{ animationDuration: "1.5s" }}
          />

          {/* Middle ring */}
          <div className="absolute inset-3 rounded-full border-3 border-slate-200/40 dark:border-slate-700/40" />
          <div
            className="absolute inset-3 rounded-full border-3 border-transparent border-t-indigo-500 animate-spin"
            style={{ animationDuration: "2s", animationDirection: "reverse" }}
          />

          {/* Inner ring */}
          <div className="absolute inset-6 rounded-full border-2 border-slate-200/30 dark:border-slate-700/30" />
          <div
            className="absolute inset-6 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"
            style={{ animationDuration: "1s" }}
          />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-xl backdrop-blur-sm">
              <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-violet-600 dark:text-violet-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center mt-6 space-y-2">
        <p className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
          Analyzing Course Depth
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          Our AI is examining your content for cognitive depth and learning quality
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-500"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Initial State Component
// ============================================

interface AnalyzerInitialStateProps {
  isCheckingSaved: boolean;
  hasSavedAnalysis: boolean;
  savedAnalysisDate: Date | null;
  isStale: boolean;
}

export function AnalyzerInitialState({
  isCheckingSaved,
  hasSavedAnalysis,
  savedAnalysisDate,
  isStale,
}: AnalyzerInitialStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 sm:py-16 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-full blur-2xl scale-150" />
        <div className="relative p-6 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-2xl backdrop-blur-sm border border-violet-200/30 dark:border-violet-700/30">
          <Brain className="h-12 w-12 text-violet-600 dark:text-violet-400" />
        </div>
      </div>

      {isCheckingSaved ? (
        <div className="space-y-3">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Checking for saved analysis...
          </p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-violet-500"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      ) : hasSavedAnalysis ? (
        <div className="space-y-4 max-w-md">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Saved Analysis Found
            </p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Last analyzed{" "}
            {savedAnalysisDate
              ? new Date(savedAnalysisDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "recently"}
          </p>
          {isStale && (
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">
                Course content has changed since last analysis
              </span>
            </div>
          )}
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click &quot;View Saved Results&quot; to see previous analysis or
            &quot;Run Fresh Analysis&quot; for updated insights.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-md">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            Ready to Analyze
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Click &quot;Analyze Course&quot; to evaluate the cognitive depth and
            educational quality of your course using Bloom&apos;s Taxonomy and
            research-validated frameworks.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-xs">
              Bloom&apos;s Taxonomy
            </Badge>
            <Badge variant="outline" className="text-xs">
              Webb&apos;s DOK
            </Badge>
            <Badge variant="outline" className="text-xs">
              QM Standards
            </Badge>
            <Badge variant="outline" className="text-xs">
              OLC Scorecard
            </Badge>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Empty State Component
// ============================================

interface AnalyzerEmptyStateProps {
  onAnalyze: () => void;
}

export function AnalyzerEmptyState({ onAnalyze }: AnalyzerEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative py-12 sm:py-16 md:py-20"
    >
      <div className="text-center px-4 max-w-lg mx-auto">
        {/* Animated Icon Container */}
        <div className="relative inline-block mb-6">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-3xl blur-2xl scale-150" />

          {/* Icon container */}
          <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/80 to-violet-50/80 dark:from-slate-800/80 dark:to-violet-900/30 border border-violet-200/50 dark:border-violet-800/50 shadow-2xl shadow-violet-500/10">
            {/* Decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed border-violet-200/50 dark:border-violet-700/50 rounded-full animate-spin"
                style={{ animationDuration: "20s" }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border border-violet-300/30 dark:border-violet-600/30 rounded-full" />
            </div>

            <div className="relative">
              <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-violet-500 dark:text-violet-400 mx-auto" />
            </div>
          </div>
        </div>

        {/* Text Content */}
        <h3 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 dark:from-violet-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          Ready to Analyze
        </h3>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Discover the cognitive depth and quality of your course content with
          our AI-powered analysis engine.
        </p>

        {/* Features list */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6">
          {[
            { icon: Brain, label: "Cognitive Analysis" },
            { icon: Target, label: "Learning Objectives" },
            { icon: Layers, label: "Content Balance" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-xs sm:text-sm text-slate-600 dark:text-slate-300"
            >
              <feature.icon className="h-3.5 w-3.5 text-violet-500" />
              {feature.label}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={onAnalyze}
          size="lg"
          className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-500 h-12 sm:h-14 px-8 text-sm sm:text-base font-semibold"
        >
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Start Analysis
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
        </Button>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Analysis takes about 30-60 seconds depending on course size
        </p>
      </div>
    </motion.div>
  );
}
