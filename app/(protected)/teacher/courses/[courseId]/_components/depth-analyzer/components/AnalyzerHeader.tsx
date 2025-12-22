"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Brain,
  CheckCircle2,
  Download,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Clock,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SamStandardsInfo, SamStandardsBadge } from "@/components/sam/sam-standards-info";
import type { AnalysisData } from "../types";

interface AnalyzerHeaderProps {
  isAnalyzing: boolean;
  analysisData: AnalysisData | null;
  isCached: boolean;
  hasSavedAnalysis: boolean;
  onLoadSaved: () => void;
  onAnalyze: (force?: boolean) => void;
  onExport: () => void;
  onAskSam: () => void;
}

export function AnalyzerHeader({
  isAnalyzing,
  analysisData,
  isCached,
  hasSavedAnalysis,
  onLoadSaved,
  onAnalyze,
  onExport,
  onAskSam,
}: AnalyzerHeaderProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 pt-6 sm:pt-4 md:pt-0">
        {/* Cached Indicator - Floating badge */}
        {isCached && analysisData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 z-10"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-900/40 px-2.5 py-1.5 rounded-full backdrop-blur-md border border-emerald-200/50 dark:border-emerald-700/50 shadow-sm cursor-help">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline font-medium">Cached Analysis</span>
                  <span className="sm:hidden font-medium">Cached</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Results loaded from saved analysis</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        )}

        {/* Title Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl blur-lg opacity-40" />
              <div className="relative p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg shadow-violet-500/20">
                <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" aria-hidden="true" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 via-violet-800 to-indigo-900 dark:from-white dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
                Course Depth Analyzer
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                AI-powered educational quality analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SamStandardsBadge />
            <SamStandardsInfo />
          </div>
        </div>

        {/* Action Buttons - Premium styling with tooltips */}
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full">
          {/* View Saved Results Button */}
          {hasSavedAnalysis && !analysisData && !isAnalyzing && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={onLoadSaved}
                  disabled={isAnalyzing}
                  className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-500 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  aria-label="View saved analysis results"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">View Saved Results</span>
                  <span className="sm:hidden">View Saved</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Load your previously saved analysis</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Run Analysis Button */}
          {!analysisData && !isAnalyzing && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => onAnalyze(false)}
                  disabled={isAnalyzing}
                  className={cn(
                    "relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-500 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
                    hasSavedAnalysis && "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 shadow-blue-500/25 hover:shadow-blue-500/30"
                  )}
                  aria-label={hasSavedAnalysis ? "Run a fresh analysis" : "Start course analysis"}
                >
                  <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {hasSavedAnalysis ? "Run Fresh Analysis" : "Analyze Course"}
                  </span>
                  <span className="sm:hidden">
                    {hasSavedAnalysis ? "Fresh Analysis" : "Analyze"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p>{hasSavedAnalysis ? "Run a new analysis with latest content" : "Analyze your course content"}</p>
                  <p className="text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Takes 30-60 seconds
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Re-analyze Button */}
          {analysisData && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAnalyze(true)}
                  disabled={isAnalyzing}
                  className="group relative bg-white/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                  aria-label="Re-analyze course content"
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4 mr-2 text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors",
                      isAnalyzing && "animate-spin"
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-slate-700 dark:text-slate-200">Re-analyze</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Run analysis again with latest content</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Export Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={!analysisData}
                className="group relative bg-white/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Export analysis report"
              >
                <Download className="h-4 w-4 mr-2 text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" aria-hidden="true" />
                <span className="text-slate-700 dark:text-slate-200">Export Report</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {analysisData ? "Download analysis as PDF/JSON" : "Run analysis first to export"}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Ask SAM AI Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={onAskSam}
                className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-500 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                aria-label="Ask SAM AI assistant"
              >
                <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Ask SAM AI</span>
                <span className="sm:hidden">SAM</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Get AI-powered insights and recommendations</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Keyboard shortcuts hint - only show on desktop */}
        {analysisData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="hidden md:flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-1"
          >
            <div className="flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Shortcuts:</span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">R</kbd>
                {" "}Re-analyze
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">E</kbd>
                {" "}Export
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">S</kbd>
                {" "}Ask SAM
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}
