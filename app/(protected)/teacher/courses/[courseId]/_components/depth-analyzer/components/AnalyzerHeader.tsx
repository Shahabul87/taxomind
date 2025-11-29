"use client";

import { Button } from "@/components/ui/button";
import {
  Brain,
  CheckCircle2,
  Download,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SamStandardsInfo, SamStandardsBadge } from "@/sam-ai-tutor/components/integration/sam-standards-info";
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
    <div className="flex flex-col gap-4 pt-6 sm:pt-4 md:pt-0">
      {/* Cached Indicator - Floating badge */}
      {isCached && analysisData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-900/40 px-2.5 py-1 rounded-full backdrop-blur-md border border-emerald-200/50 dark:border-emerald-700/50 shadow-sm"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-medium">Cached Analysis</span>
          <span className="sm:hidden font-medium">Cached</span>
        </motion.div>
      )}

      {/* Title Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl blur-lg opacity-40" />
            <div className="relative p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
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

      {/* Action Buttons - Premium styling */}
      <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full">
        {/* View Saved Results Button - Show when there's saved analysis but not loaded */}
        {hasSavedAnalysis && !analysisData && !isAnalyzing && (
          <Button
            size="sm"
            onClick={onLoadSaved}
            disabled={isAnalyzing}
            className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-500 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">View Saved Results</span>
            <span className="sm:hidden">View Saved</span>
          </Button>
        )}

        {/* Run Analysis Button - Show when no saved analysis or user wants fresh analysis */}
        {!analysisData && !isAnalyzing && (
          <Button
            size="sm"
            onClick={() => onAnalyze(false)}
            disabled={isAnalyzing}
            className={cn(
              "relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-500 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto",
              hasSavedAnalysis && "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"
            )}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">
              {hasSavedAnalysis ? "Run Fresh Analysis" : "Analyze Course"}
            </span>
            <span className="sm:hidden">
              {hasSavedAnalysis ? "Fresh Analysis" : "Analyze"}
            </span>
          </Button>
        )}

        {/* Re-analyze Button - Show after analysis is loaded */}
        {analysisData && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAnalyze(true)}
            disabled={isAnalyzing}
            className="group relative bg-white/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 mr-2 text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors",
                isAnalyzing && "animate-spin"
              )}
            />
            <span className="text-slate-700 dark:text-slate-200">Re-analyze</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={!analysisData}
          className="group relative bg-white/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto"
        >
          <Download className="h-4 w-4 mr-2 text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
          <span className="text-slate-700 dark:text-slate-200">Export Report</span>
        </Button>

        <Button
          size="sm"
          onClick={onAskSam}
          className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 bg-[length:200%_100%] hover:bg-[position:100%_0] text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-500 h-10 sm:h-11 text-sm font-medium w-full xs:w-auto"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Ask SAM AI</span>
          <span className="sm:hidden">SAM</span>
        </Button>
      </div>
    </div>
  );
}
