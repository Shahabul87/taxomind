"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Types
import type { CourseDepthAnalyzerProps, TabValue } from "./types";

// Hooks
import { useDepthAnalysis } from "./hooks";

// Components
import {
  AnalyzerHeader,
  AnalyzerLoadingState,
  AnalyzerEmptyState,
  ScoreDashboard,
  AnalyzerTabs,
} from "./components";

// Tabs
import {
  OverviewTab,
  StandardsTab,
  DeepAnalysisTab,
  ChaptersTab,
  ObjectivesTab,
  RecommendationsTab,
} from "./tabs";


export function CourseDepthAnalyzer({
  courseId,
  courseData,
  autoLoadSaved = false,
  onAnalysisComplete,
}: CourseDepthAnalyzerProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  // Use the custom hook for all analysis logic
  const {
    isAnalyzing,
    analysisData,
    isCached,
    hasSavedAnalysis,
    isEnhanced,
    overallScore,
    qmCompliance,
    olcCompliance,
    distributionAnalysis,
    deepContentAnalysis,
    transcriptAnalysis,
    complianceSummary,
    analyzeCourse,
    loadSavedAnalysis,
    exportReport,
    askSam,
    // Phase 5-7: Enhanced analysis data and functions
    multiFrameworkData,
    alignmentMatrix,
    evidenceData,
    isLoadingMultiFramework,
    isLoadingAlignment,
    isLoadingEvidence,
    analyzeMultiFramework,
    fetchAlignmentMatrix,
    fetchEvidence,
  } = useDepthAnalysis({ courseId, courseData, autoLoadSaved, onAnalysisComplete });

  // Handle export with validation
  const handleExport = () => {
    if (!analysisData) {
      toast.error("No analysis data to export");
      return;
    }
    exportReport();
  };

  // Render loading state
  if (isAnalyzing) {
    return <AnalyzerLoadingState />;
  }

  // Render initial state (no data, not analyzing)
  if (!analysisData && !isAnalyzing) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <AnalyzerHeader
          isAnalyzing={isAnalyzing}
          analysisData={analysisData}
          isCached={isCached}
          hasSavedAnalysis={hasSavedAnalysis}
          onLoadSaved={loadSavedAnalysis}
          onAnalyze={analyzeCourse}
          onExport={handleExport}
          onAskSam={() => askSam()}
        />
        <AnalyzerEmptyState onAnalyze={() => analyzeCourse(false)} />
      </div>
    );
  }

  // Main render with analysis data
  return (
    <div className="relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative space-y-6 sm:space-y-8">
        {/* Header */}
        <AnalyzerHeader
          isAnalyzing={isAnalyzing}
          analysisData={analysisData}
          isCached={isCached}
          hasSavedAnalysis={hasSavedAnalysis}
          onLoadSaved={loadSavedAnalysis}
          onAnalyze={analyzeCourse}
          onExport={handleExport}
          onAskSam={() => askSam()}
        />

        {analysisData && (
          <AnimatePresence mode="wait">
            <motion.div
              key="analysis-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Score Dashboard */}
              <ScoreDashboard
                scores={analysisData.scores}
                overallScore={overallScore}
              />

              {/* Tabs Section */}
              <AnalyzerTabs
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as TabValue)}
                isEnhanced={isEnhanced}
                hasDeepContentAnalysis={!!deepContentAnalysis}
              >
                {/* Overview Tab */}
                <OverviewTab
                  analysisData={analysisData}
                  courseData={courseData}
                  overallScore={overallScore}
                  onAskSam={askSam}
                />

                {/* Standards Tab */}
                <StandardsTab
                  complianceSummary={complianceSummary}
                  qmCompliance={qmCompliance}
                  olcCompliance={olcCompliance}
                  distributionAnalysis={distributionAnalysis}
                  onAnalyze={analyzeCourse}
                />

                {/* Deep Analysis Tab */}
                <DeepAnalysisTab
                  deepContentAnalysis={deepContentAnalysis}
                  transcriptAnalysis={transcriptAnalysis}
                  onAnalyze={analyzeCourse}
                  // Phase 5-7: Enhanced analysis props
                  multiFrameworkData={multiFrameworkData}
                  alignmentMatrix={alignmentMatrix}
                  evidenceData={evidenceData}
                  isLoadingMultiFramework={isLoadingMultiFramework}
                  isLoadingAlignment={isLoadingAlignment}
                  isLoadingEvidence={isLoadingEvidence}
                  onAnalyzeMultiFramework={analyzeMultiFramework}
                  onFetchAlignmentMatrix={fetchAlignmentMatrix}
                  onFetchEvidence={fetchEvidence}
                />

                {/* Chapters Tab */}
                <ChaptersTab
                  chapters={analysisData.chapterAnalysis}
                  onAskSam={askSam}
                />

                {/* Objectives Tab */}
                <ObjectivesTab
                  objectivesAnalysis={analysisData.objectivesAnalysis}
                  onAskSam={askSam}
                />

                {/* Recommendations Tab */}
                <RecommendationsTab
                  recommendations={analysisData.recommendations}
                  improvementPlan={analysisData.improvementPlan}
                  onAskSam={askSam}
                />
              </AnalyzerTabs>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default CourseDepthAnalyzer;
