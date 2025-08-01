"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileVideo,
  FileAudio,
  FileText,
  FileImage,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Zap,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ContentAnalysisResultsProps {
  analysis: {
    contentType: string;
    qualityScore: number;
    engagementScore: number;
    accessibilityScore: number;
    recommendations: string[];
    warnings?: string[];
    insights: {
      estimatedDuration?: string;
      complexity?: "Low" | "Medium" | "High";
      targetAudience?: string;
      keyTopics?: string[];
    };
  };
  onAccept?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}

export function ContentAnalysisResults({
  analysis,
  onAccept,
  onReject,
  isLoading = false,
}: ContentAnalysisResultsProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getContentIcon = () => {
    switch (analysis.contentType) {
      case "video":
        return <FileVideo className="h-5 w-5" />;
      case "audio":
        return <FileAudio className="h-5 w-5" />;
      case "image":
        return <FileImage className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Good";
    return "Needs Improvement";
  };

  const overallScore =
    (analysis.qualityScore +
      analysis.engagementScore +
      analysis.accessibilityScore) /
    3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "mt-4 p-4 rounded-lg",
        "bg-gradient-to-br from-blue-50 to-cyan-50",
        "dark:from-blue-950/30 dark:to-cyan-950/30",
        "border border-blue-200 dark:border-blue-800"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
            {getContentIcon()}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              AI Content Analysis Complete
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SAM AI has analyzed your {analysis.contentType} content
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-600 dark:text-gray-400"
        >
          {showDetails ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Overall Score */}
      <div className="mb-4 p-3 rounded-lg bg-white/80 dark:bg-gray-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Score
          </span>
          <span className={cn("font-bold", getScoreColor(overallScore))}>
            {getScoreLabel(overallScore)} ({Math.round(overallScore * 100)}%)
          </span>
        </div>
        <Progress value={overallScore * 100} className="h-2" />
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Quality
            </span>
          </div>
          <p className={cn("font-bold text-lg", getScoreColor(analysis.qualityScore))}>
            {Math.round(analysis.qualityScore * 100)}%
          </p>
        </div>

        <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Engagement
            </span>
          </div>
          <p className={cn("font-bold text-lg", getScoreColor(analysis.engagementScore))}>
            {Math.round(analysis.engagementScore * 100)}%
          </p>
        </div>

        <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Accessibility
            </span>
          </div>
          <p className={cn("font-bold text-lg", getScoreColor(analysis.accessibilityScore))}>
            {Math.round(analysis.accessibilityScore * 100)}%
          </p>
        </div>
      </div>

      {/* Warnings */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Warnings
              </p>
              {analysis.warnings.map((warning, index) => (
                <p key={index} className="text-xs text-yellow-700 dark:text-yellow-300">
                  • {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Recommendations
              </p>
              {analysis.recommendations.slice(0, showDetails ? undefined : 2).map((rec, index) => (
                <p key={index} className="text-xs text-green-700 dark:text-green-300">
                  • {rec}
                </p>
              ))}
              {!showDetails && analysis.recommendations.length > 2 && (
                <p className="text-xs text-green-600 dark:text-green-400 italic">
                  +{analysis.recommendations.length - 2} more...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Insights */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-3"
          >
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Content Insights
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {analysis.insights.estimatedDuration && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="ml-1 text-gray-800 dark:text-gray-200">
                          {analysis.insights.estimatedDuration}
                        </span>
                      </div>
                    )}
                    {analysis.insights.complexity && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Complexity:</span>
                        <span className="ml-1 text-gray-800 dark:text-gray-200">
                          {analysis.insights.complexity}
                        </span>
                      </div>
                    )}
                    {analysis.insights.targetAudience && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Best for:</span>
                        <span className="ml-1 text-gray-800 dark:text-gray-200">
                          {analysis.insights.targetAudience}
                        </span>
                      </div>
                    )}
                  </div>
                  {analysis.insights.keyTopics && analysis.insights.keyTopics.length > 0 && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Topics:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.insights.keyTopics.map((topic, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        {onReject && (
          <Button
            onClick={onReject}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
          >
            Upload Different File
          </Button>
        )}
        {onAccept && (
          <Button
            onClick={onAccept}
            size="sm"
            disabled={isLoading}
            className={cn(
              "bg-gradient-to-r from-blue-600 to-cyan-600",
              "hover:from-blue-700 hover:to-cyan-700",
              "text-white"
            )}
          >
            <Zap className="h-4 w-4 mr-1" />
            Accept & Optimize
          </Button>
        )}
      </div>
    </motion.div>
  );
}