"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import {
  Award,
  Shield,
  Star,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getScoreColor, getQualityLevelColor } from "../utils";
import type {
  QMComplianceData,
  OLCComplianceData,
  DistributionAnalysisData,
  ComplianceSummary,
} from "../types";

interface StandardsTabProps {
  complianceSummary: ComplianceSummary | null;
  qmCompliance: QMComplianceData | null;
  olcCompliance: OLCComplianceData | null;
  distributionAnalysis: DistributionAnalysisData | null;
  onAnalyze: (force: boolean) => void;
}

export function StandardsTab({
  complianceSummary,
  qmCompliance,
  olcCompliance,
  distributionAnalysis,
  onAnalyze,
}: StandardsTabProps) {
  return (
    <TabsContent value="standards" className="mt-3 sm:mt-4 md:mt-6 space-y-4 sm:space-y-6">
      {/* Compliance Summary Cards */}
      {complianceSummary && <ComplianceSummaryCards summary={complianceSummary} />}

      {/* QM Compliance Details */}
      {qmCompliance && <QMComplianceCard qmCompliance={qmCompliance} />}

      {/* OLC Compliance Details */}
      {olcCompliance && <OLCComplianceCard olcCompliance={olcCompliance} />}

      {/* Distribution Analysis */}
      {distributionAnalysis && <DistributionAnalysisCard distributionAnalysis={distributionAnalysis} />}

      {/* Empty State */}
      {!complianceSummary && !qmCompliance && !olcCompliance && !distributionAnalysis && (
        <EmptyStandardsState onAnalyze={() => onAnalyze(true)} />
      )}
    </TabsContent>
  );
}

function ComplianceSummaryCards({ summary }: { summary: ComplianceSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
      {/* Combined Score */}
      <Card className="p-4 sm:p-6 backdrop-blur-md bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-white/20 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold">Combined Score</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">Overall Compliance</p>
          </div>
        </div>
        <p className={cn("text-3xl sm:text-4xl font-bold", getScoreColor(summary.combinedScore))}>
          {Math.round(summary.combinedScore)}%
        </p>
        <Progress value={summary.combinedScore} className="mt-3 h-2" />
      </Card>

      {/* QM Score */}
      <Card className="p-4 sm:p-6 backdrop-blur-md bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-white/20 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold">Quality Matters</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">Higher Ed Rubric</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className={cn("text-3xl sm:text-4xl font-bold", getScoreColor(summary.qmScore))}>
            {Math.round(summary.qmScore)}%
          </p>
          {summary.qmCertifiable ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Certifiable
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Ready
            </Badge>
          )}
        </div>
        <Progress value={summary.qmScore} className="mt-3 h-2" />
      </Card>

      {/* OLC Score */}
      <Card className="p-4 sm:p-6 backdrop-blur-md bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/20 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold">OLC Scorecard</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">Quality Standards</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className={cn("text-3xl sm:text-4xl font-bold", getScoreColor(summary.olcScore))}>
            {Math.round(summary.olcScore)}%
          </p>
          <Badge className={getQualityLevelColor(summary.olcQualityLevel)}>
            {summary.olcQualityLevel}
          </Badge>
        </div>
        <Progress value={summary.olcScore} className="mt-3 h-2" />
      </Card>
    </div>
  );
}

