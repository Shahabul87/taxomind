"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Brain,
  Plus,
  Trophy,
  Target,
  Clock,
  BarChart3,
  Loader2,
  PlayCircle,
  Eye,
  RotateCcw,
} from "lucide-react";
import type { PracticeProblemSetSummary, PracticeStats } from "@/types/practice-problems";
import type { GeneratePracticeSetInput } from "@/lib/validations/practice-problems";

interface PracticeDashboardProps {
  sets: PracticeProblemSetSummary[];
  stats: PracticeStats | null;
  sectionTitle: string;
  isGenerating: boolean;
  isStarting: boolean;
  onGenerate: (input: GeneratePracticeSetInput) => Promise<string | null>;
  onStart: (setId: string) => void;
  onViewResults: (setId: string, attemptId: string) => void;
}

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
] as const;

const BLOOMS_OPTIONS = [
  { value: "REMEMBER", label: "Remember" },
  { value: "UNDERSTAND", label: "Understand" },
  { value: "APPLY", label: "Apply" },
  { value: "ANALYZE", label: "Analyze" },
  { value: "EVALUATE", label: "Evaluate" },
  { value: "CREATE", label: "Create" },
] as const;

const COUNT_OPTIONS = [3, 5, 7, 10] as const;

const QUESTION_TYPE_OPTIONS = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "FILL_IN_BLANK", label: "Fill in Blank" },
  { value: "ESSAY", label: "Essay" },
] as const;

export function PracticeDashboard({
  sets,
  stats,
  sectionTitle,
  isGenerating,
  isStarting,
  onGenerate,
  onStart,
  onViewResults,
}: PracticeDashboardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<string>("intermediate");
  const [bloomsLevel, setBloomsLevel] = useState<string>("APPLY");
  const [count, setCount] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "MULTIPLE_CHOICE",
    "SHORT_ANSWER",
  ]);

  const handleGenerate = async () => {
    const input: GeneratePracticeSetInput = {
      topic: sectionTitle,
      difficulty: difficulty as GeneratePracticeSetInput["difficulty"],
      bloomsLevel: bloomsLevel as GeneratePracticeSetInput["bloomsLevel"],
      count,
      questionTypes: selectedTypes as GeneratePracticeSetInput["questionTypes"],
      learningObjectives: [],
    };

    const setId = await onGenerate(input);
    if (setId) {
      setDialogOpen(false);
      onStart(setId);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {stats && stats.totalSets > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Sets</p>
                <p className="text-lg font-semibold">{stats.totalSets}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Attempts</p>
                <p className="text-lg font-semibold">{stats.totalAttempts}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="text-lg font-semibold">
                  {stats.avgScore > 0 ? `${Math.round(stats.avgScore)}%` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Solved</p>
                <p className="text-lg font-semibold">{stats.problemsSolved}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">Practice Sets</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Generate New Set
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Practice Problems</DialogTitle>
              <DialogDescription>
                Configure your practice set for &quot;{sectionTitle}&quot;
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="blooms">Bloom&apos;s Level</Label>
                  <Select value={bloomsLevel} onValueChange={setBloomsLevel}>
                    <SelectTrigger id="blooms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOMS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Number of Questions</Label>
                <div className="flex gap-2">
                  {COUNT_OPTIONS.map((n) => (
                    <Button
                      key={n}
                      type="button"
                      variant={count === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCount(n)}
                      className="flex-1"
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Question Types</Label>
                <div className="grid grid-cols-2 gap-2">
                  {QUESTION_TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedTypes.includes(opt.value)}
                        onCheckedChange={() => toggleType(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || selectedTypes.length === 0}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    Generate {count} Problems
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sets List */}
      {sets.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Brain className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-1">No practice sets yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Generate your first set of AI-powered practice problems
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialogOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Generate Practice Set
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sets.map((set) => (
            <Card key={set.id} className="border border-border/60 hover:border-border transition-colors">
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {set.title || set.topic}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {set._count.questions} Q
                      </Badge>
                      {set.difficulty && (
                        <Badge variant="outline" className="text-[10px] px-1.5 capitalize">
                          {set.difficulty}
                        </Badge>
                      )}
                      {set.bloomsLevel && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {set.bloomsLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {set.bestScore !== null && (
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {Math.round(set.bestScore)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Best</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-3 px-4 pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />
                      {set.totalAttempts} attempt{set.totalAttempts !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(set.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {set.totalAttempts > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => onViewResults(set.id, "")}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 px-3 text-xs"
                      disabled={isStarting}
                      onClick={() => onStart(set.id)}
                    >
                      {isStarting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <PlayCircle className="h-3 w-3 mr-1" />
                          {set.totalAttempts > 0 ? "Retry" : "Start"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
