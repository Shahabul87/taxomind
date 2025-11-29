"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type {
  AnalysisData,
  AnalysisState,
  EnhancedAnalysisResponse,
  QMComplianceData,
  OLCComplianceData,
  DistributionAnalysisData,
  DeepContentAnalysisData,
  TranscriptAnalysisData,
  ComplianceSummary,
  CourseData,
  AnalysisCompleteData,
} from "../types";

interface UseDepthAnalysisOptions {
  courseId: string;
  courseData: CourseData;
  /** Auto-load saved analysis on mount (e.g., from Recent Analyses click) */
  autoLoadSaved?: boolean;
  /** Callback when analysis completes - used to update parent state */
  onAnalysisComplete?: (data: AnalysisCompleteData) => void;
}

interface UseDepthAnalysisReturn extends AnalysisState {
  analyzeCourse: (forceReanalyze?: boolean) => Promise<void>;
  loadSavedAnalysis: () => Promise<void>;
  overallScore: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  exportReport: () => void;
  askSam: (context?: string) => void;
}

export function useDepthAnalysis({
  courseId,
  courseData,
  autoLoadSaved = false,
  onAnalysisComplete,
}: UseDepthAnalysisOptions): UseDepthAnalysisReturn {
  const router = useRouter();

  // Core state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [hasInitialAnalysis, setHasInitialAnalysis] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Saved analysis state
  const [isCheckingSaved, setIsCheckingSaved] = useState(true);
  const [hasSavedAnalysis, setHasSavedAnalysis] = useState(false);
  const [savedAnalysisDate, setSavedAnalysisDate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);

  // Phase 1-4 Enhanced Analysis State
  const [qmCompliance, setQmCompliance] = useState<QMComplianceData | null>(null);
  const [olcCompliance, setOlcCompliance] = useState<OLCComplianceData | null>(null);
  const [distributionAnalysis, setDistributionAnalysis] = useState<DistributionAnalysisData | null>(null);
  const [deepContentAnalysis, setDeepContentAnalysis] = useState<DeepContentAnalysisData | null>(null);
  const [transcriptAnalysis, setTranscriptAnalysis] = useState<TranscriptAnalysisData | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);

  // Check for saved analysis on mount
  useEffect(() => {
    const checkSavedAnalysis = async () => {
      try {
        const response = await fetch(`/api/course-depth-analysis?courseId=${courseId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.hasSavedAnalysis) {
            setHasSavedAnalysis(true);
            setSavedAnalysisDate(new Date(data.savedAnalysis.analyzedAt));
            setIsStale(data.isStale);
          }
        }
      } catch (error) {
        logger.error("Error checking saved analysis:", error);
      } finally {
        setIsCheckingSaved(false);
      }
    };

    checkSavedAnalysis();
  }, [courseId]);

  // Load saved analysis without running new analysis
  const loadSavedAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/course-depth-analysis?courseId=${courseId}`);
      if (!response.ok) throw new Error("Failed to load saved analysis");

      const data = await response.json();

      if (data.hasSavedAnalysis && data.savedAnalysis) {
        setAnalysisData(data.savedAnalysis.analysis);
        setIsCached(true);
        setHasInitialAnalysis(true);
        toast.success("Loaded saved analysis results");
      } else {
        toast.info("No saved analysis found. Click \"Run Analysis\" to analyze this course.");
      }
    } catch (error) {
      logger.error("Error loading saved analysis:", error);
      toast.error("Failed to load saved analysis");
    } finally {
      setIsAnalyzing(false);
    }
  }, [courseId]);

  // Auto-load saved analysis when coming from Recent Analyses
  useEffect(() => {
    if (autoLoadSaved && !isCheckingSaved && hasSavedAnalysis && !analysisData) {
      loadSavedAnalysis();
    }
  }, [autoLoadSaved, isCheckingSaved, hasSavedAnalysis, analysisData, loadSavedAnalysis]);

  // Analyze course depth
  const analyzeCourse = useCallback(async (forceReanalyze = false) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/course-depth-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, forceReanalyze, useEnhancedEngine: true }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data: EnhancedAnalysisResponse = await response.json();

      // Set basic analysis data
      setAnalysisData(data.analysis);
      setIsCached(data.cached || false);
      setHasInitialAnalysis(true);
      setIsEnhanced(data.enhanced || false);

      // Set Phase 1-4 enhanced data
      if (data.qmCompliance) {
        setQmCompliance(data.qmCompliance);
      }
      if (data.olcCompliance) {
        setOlcCompliance(data.olcCompliance);
      }
      if (data.complianceSummary) {
        setComplianceSummary({
          qmScore: data.complianceSummary.qmScore,
          olcScore: data.complianceSummary.olcScore,
          combinedScore: data.complianceSummary.combinedScore,
          qmCertifiable: data.complianceSummary.qmCertifiable,
          olcQualityLevel: data.complianceSummary.olcQualityLevel,
        });
      }
      if (data.distributionAnalysis) {
        setDistributionAnalysis(data.distributionAnalysis);
      }
      if (data.deepContentAnalysis) {
        setDeepContentAnalysis(data.deepContentAnalysis);
      }
      if (data.transcriptAnalysis) {
        setTranscriptAnalysis(data.transcriptAnalysis);
      }

      if (data.cached) {
        toast.info("Loaded cached analysis (content unchanged)");
      } else {
        const enhancedMsg = data.enhanced ? " (Enhanced with Phase 1-4 analysis)" : "";
        toast.success(`Course analysis completed successfully!${enhancedMsg}`);

        // Notify parent component of analysis completion
        // This updates the Recent Analyses section immediately
        const depthScore = data.analysis?.scores?.depth ?? 0;
        if (onAnalysisComplete) {
          onAnalysisComplete({
            courseId,
            courseTitle: courseData.title,
            cognitiveDepth: Math.round(depthScore),
            analyzedAt: new Date(),
          });
        }

        // Refresh the page data to update Recent Analyses and Not Analyzed sections
        router.refresh();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Analysis error:", { error: errorMessage });
      toast.error("Failed to analyze course depth");
    } finally {
      setIsAnalyzing(false);
    }
  }, [courseId]);

  // Calculate overall score
  const overallScore = analysisData
    ? Math.round(
        (analysisData.scores.depth +
          analysisData.scores.balance +
          analysisData.scores.complexity +
          analysisData.scores.completeness) /
          4
      )
    : 0;

  // Export analysis report
  const exportReport = useCallback(() => {
    if (!analysisData) return;

    const report = {
      courseTitle: courseData.title,
      analysisDate: new Date().toISOString(),
      ...analysisData,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `course-depth-analysis-${courseId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Analysis report exported successfully!");
  }, [analysisData, courseData.title, courseId]);

  // Open SAM chat with context
  const askSam = useCallback(
    (context?: string) => {
      const message =
        context ||
        `Help me improve my course based on the depth analysis. The course currently has a depth score of ${overallScore}/100.`;

      // Dispatch event for SAM - the chatbot listens for this and auto-opens
      window.dispatchEvent(
        new CustomEvent("sam-context-message", {
          detail: {
            message,
            context: {
              analysisData,
              courseData,
            },
          },
        })
      );
    },
    [overallScore, analysisData, courseData]
  );

  return {
    isAnalyzing,
    analysisData,
    hasInitialAnalysis,
    isCached,
    isCheckingSaved,
    hasSavedAnalysis,
    savedAnalysisDate,
    isStale,
    isEnhanced,
    qmCompliance,
    olcCompliance,
    distributionAnalysis,
    deepContentAnalysis,
    transcriptAnalysis,
    complianceSummary,
    analyzeCourse,
    loadSavedAnalysis,
    overallScore,
    activeTab,
    setActiveTab,
    exportReport,
    askSam,
  };
}
