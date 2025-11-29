"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Target, CheckCircle2, Lightbulb, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getScoreColor, SMART_CRITERIA } from "../utils";
import type { ObjectiveAnalysis } from "../types";

interface ObjectivesTabProps {
  objectivesAnalysis: ObjectiveAnalysis[];
  onAskSam: (context: string) => void;
}

export function ObjectivesTab({ objectivesAnalysis, onAskSam }: ObjectivesTabProps) {
  return (
    <TabsContent value="objectives" className="mt-3 sm:mt-4 md:mt-6 space-y-3 sm:space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5 sm:mb-3 md:mb-4">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold flex items-center gap-1.5 sm:gap-2">
          <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          Learning Objectives Analysis
        </h3>
        <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {objectivesAnalysis.length} objectives analyzed
        </div>
      </div>

      {/* SMART Criteria Overview */}
      <SMARTOverviewCard objectivesAnalysis={objectivesAnalysis} />

      {/* Individual Objectives Analysis */}
      <div className="space-y-3 sm:space-y-4">
        {objectivesAnalysis.map((obj, index) => (
          <ObjectiveCard key={index} objective={obj} index={index} onAskSam={onAskSam} />
        ))}
      </div>

      {/* Empty State */}
      {objectivesAnalysis.length === 0 && <EmptyObjectivesState onAskSam={onAskSam} />}
    </TabsContent>
  );
}

function SMARTOverviewCard({ objectivesAnalysis }: { objectivesAnalysis: ObjectiveAnalysis[] }) {
  return (
    <Card className="p-3 sm:p-4 md:p-6 backdrop-blur-md bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-white/20 shadow-xl">
      <h4 className="text-xs sm:text-sm md:text-base font-semibold mb-2.5 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
        SMART Criteria Overview
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 md:gap-3">
        {SMART_CRITERIA.map((criterion, idx) => {
          const avgScore =
            objectivesAnalysis.reduce((acc, obj) => {
              const key = criterion.toLowerCase().replace("-", "") as keyof typeof obj.smartCriteria;
              const criteriaItem = obj.smartCriteria?.[key];
              const score =
                criteriaItem && typeof criteriaItem === "object" && "score" in criteriaItem
                  ? (criteriaItem as { score: number }).score
                  : 0;
              return acc + (score || 0);
            }, 0) / (objectivesAnalysis.length || 1);

          return (
            <div
              key={idx}
              className="text-center p-1.5 sm:p-2 md:p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm"
            >
              <p className="text-[9px] xs:text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 break-words">
                {criterion}
              </p>
              <p className={cn("text-base xs:text-lg sm:text-xl md:text-2xl font-bold", getScoreColor(avgScore))}>
                {Math.round(avgScore)}%
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ObjectiveCard({
  objective,
  index,
  onAskSam,
}: {
  objective: ObjectiveAnalysis;
  index: number;
  onAskSam: (context: string) => void;
}) {
  const smartAverage = objective.smartCriteria
    ? Object.values(objective.smartCriteria).reduce((acc, criterion) => acc + criterion.score, 0) / 5
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="p-3 sm:p-4 md:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
        <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
          {/* Objective Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2.5 sm:gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg break-words">
                {objective.objective}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mt-1.5 sm:mt-2">
                <Badge
                  variant="outline"
                  className="bg-white/50 dark:bg-slate-700/50 border-white/30 text-[9px] xs:text-[10px] sm:text-xs"
                >
                  {objective.bloomsLevel}
                </Badge>
                {objective.actionVerb && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "bg-white/50 dark:bg-slate-700/50 border-white/30 text-[9px] xs:text-[10px] sm:text-xs",
                      objective.verbStrength === "strong"
                        ? "text-green-700 dark:text-green-400"
                        : objective.verbStrength === "moderate"
                        ? "text-yellow-700 dark:text-yellow-400"
                        : "text-red-700 dark:text-red-400"
                    )}
                  >
                    <span className="hidden sm:inline">
                      Verb: {objective.actionVerb} ({objective.verbStrength})
                    </span>
                    <span className="sm:hidden">{objective.actionVerb}</span>
                  </Badge>
                )}
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                  <span className="text-[9px] xs:text-[10px] sm:text-xs">Clarity:</span>
                  <span
                    className={cn(
                      "text-[10px] xs:text-xs sm:text-sm font-semibold",
                      getScoreColor(objective.clarityScore || 0)
                    )}
                  >
                    {objective.clarityScore || 0}%
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
                SMART Score
              </p>
              <p className={cn("text-lg sm:text-xl md:text-2xl font-bold", getScoreColor(smartAverage))}>
                {Math.round(smartAverage)}%
              </p>
            </div>
          </div>

          {/* SMART Criteria Breakdown */}
          {objective.smartCriteria && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {Object.entries(objective.smartCriteria).map(([criterion, data]) => (
                <div
                  key={criterion}
                  className="p-1.5 sm:p-2 md:p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <p className="text-[9px] xs:text-[10px] sm:text-xs font-medium capitalize truncate pr-0.5 sm:pr-1">
                      {criterion}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] xs:text-xs sm:text-sm font-bold flex-shrink-0",
                        getScoreColor(data.score)
                      )}
                    >
                      {data.score}%
                    </span>
                  </div>
                  <Progress value={data.score} className="h-0.5 sm:h-1 mb-0.5 sm:mb-1" />
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                    {data.feedback}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {objective.suggestions.length > 0 && (
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-2.5 sm:p-3 md:p-4 rounded-lg backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Improvement Suggestions
              </p>
              <ul className="space-y-0.5 sm:space-y-1">
                {objective.suggestions.map((suggestion, idx) => (
                  <li
                    key={idx}
                    className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5 sm:gap-2 break-words"
                  >
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improved Version */}
          {objective.improvedVersion && (
            <div className="bg-green-50/50 dark:bg-green-900/20 p-2.5 sm:p-3 md:p-4 rounded-lg backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Suggested Improvement
              </p>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 italic break-words">
                &ldquo;{objective.improvedVersion}&rdquo;
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 pt-1.5 sm:pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAskSam(`Improve this learning objective: "${objective.objective}"`)}
              className="bg-white/30 dark:bg-slate-800/30 border-white/20 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-800/50 h-9 sm:h-10 text-xs sm:text-sm w-full xs:w-auto"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Improve with SAM</span>
              <span className="sm:hidden">Improve</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAskSam(`Create activities for this objective: "${objective.objective}"`)}
              className="bg-white/30 dark:bg-slate-800/30 border-white/20 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-800/50 h-9 sm:h-10 text-xs sm:text-sm w-full xs:w-auto"
            >
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Generate Activities</span>
              <span className="sm:hidden">Activities</span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function EmptyObjectivesState({ onAskSam }: { onAskSam: (context: string) => void }) {
  return (
    <Card className="p-6 sm:p-8 md:p-12 text-center backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-xl">
      <Target className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto text-gray-400 mb-3 sm:mb-4" />
      <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 break-words px-2">
        No learning objectives found. Add objectives to your course for analysis.
      </p>
      <Button
        onClick={() => onAskSam("Help me create effective learning objectives for my course")}
        className="mt-3 sm:mt-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
      >
        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
        Create Objectives with SAM
      </Button>
    </Card>
  );
}
