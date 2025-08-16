"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  ChevronRight,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface ChapterAnalysis {
  chapterTitle: string;
  bloomsLevel: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

interface ChapterDepthAnalysisProps {
  chapters: ChapterAnalysis[];
  onImproveChapter: (chapterTitle: string) => void;
}

export function ChapterDepthAnalysis({ chapters, onImproveChapter }: ChapterDepthAnalysisProps) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-gradient-to-r from-emerald-500/80 via-emerald-600/90 to-emerald-700/80 dark:from-emerald-400/80 dark:via-emerald-500/90 dark:to-emerald-600/80 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-400/20 border-t border-white/40 dark:border-emerald-300/20";
    if (score >= 60) return "bg-gradient-to-r from-amber-500/80 via-amber-600/90 to-amber-700/80 dark:from-amber-400/80 dark:via-amber-500/90 dark:to-amber-600/80 shadow-lg shadow-amber-500/20 dark:shadow-amber-400/20 border-t border-white/40 dark:border-amber-300/20";
    return "bg-gradient-to-r from-red-500/80 via-red-600/90 to-red-700/80 dark:from-red-400/80 dark:via-red-500/90 dark:to-red-600/80 shadow-lg shadow-red-500/20 dark:shadow-red-400/20 border-t border-white/40 dark:border-red-300/20";
  };

  const getBloomsLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'Create': 'bg-purple-100/60 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 backdrop-blur-sm border border-purple-200/30 dark:border-purple-700/30 shadow-sm shadow-purple-500/10',
      'Evaluate': 'bg-blue-100/60 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 shadow-sm shadow-blue-500/10',
      'Analyze': 'bg-cyan-100/60 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400 backdrop-blur-sm border border-cyan-200/30 dark:border-cyan-700/30 shadow-sm shadow-cyan-500/10',
      'Apply': 'bg-green-100/60 text-green-800 dark:bg-green-900/20 dark:text-green-400 backdrop-blur-sm border border-green-200/30 dark:border-green-700/30 shadow-sm shadow-green-500/10',
      'Understand': 'bg-yellow-100/60 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 backdrop-blur-sm border border-yellow-200/30 dark:border-yellow-700/30 shadow-sm shadow-yellow-500/10',
      'Remember': 'bg-red-100/60 text-red-800 dark:bg-red-900/20 dark:text-red-400 backdrop-blur-sm border border-red-200/30 dark:border-red-700/30 shadow-sm shadow-red-500/10'
    };
    return colors[level] || 'bg-gray-100/60 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 shadow-sm shadow-gray-500/10';
  };

  const toggleChapter = (chapterTitle: string) => {
    setExpandedChapter(expandedChapter === chapterTitle ? null : chapterTitle);
  };

  // Sort chapters by score (lowest first for easy identification of weak areas)
  const sortedChapters = [...chapters].sort((a, b) => a.score - b.score);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Chapter-by-Chapter Analysis
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {chapters.length} chapters analyzed
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-lg shadow-gray-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
              <p className={cn(
                "text-2xl font-bold",
                getScoreColor(Math.round(chapters.reduce((acc, ch) => acc + ch.score, 0) / chapters.length))
              )}>
                {Math.round(chapters.reduce((acc, ch) => acc + ch.score, 0) / chapters.length)}
              </p>
            </div>
            <Target className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-lg shadow-gray-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Needs Improvement</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {chapters.filter(ch => ch.score < 60).length}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-lg shadow-gray-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Strong Chapters</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {chapters.filter(ch => ch.score >= 80).length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Chapter Cards */}
      <div className="space-y-4">
        {sortedChapters.map((chapter, index) => (
          <motion.div
            key={chapter.chapterTitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={cn(
              "overflow-hidden transition-all duration-200",
              "bg-white/30 dark:bg-gray-800/30 backdrop-blur-md",
              "border border-white/20 dark:border-gray-700/20",
              "shadow-lg shadow-gray-500/10",
              expandedChapter === chapter.chapterTitle && "ring-2 ring-purple-500/50 shadow-xl shadow-purple-500/20"
            )}>
              {/* Chapter Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-white/20 dark:hover:bg-gray-800/20 hover:backdrop-blur-lg transition-all duration-200"
                onClick={() => toggleChapter(chapter.chapterTitle)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{chapter.chapterTitle}</h4>
                      <Badge className={getBloomsLevelColor(chapter.bloomsLevel)}>
                        {chapter.bloomsLevel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Score:</span>
                        <span className={cn("font-semibold", getScoreColor(chapter.score))}>
                          {chapter.score}/100
                        </span>
                      </div>
                      <Progress 
                        value={chapter.score} 
                        className="w-32 h-2"
                        indicatorClassName={getProgressColor(chapter.score)}
                      />
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    "h-5 w-5 text-gray-400 transition-transform",
                    expandedChapter === chapter.chapterTitle && "rotate-90"
                  )} />
                </div>
              </div>

              {/* Expanded Content */}
              {expandedChapter === chapter.chapterTitle && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t"
                >
                  <div className="p-4 space-y-4">
                    {/* Strengths */}
                    {chapter.strengths.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm text-green-700 dark:text-green-400 mb-2">
                          Strengths
                        </h5>
                        <ul className="space-y-1">
                          {chapter.strengths.map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {chapter.weaknesses.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm text-red-700 dark:text-red-400 mb-2">
                          Areas for Improvement
                        </h5>
                        <ul className="space-y-1">
                          {chapter.weaknesses.map((weakness, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        onClick={() => onImproveChapter(chapter.chapterTitle)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Improve This Chapter with SAM
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-4 bg-purple-50/40 dark:bg-purple-950/10 backdrop-blur-sm border border-purple-200/30 dark:border-purple-800/30 shadow-lg shadow-purple-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-100">
              Need help improving your chapters?
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              SAM can help you enhance depth and balance across all chapters
            </p>
          </div>
          <Button
            onClick={() => onImproveChapter("all")}
            variant="outline"
            className="border-purple-300/50 hover:bg-purple-100/50 dark:border-purple-700/50 dark:hover:bg-purple-900/30 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Improve All Chapters
          </Button>
        </div>
      </Card>
    </div>
  );
}