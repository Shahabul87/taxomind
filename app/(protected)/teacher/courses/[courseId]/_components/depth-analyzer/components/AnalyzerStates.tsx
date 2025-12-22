"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Brain,
  Target,
  Layers,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  BarChart3,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Award,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";

// ============================================
// Loading State Component - Enhanced
// ============================================

const loadingSteps = [
  { label: "Analyzing content structure", icon: Layers },
  { label: "Evaluating cognitive levels", icon: Brain },
  { label: "Checking learning objectives", icon: Target },
  { label: "Generating insights", icon: Lightbulb },
];

export function AnalyzerLoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20"
    >
      {/* Main loader container */}
      <div className="relative mb-8">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-full blur-3xl scale-150" />

        {/* Multi-ring loader */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-200/50 dark:border-slate-700/50" />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 border-r-violet-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle ring */}
          <div className="absolute inset-4 rounded-full border-[3px] border-slate-200/40 dark:border-slate-700/40" />
          <motion.div
            className="absolute inset-4 rounded-full border-[3px] border-transparent border-t-indigo-500 border-l-indigo-400"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner ring */}
          <div className="absolute inset-8 rounded-full border-2 border-slate-200/30 dark:border-slate-700/30" />
          <motion.div
            className="absolute inset-8 rounded-full border-2 border-transparent border-t-cyan-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="p-4 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-xl backdrop-blur-sm border border-violet-200/30 dark:border-violet-700/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Brain className="h-10 w-10 sm:h-12 sm:w-12 text-violet-600 dark:text-violet-400" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-4 max-w-md px-4">
        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
          Analyzing Course Depth
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Our AI is examining your content for cognitive depth, learning objectives alignment, and educational quality
        </p>

        {/* Loading steps */}
        <div className="grid grid-cols-2 gap-2 pt-4">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.3 }}
              >
                <step.icon className="h-4 w-4 text-violet-500" />
              </motion.div>
              <span className="text-xs text-slate-600 dark:text-slate-400">{step.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="pt-4">
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 30, ease: "linear" }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">This usually takes 30-60 seconds...</p>
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
// Empty State Component - Enterprise Enhanced
// ============================================

interface AnalyzerEmptyStateProps {
  onAnalyze: () => void;
}

// Preview data for the empty state
const previewFeatures = [
  {
    icon: Brain,
    title: "Cognitive Analysis",
    description: "Evaluate Bloom&apos;s Taxonomy levels across your content",
    color: "violet",
  },
  {
    icon: Target,
    title: "Learning Objectives",
    description: "Verify alignment with educational standards",
    color: "blue",
  },
  {
    icon: BarChart3,
    title: "Content Balance",
    description: "Analyze distribution of cognitive levels",
    color: "emerald",
  },
];

const standards = [
  { name: "Bloom&apos;s Taxonomy", icon: Layers },
  { name: "Webb&apos;s DOK", icon: TrendingUp },
  { name: "Quality Matters", icon: Shield },
  { name: "OLC Scorecard", icon: Award },
];

export function AnalyzerEmptyState({ onAnalyze }: AnalyzerEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center px-4 max-w-2xl mx-auto mb-10">
          {/* Animated Icon */}
          <motion.div
            className="relative inline-block mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-indigo-500/20 rounded-3xl blur-2xl scale-125" />
            <div className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/90 to-violet-50/90 dark:from-slate-800/90 dark:to-violet-900/30 border border-violet-200/50 dark:border-violet-800/50 shadow-2xl shadow-violet-500/10">
              {/* Decorative rings */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-28 h-28 sm:w-32 sm:h-32 border-2 border-dashed border-violet-200/50 dark:border-violet-700/50 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="relative">
                <Brain className="h-14 w-14 sm:h-18 sm:w-18 text-violet-500 dark:text-violet-400 mx-auto" />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 dark:from-violet-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Ready to Analyze
          </motion.h3>

          {/* Description */}
          <motion.p
            className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Discover the cognitive depth and quality of your course content with our AI-powered analysis engine.
          </motion.p>

          {/* Feature Pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {previewFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow"
              >
                <feature.icon className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature.title}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={onAnalyze}
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-500 h-14 px-10 text-base font-semibold group"
            >
              <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              Start Analysis
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
              Analysis takes about 30-60 seconds depending on course size
            </p>
          </motion.div>
        </div>

        {/* Standards Section */}
        <motion.div
          className="max-w-4xl mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Powered by Industry Standards
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {standards.map((standard, index) => (
              <motion.div
                key={standard.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
              >
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
                  <standard.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 text-center">
                  {standard.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* What You&apos;ll Get Section */}
        <motion.div
          className="max-w-4xl mx-auto px-4 mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6 bg-gradient-to-br from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-900/80 border-slate-200/50 dark:border-slate-700/50">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-violet-500" />
              What You&apos;ll Discover
            </h4>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  title: "Cognitive Depth Score",
                  desc: "Overall rating of your course&apos;s intellectual rigor",
                  icon: BarChart3,
                },
                {
                  title: "Chapter Breakdown",
                  desc: "Detailed analysis of each chapter&apos;s cognitive levels",
                  icon: BookOpen,
                },
                {
                  title: "Actionable Recommendations",
                  desc: "Specific suggestions to improve course quality",
                  icon: Lightbulb,
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex-shrink-0 p-2 h-fit rounded-lg bg-violet-100 dark:bg-violet-900/40">
                    <item.icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
