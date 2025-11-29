"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Layers, FileText, Video, AlertCircle, XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getScoreColor, DOK_LABELS } from "../utils";
import type { DeepContentAnalysisData, TranscriptAnalysisData } from "../types";

interface DeepAnalysisTabProps {
  deepContentAnalysis: DeepContentAnalysisData | null;
  transcriptAnalysis: TranscriptAnalysisData | null;
  onAnalyze: (force: boolean) => void;
}

export function DeepAnalysisTab({
  deepContentAnalysis,
  transcriptAnalysis,
  onAnalyze,
}: DeepAnalysisTabProps) {
  return (
    <TabsContent value="deep-analysis" className="mt-3 sm:mt-4 md:mt-6 space-y-4 sm:space-y-6">
      {/* Deep Content Analysis */}
      {deepContentAnalysis && <DeepContentCard deepContentAnalysis={deepContentAnalysis} />}

      {/* Transcript Analysis */}
      {transcriptAnalysis && <TranscriptCard transcriptAnalysis={transcriptAnalysis} />}

      {/* Empty State */}
      {!deepContentAnalysis && !transcriptAnalysis && (
        <EmptyDeepAnalysisState onAnalyze={() => onAnalyze(true)} />
      )}
    </TabsContent>
  );
}

function DeepContentCard({ deepContentAnalysis }: { deepContentAnalysis: DeepContentAnalysisData }) {
  return (
    <Card className="p-4 sm:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
      <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        <Layers className="h-5 w-5 text-blue-600" />
        Deep Content Analysis
        <Badge variant="outline" className="ml-2 text-xs">
          {deepContentAnalysis.analysisMethod}
        </Badge>
      </h3>

      {/* Content Coverage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <FileText className="h-5 w-5 mx-auto text-blue-600 mb-1" />
          <p className="text-xl font-bold">{deepContentAnalysis.contentCoverage.totalSources}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Content Sources</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <FileText className="h-5 w-5 mx-auto text-green-600 mb-1" />
          <p className="text-xl font-bold">{deepContentAnalysis.contentCoverage.analyzedSources}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Analyzed</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p className="text-xl font-bold">{deepContentAnalysis.contentCoverage.totalWords.toLocaleString()}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Words</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p className={cn("text-xl font-bold", getScoreColor(deepContentAnalysis.overallConfidence * 100))}>
            {Math.round(deepContentAnalysis.overallConfidence * 100)}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Confidence</p>
        </div>
      </div>

      {/* Bloom's Distribution from Deep Analysis */}
      <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg mb-6">
        <h4 className="text-sm font-medium mb-3">Bloom&apos;s Distribution (Sentence-Level)</h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(deepContentAnalysis.bloomsDistribution).map(([level, value]) => (
            <div key={level} className="text-center p-2 bg-white/50 dark:bg-slate-900/50 rounded">
              <p className="text-xs font-medium truncate">{level}</p>
              <p
                className={cn(
                  "text-lg font-bold",
                  value >= 20 ? "text-green-600" : value >= 10 ? "text-yellow-600" : "text-red-600"
                )}
              >
                {Math.round(value)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* DOK Distribution */}
      {deepContentAnalysis.dokDistribution && (
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg mb-6">
          <h4 className="text-sm font-medium mb-3">Webb&apos;s DOK Distribution</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(deepContentAnalysis.dokDistribution).map(([level, value]) => (
              <div key={level} className="text-center p-2 bg-white/50 dark:bg-slate-900/50 rounded">
                <p className="text-xs font-medium">{DOK_LABELS[level] || level}</p>
                <p className="text-lg font-bold text-blue-600">{Math.round(value)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Gaps */}
      {deepContentAnalysis.contentGaps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            Content Gaps Identified
          </h4>
          {deepContentAnalysis.contentGaps.slice(0, 4).map((gap, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-lg border-l-4",
                gap.severity === "high"
                  ? "bg-red-50/50 dark:bg-red-900/20 border-red-500"
                  : gap.severity === "medium"
                  ? "bg-yellow-50/50 dark:bg-yellow-900/20 border-yellow-500"
                  : "bg-blue-50/50 dark:bg-blue-900/20 border-blue-500"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium">{gap.type}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    gap.severity === "high"
                      ? "text-red-600"
                      : gap.severity === "medium"
                      ? "text-yellow-600"
                      : "text-blue-600"
                  )}
                >
                  {gap.severity}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{gap.description}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 italic">{gap.recommendation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Top Verb Analysis */}
      {deepContentAnalysis.verbFrequencySummary.length > 0 && (
        <div className="mt-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg">
          <h4 className="text-sm font-medium mb-3">Most Frequent Action Verbs</h4>
          <div className="flex flex-wrap gap-2">
            {deepContentAnalysis.verbFrequencySummary.slice(0, 10).map((verb, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {verb.verb} ({verb.count}) - {verb.level}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function TranscriptCard({ transcriptAnalysis }: { transcriptAnalysis: TranscriptAnalysisData }) {
  return (
    <Card className="p-4 sm:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
      <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        <Video className="h-5 w-5 text-red-600" />
        Video Transcript Analysis
      </h3>

      {/* Video Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p className="text-xl font-bold">{transcriptAnalysis.totalVideos}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Videos</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p className="text-xl font-bold text-green-600">{transcriptAnalysis.videosWithTranscripts}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">With Transcripts</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p className={cn("text-xl font-bold", getScoreColor(transcriptAnalysis.transcriptCoveragePercent))}>
            {Math.round(transcriptAnalysis.transcriptCoveragePercent)}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Coverage</p>
        </div>
        <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg text-center">
          <p className="text-xl font-bold">{transcriptAnalysis.totalWordCount.toLocaleString()}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Words</p>
        </div>
      </div>

      {/* Quality Distribution */}
      {transcriptAnalysis.qualityDistribution && Object.keys(transcriptAnalysis.qualityDistribution).length > 0 && (
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg mb-4">
          <h4 className="text-sm font-medium mb-3">Transcript Quality Distribution</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(transcriptAnalysis.qualityDistribution).map(([quality, count]) => (
              <div key={quality} className="text-center p-2 bg-white/50 dark:bg-slate-900/50 rounded">
                <p className="text-xs font-medium capitalize">{quality}</p>
                <p className="text-lg font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Transcripts Warning */}
      {transcriptAnalysis.videosMissingTranscripts > 0 && (
        <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {transcriptAnalysis.videosMissingTranscripts} videos missing transcripts
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Adding transcripts improves accessibility and enables better content analysis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {transcriptAnalysis.recommendations.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold">Recommendations</h4>
          {transcriptAnalysis.recommendations.map((rec, idx) => (
            <p key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <ArrowRight className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
              {rec}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
}

function EmptyDeepAnalysisState({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <Card className="p-8 sm:p-12 text-center backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-xl">
      <Layers className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-base sm:text-lg font-medium mb-2">No Deep Analysis Available</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Re-analyze your course to get sentence-level content and transcript analysis.
      </p>
      <Button
        onClick={onAnalyze}
        className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Run Deep Analysis
      </Button>
    </Card>
  );
}
