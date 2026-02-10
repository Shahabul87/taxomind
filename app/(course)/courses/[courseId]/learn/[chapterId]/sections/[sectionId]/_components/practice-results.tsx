"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ChevronDown,
  RotateCcw,
  Plus,
  ArrowLeft,
  Brain,
  Clock,
  Target,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { PracticeAttemptResults, PracticeQuestionResult, BloomsPerformanceMap } from "@/types/practice-problems";

interface PracticeResultsProps {
  results: PracticeAttemptResults;
  onRetry: () => void;
  onNewSet: () => void;
  onBackToDashboard: () => void;
}

const BLOOMS_LEVELS = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"];

function getScoreColor(pct: number): string {
  if (pct >= 80) return "text-green-600 dark:text-green-400";
  if (pct >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBadgeVariant(pct: number): "default" | "secondary" | "destructive" {
  if (pct >= 80) return "default";
  if (pct >= 60) return "secondary";
  return "destructive";
}

export function PracticeResults({
  results,
  onRetry,
  onNewSet,
  onBackToDashboard,
}: PracticeResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const score = results.scorePercentage ?? 0;
  const bloomsPerf = results.bloomsPerformance as BloomsPerformanceMap | null;

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Score Summary */}
      <Card className="border-2 border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Your Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(score)}`}>
                {Math.round(score)}%
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {results.correctAnswers}/{results.totalQuestions} correct
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                {results.earnedPoints}/{results.totalPoints} pts
              </div>
              {results.timeSpent && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
                </div>
              )}
            </div>
          </div>
          <Progress value={score} className="h-2" />
        </CardContent>
      </Card>

      {/* Bloom's Performance */}
      {bloomsPerf && Object.keys(bloomsPerf).length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-purple-500" />
              Bloom&apos;s Taxonomy Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {BLOOMS_LEVELS.map((level) => {
                const data = bloomsPerf[level];
                if (!data || data.total === 0) return null;
                const pct = (data.correct / data.total) * 100;
                return (
                  <div key={level} className="flex items-center gap-2">
                    <span className="text-xs w-20 text-muted-foreground capitalize">
                      {level.toLowerCase()}
                    </span>
                    <div className="flex-1">
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    <span className="text-xs font-medium w-16 text-right">
                      {data.correct}/{data.total} ({Math.round(pct)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weak/Strong Areas */}
      {(results.weakAreas.length > 0 || results.strongAreas.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {results.strongAreas.length > 0 && (
            <Card className="border-green-200 dark:border-green-800/50">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Strong Areas
                </p>
                <div className="flex flex-wrap gap-1">
                  {results.strongAreas.map((area) => (
                    <Badge key={area} variant="secondary" className="text-[10px] capitalize">
                      {area.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {results.weakAreas.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800/50">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Needs Work
                </p>
                <div className="flex flex-wrap gap-1">
                  {results.weakAreas.map((area) => (
                    <Badge key={area} variant="outline" className="text-[10px] capitalize">
                      {area.toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Per-Question Review */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Question Review</h3>
        {results.answers.map((answer, index) => (
          <QuestionReviewCard
            key={answer.id}
            answer={answer}
            index={index}
            isExpanded={expandedQuestions.has(answer.id)}
            onToggle={() => toggleQuestion(answer.id)}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onBackToDashboard} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1">
          <RotateCcw className="h-4 w-4" />
          Retry Set
        </Button>
        <Button size="sm" onClick={onNewSet} className="gap-1">
          <Plus className="h-4 w-4" />
          New Set
        </Button>
      </div>
    </div>
  );
}

function QuestionReviewCard({
  answer,
  index,
  isExpanded,
  onToggle,
}: {
  answer: PracticeQuestionResult;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isCorrect = answer.isCorrect === true;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className={`border ${isCorrect ? "border-green-200 dark:border-green-800/40" : "border-red-200 dark:border-red-800/40"}`}>
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-3 flex items-center gap-2 hover:bg-accent/30 transition-colors rounded-lg">
            <span className="shrink-0">
              {isCorrect ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </span>
            <span className="text-xs font-medium text-muted-foreground w-5">
              Q{index + 1}
            </span>
            <span className="text-sm flex-1 truncate">{answer.question}</span>
            <Badge
              variant={getScoreBadgeVariant(
                answer.pointsEarned > 0 ? 100 : 0
              )}
              className="text-[10px] shrink-0"
            >
              {answer.pointsEarned} pts
            </Badge>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform text-muted-foreground ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">
                  Your Answer:
                </span>
                <p className={`text-sm ${isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                  {answer.answer || <span className="italic text-muted-foreground">No answer</span>}
                </p>
              </div>
              {!isCorrect && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">
                    Correct:
                  </span>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {answer.correctAnswer}
                  </p>
                </div>
              )}
              {answer.explanation && (
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">
                    Explanation:
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {answer.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* AI Feedback */}
            {answer.aiFeedback && (
              <div className="p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                  <Brain className="h-3 w-3" /> AI Feedback
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  {answer.aiFeedback}
                </p>
              </div>
            )}

            {/* Misconceptions */}
            {answer.misconceptions.length > 0 && (
              <div className="text-xs">
                <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">Misconceptions:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {answer.misconceptions.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bloom's */}
            <div className="flex items-center gap-2 text-[10px]">
              {answer.targetBloomsLevel && (
                <Badge variant="outline" className="text-[10px]">
                  Target: {answer.targetBloomsLevel}
                </Badge>
              )}
              {answer.demonstratedLevel && (
                <Badge variant="secondary" className="text-[10px]">
                  Demonstrated: {answer.demonstratedLevel}
                </Badge>
              )}
              {answer.hintsUsed > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {answer.hintsUsed} hint{answer.hintsUsed !== 1 ? "s" : ""} used
                </Badge>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