function QMComplianceCard({ qmCompliance }: { qmCompliance: QMComplianceData }) {
  return (
    <Card className="p-4 sm:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
      <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-green-600" />
        Quality Matters - Higher Education Rubric
      </h3>

      {/* Category Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(qmCompliance.categoryScores).map(([category, scoreData]) => (
          <div key={category} className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">
              Standard {category}
            </p>
            <p className={cn("text-xl font-bold", getScoreColor(scoreData.percentage))}>
              {Math.round(scoreData.percentage)}%
            </p>
            <Progress value={scoreData.percentage} className="mt-2 h-1.5" />
          </div>
        ))}
      </div>

      {/* Essentials Status */}
      <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Essential Standards</p>
          <Badge
            variant="outline"
            className={cn(
              qmCompliance.essentialsCount.met === qmCompliance.essentialsCount.total
                ? "text-green-600"
                : "text-yellow-600"
            )}
          >
            {qmCompliance.essentialsCount.met} / {qmCompliance.essentialsCount.total} Met
          </Badge>
        </div>
        <Progress
          value={
            qmCompliance.essentialsCount.total > 0
              ? (qmCompliance.essentialsCount.met / qmCompliance.essentialsCount.total) * 100
              : 0
          }
          className="h-2"
        />
      </div>

      {/* Top Recommendations */}
      {qmCompliance.topRecommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            Top Recommendations
          </h4>
          {qmCompliance.topRecommendations.slice(0, 3).map((rec, idx) => (
            <div key={idx} className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium">{rec.title}</p>
                <Badge
                  variant="outline"
                  className={cn(
                    rec.priority === "high"
                      ? "text-red-600 border-red-300"
                      : rec.priority === "medium"
                      ? "text-yellow-600 border-yellow-300"
                      : "text-blue-600 border-blue-300"
                  )}
                >
                  {rec.priority}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{rec.description}</p>
              {rec.actionSteps.length > 0 && (
                <ul className="space-y-1">
                  {rec.actionSteps.slice(0, 2).map((step, stepIdx) => (
                    <li key={stepIdx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <ArrowRight className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                      {step}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function OLCComplianceCard({ olcCompliance }: { olcCompliance: OLCComplianceData }) {
  return (
    <Card className="p-4 sm:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
      <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        <Star className="h-5 w-5 text-blue-600" />
        OLC Quality Scorecard
      </h3>

      {/* Category Scores */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {Object.entries(olcCompliance.categoryScores).map(([category, scoreData]) => (
          <div key={category} className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">
              {category.replace(/([A-Z])/g, " $1").trim()}
            </p>
            <p className={cn("text-xl font-bold", getScoreColor(scoreData.percentage))}>
              {Math.round(scoreData.percentage)}%
            </p>
            <Progress value={scoreData.percentage} className="mt-2 h-1.5" />
          </div>
        ))}
      </div>

      {/* Strengths & Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {olcCompliance.strengths.length > 0 && (
          <div className="p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Strengths
            </h4>
            <ul className="space-y-1">
              {olcCompliance.strengths.slice(0, 4).map((strength, idx) => (
                <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
        {olcCompliance.areasForImprovement.length > 0 && (
          <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {olcCompliance.areasForImprovement.slice(0, 4).map((area, idx) => (
                <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function DistributionAnalysisCard({
  distributionAnalysis,
}: {
  distributionAnalysis: DistributionAnalysisData;
}) {
  return (
    <Card className="p-4 sm:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg">
      <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-purple-600" />
        Cognitive Distribution Analysis
      </h3>

      {/* Course Type & Alignment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Detected Course Type</p>
          <p className="text-lg font-semibold capitalize">{distributionAnalysis.detectedType}</p>
          <p className="text-xs text-gray-500 mt-1">Confidence: {Math.round(distributionAnalysis.typeConfidence)}%</p>
        </div>
        <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Alignment Score</p>
          <p className={cn("text-2xl font-bold", getScoreColor(distributionAnalysis.alignmentScore))}>
            {Math.round(distributionAnalysis.alignmentScore)}%
          </p>
        </div>
        <div className="p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cognitive Rigor</p>
          <p className={cn("text-2xl font-bold", getScoreColor(distributionAnalysis.cognitiveRigorScore))}>
            {Math.round(distributionAnalysis.cognitiveRigorScore)}%
          </p>
        </div>
      </div>

      {/* Balance Assessment */}
      {distributionAnalysis.balanceAssessment && (
        <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg mb-6">
          <h4 className="text-sm font-medium mb-3">Cognitive Balance</h4>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Lower Order</p>
              <p className="text-xl font-bold text-red-600">
                {Math.round(distributionAnalysis.balanceAssessment.lowerOrder)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Middle Order</p>
              <p className="text-xl font-bold text-yellow-600">
                {Math.round(distributionAnalysis.balanceAssessment.middleOrder)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Higher Order</p>
              <p className="text-xl font-bold text-green-600">
                {Math.round(distributionAnalysis.balanceAssessment.higherOrder)}%
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Ideal ratio: {distributionAnalysis.balanceAssessment.idealRatio.lower}% /{" "}
            {distributionAnalysis.balanceAssessment.idealRatio.middle}% /{" "}
            {distributionAnalysis.balanceAssessment.idealRatio.higher}% (L/M/H)
          </p>
          {distributionAnalysis.balanceAssessment.recommendation && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 p-2 bg-white/50 dark:bg-slate-900/50 rounded">
              {distributionAnalysis.balanceAssessment.recommendation}
            </p>
          )}
        </div>
      )}

      {/* Research Basis */}
      {distributionAnalysis.researchBasis && (
        <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg text-xs">
          <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Research Basis</p>
          <p className="text-gray-600 dark:text-gray-400">{distributionAnalysis.researchBasis.citation}</p>
        </div>
      )}
    </Card>
  );
}

function EmptyStandardsState({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <Card className="p-8 sm:p-12 text-center backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-xl">
      <Award className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-base sm:text-lg font-medium mb-2">No Standards Analysis Available</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Re-analyze your course to get QM and OLC compliance scores.
      </p>
      <Button
        onClick={onAnalyze}
        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Run Standards Analysis
      </Button>
    </Card>
  );
}
